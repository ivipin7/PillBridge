const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'pillbridge';

async function setupMoodNotifications() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check if mood_notifications collection exists
    const collections = await db.listCollections({ name: 'mood_notifications' }).toArray();
    
    if (collections.length === 0) {
      // Create the collection
      await db.createCollection('mood_notifications');
      console.log('Created mood_notifications collection');
    } else {
      console.log('mood_notifications collection already exists');
    }
    
    // Create indexes for better performance
    await db.collection('mood_notifications').createIndex({ caregiver_id: 1 });
    await db.collection('mood_notifications').createIndex({ patient_id: 1 });
    await db.collection('mood_notifications').createIndex({ created_at: -1 });
    await db.collection('mood_notifications').createIndex({ read: 1 });
    
    console.log('Indexes created for mood_notifications collection');
    
    // Verify the setup
    const sampleDoc = {
      caregiver_id: 'test_caregiver',
      patient_id: 'test_patient',
      patient_name: 'Test Patient',
      mood_score: 4,
      date: '2025-01-01',
      notes: 'Sample notification for testing',
      created_at: new Date().toISOString(),
      read: false
    };
    
    // Insert and then remove a test document to verify everything works
    const result = await db.collection('mood_notifications').insertOne(sampleDoc);
    await db.collection('mood_notifications').deleteOne({ _id: result.insertedId });
    
    console.log('Setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up mood notifications:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  setupMoodNotifications();
}

module.exports = { setupMoodNotifications };
