import Joi from 'joi';

// User registration validation
export const validateUser = (user) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    height: Joi.number().positive().max(300).optional(), // cm
    weight: Joi.number().positive().max(1000).optional(), // kg
    activityLevel: Joi.string().valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active').optional()
  });

  return schema.validate(user);
};

// User login validation
export const validateLogin = (credentials) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(credentials);
};

// Health metric validation
export const validateHealthMetric = (metric) => {
  const schema = Joi.object({
    type: Joi.string().valid(
      'blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate', 
      'weight', 'height', 'body_fat', 'blood_glucose', 'temperature', 
      'oxygen_saturation', 'steps', 'sleep_hours', 'custom'
    ).required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    timestamp: Joi.date().optional(),
    source: Joi.string().valid('manual', 'device', 'import').default('manual'),
    notes: Joi.string().max(500).optional()
  });

  return schema.validate(metric);
};

// Appointment validation
export const validateAppointment = (appointment) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    appointmentDate: Joi.date().min('now').required(),
    duration: Joi.number().positive().max(480).default(60), // minutes
    provider: Joi.string().max(200).optional(),
    location: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional()
  });

  return schema.validate(appointment);
};

// Medication validation
export const validateMedication = (medication) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    dosage: Joi.string().min(1).max(100).required(),
    frequency: Joi.string().valid(
      'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
      'every_other_day', 'weekly', 'as_needed', 'custom'
    ).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    instructions: Joi.string().max(500).optional()
  });

  return schema.validate(medication);
};

// Symptom validation
export const validateSymptom = (symptom) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    severity: Joi.number().integer().min(1).max(10).required(),
    duration: Joi.number().positive().optional(), // minutes
    triggers: Joi.array().items(Joi.string().max(100)).optional(),
    timestamp: Joi.date().optional(),
    associatedConditions: Joi.array().items(Joi.string().uuid()).optional(),
    notes: Joi.string().max(1000).optional()
  });

  return schema.validate(symptom);
};

// Workout validation
export const validateWorkout = (workout) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    exercises: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('cardio', 'strength', 'flexibility', 'balance', 'sports').required(),
      sets: Joi.array().items(Joi.object({
        reps: Joi.number().positive().optional(),
        weight: Joi.number().positive().optional(),
        duration: Joi.number().positive().optional(),
        distance: Joi.number().positive().optional()
      })).optional(),
      duration: Joi.number().positive().optional(),
      restPeriod: Joi.number().positive().optional()
    })).required(),
    duration: Joi.number().positive().optional(),
    intensity: Joi.string().valid('low', 'moderate', 'high', 'very_high').optional(),
    notes: Joi.string().max(1000).optional()
  });

  return schema.validate(workout);
};

// Activity validation
export const validateActivity = (activity) => {
  const schema = Joi.object({
    type: Joi.string().valid(
      'walking', 'running', 'cycling', 'swimming', 'weightlifting', 
      'yoga', 'pilates', 'dancing', 'sports', 'other'
    ).required(),
    name: Joi.string().min(1).max(200).required(),
    duration: Joi.number().positive().required(), // minutes
    caloriesBurned: Joi.number().positive().optional(),
    intensity: Joi.string().valid('low', 'moderate', 'high', 'very_high').optional(),
    timestamp: Joi.date().optional(),
    source: Joi.string().valid('manual', 'device', 'import').default('manual'),
    metadata: Joi.object().optional()
  });

  return schema.validate(activity);
};

// Recipe validation
export const validateRecipe = (recipe) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().positive().required(),
      unit: Joi.string().required(),
      notes: Joi.string().optional()
    })).min(1).required(),
    instructions: Joi.array().items(Joi.object({
      step: Joi.number().positive().required(),
      instruction: Joi.string().required(),
      duration: Joi.number().positive().optional(),
      temperature: Joi.number().optional()
    })).min(1).required(),
    prepTime: Joi.number().positive().optional(),
    cookTime: Joi.number().positive().optional(),
    servings: Joi.number().positive().required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    nutritionInfo: Joi.object({
      calories: Joi.number().positive().optional(),
      protein: Joi.number().positive().optional(),
      carbs: Joi.number().positive().optional(),
      fat: Joi.number().positive().optional(),
      fiber: Joi.number().positive().optional(),
      sugar: Joi.number().positive().optional(),
      sodium: Joi.number().positive().optional()
    }).optional()
  });

  return schema.validate(recipe);
};

// Nutrition entry validation
export const validateNutritionEntry = (entry) => {
  const schema = Joi.object({
    foodItem: Joi.string().min(1).max(200).required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().min(1).max(50).required(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    timestamp: Joi.date().optional(),
    nutritionFacts: Joi.object({
      calories: Joi.number().positive().required(),
      protein: Joi.number().positive().optional(),
      carbs: Joi.number().positive().optional(),
      fat: Joi.number().positive().optional(),
      fiber: Joi.number().positive().optional(),
      sugar: Joi.number().positive().optional(),
      sodium: Joi.number().positive().optional(),
      vitamins: Joi.object().optional(),
      minerals: Joi.object().optional()
    }).required()
  });

  return schema.validate(entry);
};