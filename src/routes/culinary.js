import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { validateRecipe, validateNutritionEntry } from '../utils/validation.js';
import { EventTypes } from '../services/eventBus.js';

const router = express.Router();

// Save recipe
router.post('/recipes', async (req, res, next) => {
  try {
    const { error, value } = validateRecipe(req.body);
    if (error) {
      throw new ValidationError('Invalid recipe data', error.details);
    }

    const { name, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, nutritionInfo } = value;
    const recipeId = uuidv4();

    await req.db.run(
      `INSERT INTO recipes (id, user_id, name, description, ingredients, instructions, nutrition_info, prep_time, cook_time, servings, difficulty, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipeId, req.user.id, name, description, JSON.stringify(ingredients), JSON.stringify(instructions), 
       JSON.stringify(nutritionInfo), prepTime, cookTime, servings, difficulty, JSON.stringify(tags)]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.RECIPE_SAVED,
      recipeId,
      req.user.id,
      { name, servings, nutritionInfo, tags }
    );

    res.status(201).json({
      message: 'Recipe saved successfully',
      recipe: { id: recipeId, name, servings, prepTime, cookTime, difficulty }
    });
  } catch (error) {
    next(error);
  }
});

// Get recipes
router.get('/recipes', async (req, res, next) => {
  try {
    const { search, tags, difficulty, maxPrepTime, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM recipes WHERE (user_id = ? OR user_id IS NULL)';
    const params = [req.user.id];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (maxPrepTime) {
      query += ' AND prep_time <= ?';
      params.push(parseInt(maxPrepTime));
    }

    if (tags) {
      query += ' AND tags LIKE ?';
      params.push(`%${tags}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const recipes = await req.db.all(query, params);

    // Parse JSON fields
    const parsedRecipes = recipes.map(recipe => ({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      nutrition_info: recipe.nutrition_info ? JSON.parse(recipe.nutrition_info) : null,
      tags: recipe.tags ? JSON.parse(recipe.tags) : []
    }));

    res.json({
      recipes: parsedRecipes,
      count: parsedRecipes.length
    });
  } catch (error) {
    next(error);
  }
});

// Get single recipe
router.get('/recipes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const recipe = await req.db.get(
      'SELECT * FROM recipes WHERE id = ?',
      [id]
    );

    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    // Parse JSON fields
    const parsedRecipe = {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      nutrition_info: recipe.nutrition_info ? JSON.parse(recipe.nutrition_info) : null,
      tags: recipe.tags ? JSON.parse(recipe.tags) : []
    };

    res.json({ recipe: parsedRecipe });
  } catch (error) {
    next(error);
  }
});

// Create meal plan
router.post('/meal-plans', async (req, res, next) => {
  try {
    const { name, startDate, endDate, meals, nutritionTargets } = req.body;
    
    if (!name || !startDate || !endDate || !meals) {
      throw new ValidationError('Missing required meal plan fields');
    }

    const planId = uuidv4();

    // Calculate total calories and macro breakdown
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach(meal => {
      if (meal.nutritionInfo) {
        totalCalories += meal.nutritionInfo.calories || 0;
        totalProtein += meal.nutritionInfo.protein || 0;
        totalCarbs += meal.nutritionInfo.carbs || 0;
        totalFat += meal.nutritionInfo.fat || 0;
      }
    });

    const macroBreakdown = {
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      proteinPercent: totalCalories > 0 ? (totalProtein * 4 / totalCalories * 100) : 0,
      carbsPercent: totalCalories > 0 ? (totalCarbs * 4 / totalCalories * 100) : 0,
      fatPercent: totalCalories > 0 ? (totalFat * 9 / totalCalories * 100) : 0
    };

    await req.db.run(
      `INSERT INTO meal_plans (id, user_id, name, start_date, end_date, meals, nutrition_targets, total_calories, macro_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, req.user.id, name, startDate, endDate, JSON.stringify(meals), 
       JSON.stringify(nutritionTargets), totalCalories, JSON.stringify(macroBreakdown)]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.MEAL_PLAN_CREATED,
      planId,
      req.user.id,
      { name, startDate, endDate, totalCalories, mealsCount: meals.length }
    );

    res.status(201).json({
      message: 'Meal plan created successfully',
      mealPlan: { id: planId, name, startDate, endDate, totalCalories, macroBreakdown }
    });
  } catch (error) {
    next(error);
  }
});

// Get meal plans
router.get('/meal-plans', async (req, res, next) => {
  try {
    const { active, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM meal_plans WHERE user_id = ?';
    const params = [req.user.id];

    if (active === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND start_date <= ? AND end_date >= ?';
      params.push(today, today);
    }

    if (startDate) {
      query += ' AND end_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND start_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC';

    const mealPlans = await req.db.all(query, params);

    // Parse JSON fields
    const parsedMealPlans = mealPlans.map(plan => ({
      ...plan,
      meals: JSON.parse(plan.meals),
      nutrition_targets: plan.nutrition_targets ? JSON.parse(plan.nutrition_targets) : null,
      macro_breakdown: plan.macro_breakdown ? JSON.parse(plan.macro_breakdown) : null
    }));

    res.json({
      mealPlans: parsedMealPlans,
      count: parsedMealPlans.length
    });
  } catch (error) {
    next(error);
  }
});

export { router as culinaryRouter };
// Log nutrition entry
router.post('/nutrition', async (req, res, next) => {
  try {
    const { error, value } = validateNutritionEntry(req.body);
    if (error) {
      throw new ValidationError('Invalid nutrition entry data', error.details);
    }

    const { foodItem, quantity, unit, mealType, timestamp, nutritionFacts } = value;
    const entryId = uuidv4();
    const recordTime = timestamp || new Date().toISOString();

    await req.db.run(
      `INSERT INTO nutrition_entries (id, user_id, food_item, quantity, unit, meal_type, timestamp, nutrition_facts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entryId, req.user.id, foodItem, quantity, unit, mealType, recordTime, JSON.stringify(nutritionFacts)]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.MEAL_CONSUMED,
      entryId,
      req.user.id,
      { foodItem, quantity, unit, mealType, nutritionFacts, timestamp: recordTime }
    );

    res.status(201).json({
      message: 'Nutrition entry logged successfully',
      entry: { id: entryId, foodItem, quantity, unit, mealType, nutritionFacts }
    });
  } catch (error) {
    next(error);
  }
});

// Get nutrition entries
router.get('/nutrition', async (req, res, next) => {
  try {
    const { date, mealType, startDate, endDate, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM nutrition_entries WHERE user_id = ?';
    const params = [req.user.id];

    if (date) {
      query += ' AND DATE(timestamp) = ?';
      params.push(date);
    }

    if (mealType) {
      query += ' AND meal_type = ?';
      params.push(mealType);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const entries = await req.db.all(query, params);

    // Parse nutrition facts JSON
    const parsedEntries = entries.map(entry => ({
      ...entry,
      nutrition_facts: JSON.parse(entry.nutrition_facts)
    }));

    res.json({
      entries: parsedEntries,
      count: parsedEntries.length
    });
  } catch (error) {
    next(error);
  }
});

// Get daily nutrition summary
router.get('/nutrition/daily/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    
    const entries = await req.db.all(
      'SELECT * FROM nutrition_entries WHERE user_id = ? AND DATE(timestamp) = ?',
      [req.user.id, date]
    );

    // Calculate daily totals
    let dailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    const mealBreakdown = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
    };

    entries.forEach(entry => {
      const nutrition = JSON.parse(entry.nutrition_facts);
      
      // Add to daily totals
      Object.keys(dailyTotals).forEach(key => {
        dailyTotals[key] += nutrition[key] || 0;
      });

      // Add to meal breakdown
      if (mealBreakdown[entry.meal_type]) {
        mealBreakdown[entry.meal_type].calories += nutrition.calories || 0;
        mealBreakdown[entry.meal_type].protein += nutrition.protein || 0;
        mealBreakdown[entry.meal_type].carbs += nutrition.carbs || 0;
        mealBreakdown[entry.meal_type].fat += nutrition.fat || 0;
        mealBreakdown[entry.meal_type].count += 1;
      }
    });

    res.json({
      date,
      dailyTotals,
      mealBreakdown,
      entriesCount: entries.length
    });
  } catch (error) {
    next(error);
  }
});

// Generate grocery list from meal plan
router.post('/grocery-lists', async (req, res, next) => {
  try {
    const { mealPlanId, name } = req.body;
    
    if (!mealPlanId) {
      throw new ValidationError('Meal plan ID is required');
    }

    // Get meal plan
    const mealPlan = await req.db.get(
      'SELECT * FROM meal_plans WHERE id = ? AND user_id = ?',
      [mealPlanId, req.user.id]
    );

    if (!mealPlan) {
      throw new NotFoundError('Meal plan not found');
    }

    const meals = JSON.parse(mealPlan.meals);
    const groceryItems = new Map();

    // Aggregate ingredients from all meals
    meals.forEach(meal => {
      if (meal.recipe && meal.recipe.ingredients) {
        meal.recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.name}_${ingredient.unit}`;
          if (groceryItems.has(key)) {
            groceryItems.get(key).quantity += ingredient.quantity;
          } else {
            groceryItems.set(key, {
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: ingredient.category || 'Other'
            });
          }
        });
      }
    });

    const items = Array.from(groceryItems.values());
    const listId = uuidv4();
    const listName = name || `Grocery List for ${mealPlan.name}`;

    await req.db.run(
      `INSERT INTO grocery_lists (id, user_id, name, items, meal_plan_id)
       VALUES (?, ?, ?, ?, ?)`,
      [listId, req.user.id, listName, JSON.stringify(items), mealPlanId]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.GROCERY_LIST_GENERATED,
      listId,
      req.user.id,
      { mealPlanName: mealPlan.name, itemsCount: items.length }
    );

    res.status(201).json({
      message: 'Grocery list generated successfully',
      groceryList: { id: listId, name: listName, items, itemsCount: items.length }
    });
  } catch (error) {
    next(error);
  }
});

// Get grocery lists
router.get('/grocery-lists', async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    
    const groceryLists = await req.db.all(
      'SELECT * FROM grocery_lists WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
      [req.user.id, status]
    );

    // Parse items JSON
    const parsedLists = groceryLists.map(list => ({
      ...list,
      items: JSON.parse(list.items)
    }));

    res.json({
      groceryLists: parsedLists,
      count: parsedLists.length
    });
  } catch (error) {
    next(error);
  }
});