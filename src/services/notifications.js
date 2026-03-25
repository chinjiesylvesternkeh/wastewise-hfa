import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  constructor(wss) {
    this.wss = wss;
    this.connections = new Map();
    this.scheduledNotifications = new Map();
    this.active = true;
  }

  // Register a WebSocket connection with user ID
  registerConnection(ws, userId) {
    const connectionId = uuidv4();
    this.connections.set(connectionId, { ws, userId, id: connectionId });
    ws.connectionId = connectionId;
    console.log(`🔌 WebSocket registered for user: ${userId}`);
    return connectionId;
  }

  // Remove a WebSocket connection
  removeConnection(ws) {
    if (ws.connectionId && this.connections.has(ws.connectionId)) {
      this.connections.delete(ws.connectionId);
      console.log(`🔌 WebSocket connection removed: ${ws.connectionId}`);
    }
  }

  // Handle incoming WebSocket messages
  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'register':
        this.registerConnection(ws, data.userId);
        ws.send(JSON.stringify({
          type: 'registered',
          connectionId: ws.connectionId
        }));
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);

    const message = JSON.stringify({
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });

    userConnections.forEach(conn => {
      if (conn.ws.readyState === 1) { // WebSocket.OPEN
        conn.ws.send(message);
      }
    });

    console.log(`📱 Notification sent to user ${userId}:`, notification.title);
  }

  // Send notification to all connected users
  async broadcast(notification) {
    const message = JSON.stringify({
      type: 'broadcast',
      ...notification,
      timestamp: new Date().toISOString()
    });

    this.connections.forEach(conn => {
      if (conn.ws.readyState === 1) {
        conn.ws.send(message);
      }
    });

    console.log('📢 Broadcast notification sent:', notification.title);
  }

  // Schedule a notification for future delivery
  scheduleNotification(userId, notification, deliveryTime) {
    const notificationId = uuidv4();
    const delay = new Date(deliveryTime) - new Date();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.sendToUser(userId, {
          ...notification,
          id: notificationId,
          scheduled: true
        });
        this.scheduledNotifications.delete(notificationId);
      }, delay);

      this.scheduledNotifications.set(notificationId, {
        timeoutId,
        userId,
        notification,
        deliveryTime
      });

      console.log(`⏰ Notification scheduled for ${deliveryTime}:`, notification.title);
      return notificationId;
    } else {
      // Deliver immediately if time has passed
      this.sendToUser(userId, notification);
      return null;
    }
  }

  // Cancel a scheduled notification
  cancelScheduledNotification(notificationId) {
    const scheduled = this.scheduledNotifications.get(notificationId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledNotifications.delete(notificationId);
      console.log(`❌ Cancelled scheduled notification: ${notificationId}`);
      return true;
    }
    return false;
  }

  // Send medication reminder
  async sendMedicationReminder(userId, medication) {
    await this.sendToUser(userId, {
      type: 'medication_reminder',
      title: 'Medication Reminder',
      message: `Time to take your ${medication.name}`,
      priority: 'high',
      category: 'health',
      data: {
        medicationId: medication.id,
        dosage: medication.dosage,
        instructions: medication.instructions
      },
      actions: [
        { id: 'taken', label: 'Mark as Taken', type: 'success' },
        { id: 'snooze', label: 'Snooze 15min', type: 'secondary' },
        { id: 'skip', label: 'Skip Dose', type: 'warning' }
      ]
    });
  }

  // Send appointment reminder
  async sendAppointmentReminder(userId, appointment) {
    await this.sendToUser(userId, {
      type: 'appointment_reminder',
      title: 'Upcoming Appointment',
      message: `${appointment.title} in 1 hour`,
      priority: 'medium',
      category: 'health',
      data: {
        appointmentId: appointment.id,
        provider: appointment.provider,
        location: appointment.location,
        time: appointment.appointment_date
      },
      actions: [
        { id: 'view', label: 'View Details', type: 'primary' },
        { id: 'directions', label: 'Get Directions', type: 'secondary' }
      ]
    });
  }

  // Send workout reminder
  async sendWorkoutReminder(userId, workout) {
    await this.sendToUser(userId, {
      type: 'workout_reminder',
      title: 'Workout Time!',
      message: `Ready for your ${workout.name}?`,
      priority: 'medium',
      category: 'fitness',
      data: {
        workoutId: workout.id,
        duration: workout.duration,
        exercises: workout.exercises
      },
      actions: [
        { id: 'start', label: 'Start Workout', type: 'success' },
        { id: 'reschedule', label: 'Reschedule', type: 'secondary' }
      ]
    });
  }

  // Send meal reminder
  async sendMealReminder(userId, meal) {
    await this.sendToUser(userId, {
      type: 'meal_reminder',
      title: 'Meal Time',
      message: `Time for ${meal.name}`,
      priority: 'low',
      category: 'nutrition',
      data: {
        mealId: meal.id,
        recipe: meal.recipe,
        prepTime: meal.prepTime
      },
      actions: [
        { id: 'start_cooking', label: 'Start Cooking', type: 'primary' },
        { id: 'view_recipe', label: 'View Recipe', type: 'secondary' }
      ]
    });
  }

  // Send achievement notification
  async sendAchievementNotification(userId, achievement) {
    await this.sendToUser(userId, {
      type: 'achievement',
      title: '🎉 Achievement Unlocked!',
      message: achievement.description,
      priority: 'medium',
      category: 'achievement',
      data: {
        achievementId: achievement.id,
        type: achievement.type,
        value: achievement.value
      },
      actions: [
        { id: 'share', label: 'Share', type: 'primary' },
        { id: 'view_progress', label: 'View Progress', type: 'secondary' }
      ]
    });
  }

  // Send cross-domain recommendation
  async sendRecommendation(userId, recommendation) {
    await this.sendToUser(userId, {
      type: 'recommendation',
      title: 'Wellness Recommendation',
      message: recommendation.content,
      priority: recommendation.priority || 'low',
      category: 'recommendation',
      data: {
        recommendationId: recommendation.id,
        sourceEvents: recommendation.sourceEvents,
        targetDomain: recommendation.targetDomain
      },
      actions: [
        { id: 'accept', label: 'Accept', type: 'success' },
        { id: 'dismiss', label: 'Dismiss', type: 'secondary' }
      ]
    });
  }

  isActive() {
    return this.active;
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.connections.size,
      scheduledNotifications: this.scheduledNotifications.size,
      userConnections: Array.from(this.connections.values()).reduce((acc, conn) => {
        acc[conn.userId] = (acc[conn.userId] || 0) + 1;
        return acc;
      }, {})
    };
  }
}