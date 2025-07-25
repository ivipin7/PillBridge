const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /game_scores?patient_id=...&limit=...
router.get('/', async (req, res) => {
  try {
    const db = await connectDb();
    const { patient_id, limit } = req.query;
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    let cursor = db.collection('game_scores').find({ patient_id }).sort({ date: -1 });
    if (limit) cursor = cursor.limit(Number(limit));
    const scores = await cursor.toArray();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /game_scores
router.post('/', async (req, res) => {
  try {
    const db = await connectDb();
    const score = req.body;
    score.created_at = new Date().toISOString();
    const result = await db.collection('game_scores').insertOne(score);
    score._id = result.insertedId;
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /game_scores/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    const update = req.body;
    await db.collection('game_scores').updateOne({ _id: new ObjectId(id) }, { $set: update });
    const score = await db.collection('game_scores').findOne({ _id: new ObjectId(id) });
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /game_scores/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    await db.collection('game_scores').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 