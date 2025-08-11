const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /medications?patient_id=...
router.get('/', async (req, res) => {
  try {
    const db = await connectDb();
    const { patient_id } = req.query;
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    const meds = await db.collection('medications').find({ patient_id }).toArray();
    
    // Ensure proper image URLs for the frontend
    const medsWithImageUrls = meds.map(med => {
      if (med.image_url && !med.image_url.startsWith('http')) {
        // Convert relative paths to full URLs
        med.image_url = `${req.protocol}://${req.get('host')}${med.image_url.startsWith('/') ? '' : '/'}${med.image_url}`;
      }
      return med;
    });
    
    res.json(medsWithImageUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /medications
router.post('/', async (req, res) => {
  try {
    const db = await connectDb();
    const med = req.body;
    med.created_at = new Date().toISOString();
    med.updated_at = new Date().toISOString();
    const result = await db.collection('medications').insertOne(med);
    med._id = result.insertedId;
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /medications/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    const update = req.body;
    update.updated_at = new Date().toISOString();
    await db.collection('medications').updateOne({ _id: new ObjectId(id) }, { $set: update });
    const med = await db.collection('medications').findOne({ _id: new ObjectId(id) });
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /medications/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    await db.collection('medications').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /medications/mark-taken
router.post('/mark-taken', async (req, res) => {
  try {
    const db = await connectDb();
    const { patient_id, timeOfDay, medication_id } = req.body;
    
    if (!patient_id || !timeOfDay) {
      return res.status(400).json({ error: 'patient_id and timeOfDay are required' });
    }

    // If specific medication_id is provided, mark only that medication
    if (medication_id) {
      const medication = await db.collection('medications').findOne({ 
        _id: new ObjectId(medication_id), 
        patient_id 
      });
      
      if (!medication) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      // Check if this medication is scheduled for the specified time
      const timeField = `${timeOfDay}_dose`;
      if (!medication[timeField] || medication[timeField] === 0) {
        return res.status(400).json({ 
          error: `This medication is not scheduled for ${timeOfDay}` 
        });
      }

      // Create reminder entry
      const reminderData = {
        patient_id,
        medication_id,
        medication_name: medication.name,
        reminder_time: new Date().toISOString(),
        time_of_day: timeOfDay,
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        method: 'voice_logging',
        created_at: new Date().toISOString()
      };

      await db.collection('reminders').insertOne(reminderData);
      
      // Decrease medication count
      const dosageAmount = medication[timeField] || 1;
      await db.collection('medications').updateOne(
        { _id: new ObjectId(medication_id) },
        { 
          $inc: { current_count: -dosageAmount },
          $set: { updated_at: new Date().toISOString() }
        }
      );

      return res.json({ 
        success: true, 
        message: `Successfully marked ${medication.name} as taken for ${timeOfDay}`,
        reminder: reminderData
      });
    }

    // If no specific medication_id, find all medications for this time of day
    const timeField = `${timeOfDay}_dose`;
    // Get all medications for the patient first, then filter in JavaScript
    const allMedications = await db.collection('medications').find({ patient_id }).toArray();
    
    // Filter medications that are scheduled for this specific time of day
    const medications = allMedications.filter(med => {
      const doseValue = med[timeField];
      // Only include if the dose value exists, is truthy, and greater than 0
      // This handles both boolean (true) and numeric (1,2,3...) dose values
      return doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
    });

    if (medications.length === 0) {
      return res.status(404).json({ 
        error: `No medications scheduled for ${timeOfDay}` 
      });
    }

    // Mark all scheduled medications for this time as taken
    const reminders = [];
    for (const medication of medications) {
      const reminderData = {
        patient_id,
        medication_id: medication._id.toString(),
        medication_name: medication.name,
        reminder_time: new Date().toISOString(),
        time_of_day: timeOfDay,
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        method: 'voice_logging',
        created_at: new Date().toISOString()
      };

      await db.collection('reminders').insertOne(reminderData);
      reminders.push(reminderData);
      
      // Decrease medication count
      const dosageAmount = medication[timeField] || 1;
      await db.collection('medications').updateOne(
        { _id: medication._id },
        { 
          $inc: { current_count: -dosageAmount },
          $set: { updated_at: new Date().toISOString() }
        }
      );
    }

    res.json({ 
      success: true, 
      message: `Successfully marked ${medications.length} medication(s) as taken for ${timeOfDay}`,
      medications_marked: medications.map(m => m.name),
      reminders
    });
    
  } catch (err) {
    console.error('Error in mark-taken:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
