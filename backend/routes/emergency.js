const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /emergency/:userId
router.get('/:userId', async (req, res) => {
  try {
    const db = await connectDb();
    const { userId } = req.params;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ emergency_contact: user.emergency_contact, emergency_phone: user.emergency_phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /emergency/:userId
router.put('/:userId', async (req, res) => {
  try {
    const db = await connectDb();
    const { userId } = req.params;
    const { emergency_contact, emergency_phone } = req.body;
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { emergency_contact, emergency_phone, updated_at: new Date().toISOString() } }
    );
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    res.json({ emergency_contact: user.emergency_contact, emergency_phone: user.emergency_phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 