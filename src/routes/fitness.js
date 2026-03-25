import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { validateWorkout, validateActivity } from '../utils/validation.js';
import { EventTypes } from '../services/eventBus.js';

const router = express.Router();

// Create workout
router.post('/workouts', async (req, res, next) => {
  try {
    const { error, value } = validateWorkout(req.body);
    if (error) {
      throw new ValidationError('Invalid workout data', error.details);
    }

    const { name, exercises, duration, intensity, notes } = value;
    const workoutId = uuidv4();

    await req.db.run(
      `INSERT INTO workouts (id, user_id, name, exercises, duration, intensity, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [workoutId, req.user.id, name, JSON.stringify(exercises), duration, intensity, notes]
    );

    res.status(201).json({
      message: 'Workout created successfully',
      workout: { id: workoutId, name, exercises, duration, intensity }
    });
  } catch (error) {
    next(error);
  }
});

// Complete workout
router.post('/workouts/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caloriesBurned, actualDuration, notes } = req.body;
    const completedAt = new Date().toISOString();

    // Verify workout belongs to user
    const workout = await req.db.get(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    // Update workout with completion data
    await req.db.run(
      `UPDATE workouts SET calories_burned = ?, duration = ?, completed_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [caloriesBurned, actualDuration || workout.duration, completedAt, notes || workout.notes, id, req.user.id]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.WORKOUT_COMPLETED,
      id,
      req.user.id,
      { 
        workoutName: workout.name, 
        duration: actualDuration || workout.duration,
        caloriesBurned,
        completedAt 
      }
    );

    res.json({
      message: 'Workout completed successfully',
      workout: { 
        id, 
        name: workout.name, 
        completedAt, 
        caloriesBurned,
        duration: actualDuration || workout.duration
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get workouts
router.get('/workouts', async (req, res, next) => {
  try {
    const { completed, startDate, endDate, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM workouts WHERE user_id = ?';
    const params = [req.user.id];

    if (completed === 'true') {
      query += ' AND completed_at IS NOT NULL';
    } else if (completed === 'false') {
      query += ' AND completed_at IS NULL';
    }

    if (startDate) {
      query += ' AND (completed_at >= ? OR created_at >= ?)';
      params.push(startDate, startDate);
    }

    if (endDate) {
      query += ' AND (completed_at <= ? OR created_at <= ?)';
      params.push(endDate, endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const workouts = await req.db.all(query, params);

    // Parse exercises JSON
    const parsedWorkouts = workouts.map(workout => ({
      ...workout,
      exercises: JSON.parse(workout.exercises)
    }));

    res.json({
      workouts: parsedWorkouts,
      count: parsedWorkouts.length
    });
  } catch (error) {
    next(error);
  }
});

// Log activity
router.post('/activities', async (req, res, next) => {
  try {
    const { error, value } = validateActivity(req.body);
    if (error) {
      throw new ValidationError('Invalid activity data', error.details);
    }

    const { type, name, duration, caloriesBurned, intensity, timestamp, source, metadata } = value;
    const activityId = uuidv4();
    const recordTime = timestamp || new Date().toISOString();

    await req.db.run(
      `INSERT INTO activities (id, user_id, type, name, duration, calories_burned, intensity, timestamp, source, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [activityId, req.user.id, type, name, duration, caloriesBurned, intensity, recordTime, source, JSON.stringify(metadata)]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.ACTIVITY_LOGGED,
      activityId,
      req.user.id,
      { type, name, duration, caloriesBurned, timestamp: recordTime }
    );

    res.status(201).json({
      message: 'Activity logged successfully',
      activity: { id: activityId, type, name, duration, caloriesBurned, timestamp: recordTime }
    });
  } catch (error) {
    next(error);
  }
});

// Get activities
router.get('/activities', async (req, res, next) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM activities WHERE user_id = ?';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
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

    const activities = await req.db.all(query, params);

    // Parse metadata JSON
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({
      activities: parsedActivities,
      count: parsedActivities.length
    });
  } catch (error) {
    next(error);
  }
});

export { router as fitnessRouter };
// Set fitness goal
router.post('/goals', async (req, res, next) => {
  try {
    const { type, description, targetValue, targetDate } = req.body;
    
    if (!type || !description || !targetValue) {
      throw new ValidationError('Missing required goal fields');
    }

    const goalId = uuidv4();

    await req.db.run(
      `INSERT INTO fitness_goals (id, user_id, type, description, target_value, target_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [goalId, req.user.id, type, description, targetValue, targetDate]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.FITNESS_GOAL_SET,
      goalId,
      req.user.id,
      { type, description, targetValue, targetDate }
    );

    res.status(201).json({
      message: 'Fitness goal set successfully',
      goal: { id: goalId, type, description, targetValue, targetDate }
    });
  } catch (error) {
    next(error);
  }
});

// Get fitness goals
router.get('/goals', async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    
    const goals = await req.db.all(
      'SELECT * FROM fitness_goals WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
      [req.user.id, status]
    );

    res.json({
      goals,
      count: goals.length
    });
  } catch (error) {
    next(error);
  }
});

// Update goal progress
router.put('/goals/:id/progress', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;

    if (currentValue === undefined) {
      throw new ValidationError('Current value is required');
    }

    // Verify goal belongs to user
    const goal = await req.db.get(
      'SELECT * FROM fitness_goals WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    // Update progress
    await req.db.run(
      'UPDATE fitness_goals SET current_value = ? WHERE id = ? AND user_id = ?',
      [currentValue, id, req.user.id]
    );

    // Check if goal is achieved
    if (currentValue >= goal.target_value && goal.status === 'active') {
      await req.db.run(
        'UPDATE fitness_goals SET status = ? WHERE id = ? AND user_id = ?',
        ['completed', id, req.user.id]
      );

      // Publish achievement event
      await req.eventBus.publish(
        EventTypes.FITNESS_GOAL_ACHIEVED,
        id,
        req.user.id,
        { 
          type: goal.type, 
          description: goal.description, 
          targetValue: goal.target_value,
          achievedValue: currentValue 
        }
      );

      // Send achievement notification
      await req.notifications.sendAchievementNotification(req.user.id, {
        id: uuidv4(),
        type: 'fitness_goal',
        description: `You achieved your ${goal.type} goal: ${goal.description}!`,
        value: currentValue
      });
    }

    res.json({
      message: 'Goal progress updated successfully',
      goal: { 
        id, 
        currentValue, 
        targetValue: goal.target_value,
        progress: Math.min((currentValue / goal.target_value) * 100, 100)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get fitness progress summary
router.get('/progress', async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get recent activities
    const activities = await req.db.all(
      `SELECT type, COUNT(*) as count, SUM(duration) as total_duration, 
              SUM(calories_burned) as total_calories, AVG(calories_burned) as avg_calories
       FROM activities 
       WHERE user_id = ? AND timestamp >= ? 
       GROUP BY type`,
      [req.user.id, startDate.toISOString()]
    );

    // Get completed workouts
    const workouts = await req.db.all(
      `SELECT COUNT(*) as count, SUM(duration) as total_duration, 
              SUM(calories_burned) as total_calories, AVG(calories_burned) as avg_calories
       FROM workouts 
       WHERE user_id = ? AND completed_at >= ?`,
      [req.user.id, startDate.toISOString()]
    );

    // Get active goals progress
    const goals = await req.db.all(
      `SELECT id, type, description, target_value, current_value,
              (current_value * 100.0 / target_value) as progress_percentage
       FROM fitness_goals 
       WHERE user_id = ? AND status = 'active'`,
      [req.user.id]
    );

    res.json({
      period: `${period} days`,
      activities: activities || [],
      workouts: workouts[0] || { count: 0, total_duration: 0, total_calories: 0 },
      goals: goals || [],
      summary: {
        totalActivities: activities.reduce((sum, a) => sum + a.count, 0),
        totalWorkouts: workouts[0]?.count || 0,
        totalCaloriesBurned: (activities.reduce((sum, a) => sum + (a.total_calories || 0), 0)) + (workouts[0]?.total_calories || 0),
        activeGoals: goals.length
      }
    });
  } catch (error) {
    next(error);
  }
});