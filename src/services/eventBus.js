import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.eventStore = new Map();
    this.subscribers = new Map();
  }

  async initialize() {
    this.connected = true;
    console.log('✅ Event Bus initialized successfully');
  }

  // Publish an event to the bus
  async publish(eventType, aggregateId, userId, payload, metadata = {}) {
    const event = {
      id: uuidv4(),
      eventType,
      aggregateId,
      userId,
      timestamp: new Date().toISOString(),
      version: 1,
      payload,
      metadata
    };

    // Store event
    this.eventStore.set(event.id, event);

    // Emit to subscribers
    this.emit(eventType, event);
    this.emit('*', event); // Global listener

    console.log(`📡 Event published: ${eventType}`, { aggregateId, userId });
    return event;
  }

  // Subscribe to specific event types
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(handler);
    this.on(eventType, handler);
    
    console.log(`🔔 Subscribed to event: ${eventType}`);
  }

  // Unsubscribe from event types
  unsubscribe(eventType, handler) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).delete(handler);
      this.off(eventType, handler);
    }
  }

  // Get event history for an aggregate
  getEventHistory(aggregateId) {
    return Array.from(this.eventStore.values())
      .filter(event => event.aggregateId === aggregateId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Get events by user
  getUserEvents(userId, eventType = null) {
    let events = Array.from(this.eventStore.values())
      .filter(event => event.userId === userId);
    
    if (eventType) {
      events = events.filter(event => event.eventType === eventType);
    }
    
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  isConnected() {
    return this.connected;
  }

  // Clear event store (for testing)
  clear() {
    this.eventStore.clear();
    this.removeAllListeners();
  }
}

// Event type constants
export const EventTypes = {
  // Health events
  HEALTH_METRIC_RECORDED: 'HealthMetricRecorded',
  MEDICATION_TAKEN: 'MedicationTaken',
  MEDICATION_MISSED: 'MedicationMissed',
  SYMPTOM_REPORTED: 'SymptomReported',
  HEALTH_CONDITION_UPDATED: 'HealthConditionUpdated',
  APPOINTMENT_SCHEDULED: 'AppointmentScheduled',
  APPOINTMENT_COMPLETED: 'AppointmentCompleted',

  // Fitness events
  WORKOUT_COMPLETED: 'WorkoutCompleted',
  FITNESS_GOAL_SET: 'FitnessGoalSet',
  FITNESS_GOAL_ACHIEVED: 'FitnessGoalAchieved',
  ACTIVITY_LOGGED: 'ActivityLogged',
  PROGRESS_MILESTONE_REACHED: 'ProgressMilestoneReached',

  // Culinary events
  MEAL_CONSUMED: 'MealConsumed',
  MEAL_PLAN_CREATED: 'MealPlanCreated',
  RECIPE_SAVED: 'RecipeSaved',
  NUTRITION_GOAL_UPDATED: 'NutritionGoalUpdated',
  GROCERY_LIST_GENERATED: 'GroceryListGenerated',

  // Integration events
  CROSS_DOMAIN_RECOMMENDATION: 'CrossDomainRecommendation',
  USER_PROFILE_UPDATED: 'UserProfileUpdated',
  WELLNESS_GOAL_SET: 'WellnessGoalSet',
  WELLNESS_GOAL_ACHIEVED: 'WellnessGoalAchieved'
};