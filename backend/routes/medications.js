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
    res.json(meds);
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

module.exports = router; 