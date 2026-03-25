import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EventTypes } from '../services/eventBus.js';

const router = express.Router();

// Get cross-domain recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const { domain, limit = 10 } = req.query;
    
    // Get recent events for the user
    const recentEvents = req.eventBus.getUserEvents(req.user.id);
    const recommendations = [];

    // Generate health-based fitness recommendations
    const healthEvents = recentEvents.filter(e => 
      e.eventType === EventTypes.HEALTH_METRIC_RECORDED || 
      e.eventType === EventTypes.HEALTH_CONDITION_UPDATED
    );

    healthEvents.slice(0, 5).forEach(event => {
      if (event.payload.type === 'blood_pressure_systolic' && event.payload.value > 140) {
        recommendations.push({
          id: uuidv4(),
          type: 'health_to_fitness',
          priority: 'high',
          title: 'Consider Low-Impact Exercise',
          content: 'Your blood pressure readings suggest focusing on low-impact activities like walking or swimming.',
          targetDomain: 'fitness',
          sourceEvents: [event.id],
          actions: ['view_workouts', 'schedule_activity']
        });
      }

      if (event.payload.type === 'weight' && event.payload.value > 0) {
        recommendations.push({
          id: uuidv4(),
          type: 'health_to_nutrition',
          priority: 'medium',
          title: 'Nutrition Plan Adjustment',
          content: 'Based on your weight tracking, consider adjusting your caloric intake and meal planning.',
          targetDomain: 'nutrition',
          sourceEvents: [event.id],
          actions: ['view_meal_plans', 'track_nutrition']
        });
      }
    });

    // Generate fitness-based nutrition recommendations
    const fitnessEvents = recentEvents.filter(e => 
      e.eventType === EventTypes.WORKOUT_COMPLETED || 
      e.eventType === EventTypes.ACTIVITY_LOGGED
    );

    fitnessEvents.slice(0, 3).forEach(event => {
      if (event.payload.caloriesBurned > 300) {
        recommendations.push({
          id: uuidv4(),
          type: 'fitness_to_nutrition',
          priority: 'medium',
          title: 'Post-Workout Nutrition',
          content: `After burning ${event.payload.caloriesBurned} calories, consider a protein-rich meal for recovery.`,
          targetDomain: 'nutrition',
          sourceEvents: [event.id],
          actions: ['find_recipes', 'log_meal']
        });
      }
    });

    // Generate nutrition-based fitness recommendations
    const nutritionEvents = recentEvents.filter(e => 
      e.eventType === EventTypes.MEAL_CONSUMED
    );

    const dailyCalories = nutritionEvents
      .filter(e => {
        const eventDate = new Date(e.timestamp).toDateString();
        const today = new Date().toDateString();
        return eventDate === today;
      })
      .reduce((sum, e) => sum + (e.payload.nutritionFacts?.calories || 0), 0);

    if (dailyCalories > 2500) {
      recommendations.push({
        id: uuidv4(),
        type: 'nutrition_to_fitness',
        priority: 'medium',
        title: 'Extra Activity Suggested',
        content: `You've consumed ${dailyCalories} calories today. Consider an extra 30-minute walk.`,
        targetDomain: 'fitness',
        sourceEvents: nutritionEvents.slice(0, 3).map(e => e.id),
        actions: ['log_activity', 'start_workout']
      });
    }

    // Filter by domain if specified
    let filteredRecommendations = recommendations;
    if (domain) {
      filteredRecommendations = recommendations.filter(r => r.targetDomain === domain);
    }

    // Limit results
    filteredRecommendations = filteredRecommendations.slice(0, parseInt(limit));

    res.json({
      recommendations: filteredRecommendations,
      count: filteredRecommendations.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get wellness dashboard data
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Get today's health metrics
    const todayHealthMetrics = await req.db.all(
      'SELECT * FROM health_metrics WHERE user_id = ? AND timestamp >= ? AND timestamp < ?',
      [req.user.id, startOfDay, endOfDay]
    );

    // Get today's activities
    const todayActivities = await req.db.all(
      'SELECT * FROM activities WHERE user_id = ? AND timestamp >= ? AND timestamp < ?',
      [req.user.id, startOfDay, endOfDay]
    );

    // Get today's nutrition
    const todayNutrition = await req.db.all(
      'SELECT * FROM nutrition_entries WHERE user_id = ? AND timestamp >= ? AND timestamp < ?',
      [req.user.id, startOfDay, endOfDay]
    );

    // Calculate daily nutrition totals
    const nutritionTotals = todayNutrition.reduce((totals, entry) => {
      const nutrition = JSON.parse(entry.nutrition_facts);
      totals.calories += nutrition.calories || 0;
      totals.protein += nutrition.protein || 0;
      totals.carbs += nutrition.carbs || 0;
      totals.fat += nutrition.fat || 0;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Calculate activity totals
    const activityTotals = todayActivities.reduce((totals, activity) => {
      totals.duration += activity.duration || 0;
      totals.calories += activity.calories_burned || 0;
      totals.count += 1;
      return totals;
    }, { duration: 0, calories: 0, count: 0 });

    // Get active goals
    const activeGoals = await req.db.all(
      'SELECT * FROM fitness_goals WHERE user_id = ? AND status = ?',
      [req.user.id, 'active']
    );

    // Get upcoming appointments
    const upcomingAppointments = await req.db.all(
      `SELECT * FROM appointments 
       WHERE user_id = ? AND appointment_date > ? AND status = 'scheduled'
       ORDER BY appointment_date ASC LIMIT 5`,
      [req.user.id, new Date().toISOString()]
    );

    // Get pending medications
    const medications = await req.db.all(
      'SELECT * FROM medications WHERE user_id = ? AND (end_date IS NULL OR end_date > ?)',
      [req.user.id, new Date().toISOString()]
    );

    // Get recent events for activity feed
    const recentEvents = req.eventBus.getUserEvents(req.user.id).slice(0, 10);

    res.json({
      date: today.toISOString().split('T')[0],
      health: {
        metrics: todayHealthMetrics,
        upcomingAppointments: upcomingAppointments.slice(0, 3),
        activeMedications: medications.length
      },
      fitness: {
        activities: todayActivities,
        totals: activityTotals,
        activeGoals: activeGoals.length
      },
      nutrition: {
        entries: todayNutrition,
        totals: nutritionTotals,
        mealsLogged: new Set(todayNutrition.map(e => e.meal_type)).size
      },
      goals: activeGoals.map(goal => ({
        ...goal,
        progress: Math.min((goal.current_value / goal.target_value) * 100, 100)
      })),
      recentActivity: recentEvents.map(event => ({
        id: event.id,
        type: event.eventType,
        timestamp: event.timestamp,
        description: getEventDescription(event)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get wellness insights
router.get('/insights', async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const insights = [];

    // Analyze health trends
    const healthMetrics = await req.db.all(
      'SELECT * FROM health_metrics WHERE user_id = ? AND timestamp >= ? ORDER BY timestamp',
      [req.user.id, startDate.toISOString()]
    );

    const weightMetrics = healthMetrics.filter(m => m.type === 'weight');
    if (weightMetrics.length >= 2) {
      const firstWeight = weightMetrics[0].value;
      const lastWeight = weightMetrics[weightMetrics.length - 1].value;
      const weightChange = lastWeight - firstWeight;
      
      insights.push({
        type: 'health_trend',
        category: 'weight',
        title: 'Weight Trend',
        description: `Your weight has ${weightChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(weightChange).toFixed(1)} kg over the last ${period} days.`,
        value: weightChange,
        trend: weightChange > 0 ? 'up' : 'down'
      });
    }

    // Analyze activity patterns
    const activities = await req.db.all(
      'SELECT * FROM activities WHERE user_id = ? AND timestamp >= ?',
      [req.user.id, startDate.toISOString()]
    );

    const avgDailyActivities = activities.length / parseInt(period);
    const totalCaloriesBurned = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);

    insights.push({
      type: 'fitness_pattern',
      category: 'activity',
      title: 'Activity Level',
      description: `You're averaging ${avgDailyActivities.toFixed(1)} activities per day and burning ${Math.round(totalCaloriesBurned / parseInt(period))} calories daily.`,
      value: avgDailyActivities,
      trend: avgDailyActivities >= 1 ? 'good' : 'low'
    });

    // Analyze nutrition patterns
    const nutritionEntries = await req.db.all(
      'SELECT * FROM nutrition_entries WHERE user_id = ? AND timestamp >= ?',
      [req.user.id, startDate.toISOString()]
    );

    const avgDailyCalories = nutritionEntries.reduce((sum, entry) => {
      const nutrition = JSON.parse(entry.nutrition_facts);
      return sum + (nutrition.calories || 0);
    }, 0) / parseInt(period);

    insights.push({
      type: 'nutrition_pattern',
      category: 'calories',
      title: 'Caloric Intake',
      description: `Your average daily caloric intake is ${Math.round(avgDailyCalories)} calories.`,
      value: avgDailyCalories,
      trend: avgDailyCalories >= 1800 && avgDailyCalories <= 2500 ? 'good' : 'attention'
    });

    res.json({
      period: `${period} days`,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate event descriptions
function getEventDescription(event) {
  switch (event.eventType) {
    case EventTypes.HEALTH_METRIC_RECORDED:
      return `Recorded ${event.payload.type}: ${event.payload.value} ${event.payload.unit}`;
    case EventTypes.WORKOUT_COMPLETED:
      return `Completed workout: ${event.payload.workoutName}`;
    case EventTypes.ACTIVITY_LOGGED:
      return `Logged ${event.payload.name} for ${event.payload.duration} minutes`;
    case EventTypes.MEAL_CONSUMED:
      return `Logged ${event.payload.foodItem} (${event.payload.mealType})`;
    case EventTypes.MEDICATION_TAKEN:
      return `Took medication: ${event.payload.medicationName}`;
    case EventTypes.FITNESS_GOAL_ACHIEVED:
      return `Achieved fitness goal: ${event.payload.description}`;
    default:
      return `${event.eventType} event occurred`;
  }
}

export { router as integrationRouter };