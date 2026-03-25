const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/culinary', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Culinary DB connected');
}).catch(err => {
  console.warn('⚠️ Culinary DB connection failed, using mock data:', err.message);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dietaryRestrictions: [String],
  allergies: [String],
  preferences: [String],
  nutritionGoals: {
    dailyCalories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  createdAt: { type: Date, default: Date.now }
});

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    notes: String
  }],
  instructions: [{
    step: { type: Number, required: true },
    instruction: { type: String, required: true },
    duration: Number,
    temperature: Number
  }],
  prepTime: Number, // minutes
  cookTime: Number, // minutes
  servings: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  cuisine: String,
  tags: [String],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Meal Plan Schema
const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  meals: [{
    day: { type: String, required: true }, // Monday, Tuesday, etc.
    breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    dinner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    snacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
  }],
  createdAt: { type: Date, default: Date.now }
});

// Nutrition Entry Schema
const nutritionEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  meals: [{
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    foods: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }]
  }],
  totalNutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);
const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
const NutritionEntry = mongoose.model('NutritionEntry', nutritionEntrySchema);

// Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const { cuisine, difficulty, tags } = req.query;
    let query = {};
    
    if (cuisine) query.cuisine = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    
    const recipes = await Recipe.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new recipe
app.post('/api/recipes', async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recipe by ID
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('createdBy', 'name email');
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meal plans
app.get('/api/meal-plans', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const mealPlans = await MealPlan.find(query)
      .populate('userId', 'name email')
      .populate('meals.breakfast meals.lunch meals.dinner meals.snacks')
      .sort({ startDate: -1 });
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add meal plan
app.post('/api/meal-plans', async (req, res) => {
  try {
    const mealPlan = new MealPlan(req.body);
    await mealPlan.save();
    res.status(201).json(mealPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get nutrition entries
app.get('/api/nutrition', async (req, res) => {
  try {
    const { userId, date } = req.query;
    let query = {};
    
    if (userId) query.userId = userId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const entries = await NutritionEntry.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add nutrition entry
app.post('/api/nutrition', async (req, res) => {
  try {
    const entry = new NutritionEntry(req.body);
    
    // Calculate total nutrition
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    entry.meals.forEach(meal => {
      meal.foods.forEach(food => {
        totalCalories += food.calories || 0;
        totalProtein += food.protein || 0;
        totalCarbs += food.carbs || 0;
        totalFat += food.fat || 0;
      });
    });
    
    entry.totalNutrition = {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };
    
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecipes = await Recipe.countDocuments();
    const totalMealPlans = await MealPlan.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = await NutritionEntry.countDocuments({
      date: { $gte: today }
    });

    const recentRecipes = await Recipe.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEntries = await NutritionEntry.find()
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Popular cuisines
    const cuisineStats = await Recipe.aggregate([
      { $group: { _id: '$cuisine', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalUsers,
      totalRecipes,
      totalMealPlans,
      todayEntries,
      recentRecipes,
      recentEntries,
      popularCuisines: cuisineStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️ Culinary App running on port ${PORT}`);
});

module.exports = app;