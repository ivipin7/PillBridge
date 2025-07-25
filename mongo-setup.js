import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'pillbridge';

async function ensureCollection(db, name, options = {}) {
  const collections = await db.listCollections({ name }).toArray();
  if (collections.length === 0) {
    await db.createCollection(name, options);
    console.log(`Created collection: ${name}`);
  } else {
    console.log(`Collection already exists: ${name}`);
  }
}

async function main() {
  const client = new MongoClient(uri);
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Database: ${dbName}`);
    console.log(`URI: ${uri}`);
    
    await client.connect();
    const db = client.db(dbName);

    console.log('\nSetting up collections and indexes...');

    // USERS
    await ensureCollection(db, 'users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ caregiver_code: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ linked_caregiver_id: 1 });
    console.log('✓ Users collection and indexes created');

    // MEDICATIONS
    await ensureCollection(db, 'medications');
    await db.collection('medications').createIndex({ patient_id: 1 });
    await db.collection('medications').createIndex({ current_count: 1, low_stock_threshold: 1 });
    console.log('✓ Medications collection and indexes created');

    // REMINDERS
    await ensureCollection(db, 'reminders');
    await db.collection('reminders').createIndex({ patient_id: 1 });
    await db.collection('reminders').createIndex({ medication_id: 1 });
    await db.collection('reminders').createIndex({ reminder_time: 1 });
    await db.collection('reminders').createIndex({ acknowledged: 1 });
    console.log('✓ Reminders collection and indexes created');

    // MOOD ENTRIES
    await ensureCollection(db, 'mood_entries');
    await db.collection('mood_entries').createIndex({ patient_id: 1 });
    await db.collection('mood_entries').createIndex({ date: 1 });
    await db.collection('mood_entries').createIndex({ patient_id: 1, date: 1 }, { unique: true });
    console.log('✓ Mood entries collection and indexes created');

    // GAME SCORES
    await ensureCollection(db, 'game_scores');
    await db.collection('game_scores').createIndex({ patient_id: 1 });
    await db.collection('game_scores').createIndex({ date: 1 });
    await db.collection('game_scores').createIndex({ score: -1 });
    console.log('✓ Game scores collection and indexes created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now start the application:');
    console.log('1. Run backend: cd backend && npm start');
    console.log('2. Run frontend: npm run dev');
    console.log('3. Or use the quick start: double-click start-dev.bat (Windows)');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. MongoDB is installed and running');
    console.log('2. Connection string is correct in .env files');
    console.log('3. You have permission to create databases');
  } finally {
    await client.close();
  }
}

main().catch(console.error);
