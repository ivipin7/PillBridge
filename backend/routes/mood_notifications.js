const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET /mood_notifications/:caregiverId - Get mood notifications for a caregiver
router.get('/:caregiverId', async (req, res) => {
  try {
    const db = await connectDb();
    const { caregiverId } = req.params;
    const { limit = 50, unread_only = false } = req.query;
    
    let query = { caregiver_id: caregiverId };
    if (unread_only === 'true') {
      query.read = false;
    }
    
    const notifications = await db.collection('mood_notifications')
      .find(query)
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .toArray();
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /mood_notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    
    await db.collection('mood_notifications')
      .updateOne({ _id: new ObjectId(id) }, { $set: { read: true, read_at: new Date().toISOString() } });
    
    const notification = await db.collection('mood_notifications')
      .findOne({ _id: new ObjectId(id) });
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /mood_notifications/mark-all-read/:caregiverId - Mark all notifications as read for a caregiver
router.put('/mark-all-read/:caregiverId', async (req, res) => {
  try {
    const db = await connectDb();
    const { caregiverId } = req.params;
    
    const result = await db.collection('mood_notifications')
      .updateMany(
        { caregiver_id: caregiverId, read: false },
        { $set: { read: true, read_at: new Date().toISOString() } }
      );
    
    res.json({ modified_count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /mood_notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDb();
    const { id } = req.params;
    
    await db.collection('mood_notifications')
      .deleteOne({ _id: new ObjectId(id) });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
