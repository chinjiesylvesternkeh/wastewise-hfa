const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/fitness', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Fitness DB connected');
}).catch(err => {
  console.warn('⚠️ Fitness DB connection failed, using mock data:', err.message);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
  weight: Number,
  height: Number,
  fitnessGoal: String,
  activityLevel: String,
  createdAt: { type: Date, default: Date.now }
});

// Workout Schema
const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  type: { type: String, required: true }, // cardio, strength, flexibility
  duration: { type: Number, required: true }, // minutes
  caloriesBurned: Number,
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
    duration: Number,
    distance: Number
  }],
  date: { type: Date, default: Date.now },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Goal Schema
const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true }, // weight_loss, muscle_gain, endurance
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  unit: String,
  deadline: Date,
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// Progress Schema
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  weight: Number,
  bodyFat: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  photos: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Workout = mongoose.model('Workout', workoutSchema);
const Goal = mongoose.model('Goal', goalSchema);
const Progress = mongoose.model('Progress', progressSchema);

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

// Get workouts
app.get('/api/workouts', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const workouts = await Workout.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new workout
app.post('/api/workouts', async (req, res) => {
  try {
    const workout = new Workout(req.body);
    await workout.save();
    res.status(201).json(workout);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get goals
app.get('/api/goals', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const goals = await Goal.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new goal
app.post('/api/goals', async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update goal progress
app.put('/api/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get progress entries
app.get('/api/progress', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const progress = await Progress.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add progress entry
app.post('/api/progress', async (req, res) => {
  try {
    const progress = new Progress(req.body);
    await progress.save();
    res.status(201).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkouts = await Workout.countDocuments();
    const activeGoals = await Goal.countDocuments({ status: 'active' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWorkouts = await Workout.countDocuments({
      date: { $gte: today }
    });

    const recentWorkouts = await Workout.find()
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(5);

    const activeGoalsList = await Goal.find({ status: 'active' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalWorkouts,
      activeGoals,
      todayWorkouts,
      recentWorkouts,
      activeGoalsList
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
  console.log(`💪 Fitness App running on port ${PORT}`);
});

module.exports = app;