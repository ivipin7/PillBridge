const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const router = express.Router();
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
const dbName = 'medication_tracker';

// Get messages for a user (both sent and received)
router.get('/:userId', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const messages = db.collection('messages');
    const { userId } = req.params;
    const { unread_only } = req.query;

    let query = {
      $or: [
        { sender_id: userId },
        { recipient_id: userId }
      ]
    };

    if (unread_only === 'true') {
      query = {
        ...query,
        recipient_id: userId,
        read: false
      };
    }

    const result = await messages
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  } finally {
    await client.close();
  }
});

// Create a new message
router.post('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const messages = db.collection('messages');

    const messageData = {
      ...req.body,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await messages.insertOne(messageData);
    const newMessage = await messages.findOne({ _id: result.insertedId });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Failed to create message' });
  } finally {
    await client.close();
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const messages = db.collection('messages');

    const result = await messages.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          read: true, 
          read_at: new Date(),
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  } finally {
    await client.close();
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const messages = db.collection('messages');

    const result = await messages.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  } finally {
    await client.close();
  }
});

module.exports = router;
