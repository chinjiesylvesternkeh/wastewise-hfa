import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { validateHealthMetric, validateAppointment, validateMedication, validateSymptom } from '../utils/validation.js';
import { EventTypes } from '../services/eventBus.js';

const router = express.Router();

// Record health metric
router.post('/metrics', async (req, res, next) => {
  try {
    const { error, value } = validateHealthMetric(req.body);
    if (error) {
      throw new ValidationError('Invalid health metric data', error.details);
    }

    const { type, value: metricValue, unit, timestamp, source, notes } = value;
    const metricId = uuidv4();
    const recordTime = timestamp || new Date().toISOString();

    await req.db.run(
      `INSERT INTO health_metrics (id, user_id, type, value, unit, timestamp, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [metricId, req.user.id, type, metricValue, unit, recordTime, source, notes]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.HEALTH_METRIC_RECORDED,
      metricId,
      req.user.id,
      { type, value: metricValue, unit, timestamp: recordTime, source }
    );

    res.status(201).json({
      message: 'Health metric recorded successfully',
      metric: { id: metricId, type, value: metricValue, unit, timestamp: recordTime }
    });
  } catch (error) {
    next(error);
  }
});

// Get health metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM health_metrics WHERE user_id = ?';
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

    const metrics = await req.db.all(query, params);

    res.json({
      metrics,
      count: metrics.length
    });
  } catch (error) {
    next(error);
  }
});

// Schedule appointment
router.post('/appointments', async (req, res, next) => {
  try {
    const { error, value } = validateAppointment(req.body);
    if (error) {
      throw new ValidationError('Invalid appointment data', error.details);
    }

    const { title, description, appointmentDate, duration, provider, location, notes } = value;
    const appointmentId = uuidv4();

    await req.db.run(
      `INSERT INTO appointments (id, user_id, title, description, appointment_date, duration, provider, location, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [appointmentId, req.user.id, title, description, appointmentDate, duration, provider, location, notes]
    );

    // Schedule reminder notification (1 hour before)
    const reminderTime = new Date(appointmentDate);
    reminderTime.setHours(reminderTime.getHours() - 1);
    
    req.notifications.scheduleNotification(req.user.id, {
      type: 'appointment_reminder',
      title: 'Upcoming Appointment',
      message: `${title} in 1 hour`
    }, reminderTime);

    // Publish event
    await req.eventBus.publish(
      EventTypes.APPOINTMENT_SCHEDULED,
      appointmentId,
      req.user.id,
      { title, appointmentDate, provider, location }
    );

    res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointment: { id: appointmentId, title, appointmentDate, provider }
    });
  } catch (error) {
    next(error);
  }
});

// Get appointments
router.get('/appointments', async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = 'SELECT * FROM appointments WHERE user_id = ?';
    const params = [req.user.id];

    if (startDate) {
      query += ' AND appointment_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND appointment_date <= ?';
      params.push(endDate);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY appointment_date ASC';

    const appointments = await req.db.all(query, params);

    res.json({
      appointments,
      count: appointments.length
    });
  } catch (error) {
    next(error);
  }
});

export { router as healthRouter };
// Add medication
router.post('/medications', async (req, res, next) => {
  try {
    const { error, value } = validateMedication(req.body);
    if (error) {
      throw new ValidationError('Invalid medication data', error.details);
    }

    const { name, dosage, frequency, startDate, endDate, instructions } = value;
    const medicationId = uuidv4();

    await req.db.run(
      `INSERT INTO medications (id, user_id, name, dosage, frequency, start_date, end_date, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicationId, req.user.id, name, dosage, frequency, startDate, endDate, instructions]
    );

    res.status(201).json({
      message: 'Medication added successfully',
      medication: { id: medicationId, name, dosage, frequency }
    });
  } catch (error) {
    next(error);
  }
});

// Get medications
router.get('/medications', async (req, res, next) => {
  try {
    const medications = await req.db.all(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      medications,
      count: medications.length
    });
  } catch (error) {
    next(error);
  }
});

// Log medication taken
router.post('/medications/:id/log', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'taken', notes } = req.body;
    const logId = uuidv4();
    const takenTime = new Date().toISOString();

    // Verify medication belongs to user
    const medication = await req.db.get(
      'SELECT * FROM medications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!medication) {
      throw new NotFoundError('Medication not found');
    }

    await req.db.run(
      `INSERT INTO medication_logs (id, medication_id, user_id, scheduled_time, taken_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [logId, id, req.user.id, takenTime, takenTime, status, notes]
    );

    // Publish event
    const eventType = status === 'taken' ? EventTypes.MEDICATION_TAKEN : EventTypes.MEDICATION_MISSED;
    await req.eventBus.publish(
      eventType,
      id,
      req.user.id,
      { medicationName: medication.name, status, takenTime }
    );

    res.json({
      message: `Medication ${status} logged successfully`,
      log: { id: logId, status, takenTime }
    });
  } catch (error) {
    next(error);
  }
});

// Record symptom
router.post('/symptoms', async (req, res, next) => {
  try {
    const { error, value } = validateSymptom(req.body);
    if (error) {
      throw new ValidationError('Invalid symptom data', error.details);
    }

    const { name, severity, duration, triggers, timestamp, associatedConditions, notes } = value;
    const symptomId = uuidv4();
    const recordTime = timestamp || new Date().toISOString();

    await req.db.run(
      `INSERT INTO symptoms (id, user_id, name, severity, duration, triggers, timestamp, associated_conditions, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [symptomId, req.user.id, name, severity, duration, JSON.stringify(triggers), recordTime, JSON.stringify(associatedConditions), notes]
    );

    // Publish event
    await req.eventBus.publish(
      EventTypes.SYMPTOM_REPORTED,
      symptomId,
      req.user.id,
      { name, severity, duration, timestamp: recordTime }
    );

    res.status(201).json({
      message: 'Symptom recorded successfully',
      symptom: { id: symptomId, name, severity, timestamp: recordTime }
    });
  } catch (error) {
    next(error);
  }
});

// Get symptoms
router.get('/symptoms', async (req, res, next) => {
  try {
    const { startDate, endDate, severity, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM symptoms WHERE user_id = ?';
    const params = [req.user.id];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    if (severity) {
      query += ' AND severity >= ?';
      params.push(parseInt(severity));
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const symptoms = await req.db.all(query, params);

    // Parse JSON fields
    const parsedSymptoms = symptoms.map(symptom => ({
      ...symptom,
      triggers: symptom.triggers ? JSON.parse(symptom.triggers) : [],
      associated_conditions: symptom.associated_conditions ? JSON.parse(symptom.associated_conditions) : []
    }));

    res.json({
      symptoms: parsedSymptoms,
      count: parsedSymptoms.length
    });
  } catch (error) {
    next(error);
  }
});