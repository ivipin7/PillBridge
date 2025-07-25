const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /reminders?patient_id=...&date=...
router.get('/', async (req, res) => {
  try {
    const db = await connectDb();
    const { patient_id, date } = req.query;
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    let query = { patient_id };
    if (date) {
      query.reminder_time = { $gte: `${date}T00:00:00`, $lt: `${date}T23:59:59` };
    }
    const reminders = await db.collection('reminders').find(query).toArray();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reminders
router.post('/', async (req, res) => {
  try {
    const db = await connectDb();
    const reminder = req.body;
    reminder.created_at = new Date().toISOString();
    const result = await db.collection('reminders').insertOne(reminder);
    reminder._id = result.insertedId;
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /reminders/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    const update = req.body;
    await db.collection('reminders').updateOne({ _id: new ObjectId(id) }, { $set: update });
    const reminder = await db.collection('reminders').findOne({ _id: new ObjectId(id) });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /reminders/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    await db.collection('reminders').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 