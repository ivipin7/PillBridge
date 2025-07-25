const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /mood_entries?patient_id=...&limit=...
router.get('/', async (req, res) => {
  try {
    const db = await connectDb();
    const { patient_id, limit } = req.query;
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    let cursor = db.collection('mood_entries').find({ patient_id }).sort({ date: -1 });
    if (limit) cursor = cursor.limit(Number(limit));
    const entries = await cursor.toArray();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /mood_entries
router.post('/', async (req, res) => {
  try {
    const db = await connectDb();
    const entry = req.body;
    entry.created_at = new Date().toISOString();
    const result = await db.collection('mood_entries').insertOne(entry);
    entry._id = result.insertedId;
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /mood_entries/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    const update = req.body;
    await db.collection('mood_entries').updateOne({ _id: new ObjectId(id) }, { $set: update });
    const entry = await db.collection('mood_entries').findOne({ _id: new ObjectId(id) });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /mood_entries/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    await db.collection('mood_entries').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 