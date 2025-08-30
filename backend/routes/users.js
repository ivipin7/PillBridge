const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

// POST /users/register
router.post('/register', async (req, res) => {
  try {
    const db = await connectDb();
    const { email, password, full_name, role, caregiver_code, emergency_contact, emergency_phone } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
    }

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const userDoc = {
      email,
      passwordHash,
      full_name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (role === 'caregiver') {
      userDoc.caregiver_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } else if (role === 'patient' && caregiver_code) {
      const caregiver = await db.collection('users').findOne({ 
        caregiver_code: caregiver_code,
        role: 'caregiver'
      });
      if (caregiver) {
        userDoc.linked_caregiver_id = caregiver._id.toString();
      }
    }

    // Only add optional fields if they are provided
    if (emergency_contact) {
      userDoc.emergency_contact = emergency_contact;
    }
    if (emergency_phone) {
      userDoc.emergency_phone = emergency_phone;
    }

    const result = await db.collection('users').insertOne(userDoc);
    userDoc._id = result.insertedId;

    delete userDoc.passwordHash;

    res.status(201).json({ user: userDoc });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
});

// POST /users/login
router.post('/login', async (req, res) => {
  try {
    const db = await connectDb();
    const { email, password } = req.body;
    const userDoc = await db.collection('users').findOne({ email });
    if (!userDoc) {
      return res.status(400).json({ error: 'User not found' });
    }
    const valid = await bcrypt.compare(password, userDoc.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    delete userDoc.passwordHash;

    res.json({ user: userDoc });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});


// GET /users/patients/:caregiverId
router.get('/patients/:caregiverId', async (req, res) => {
  try {
    const db = await connectDb();
    const { caregiverId } = req.params;
    
    const patients = await db.collection('users').find({ 
      linked_caregiver_id: caregiverId,
      role: 'patient'
    }).toArray();
    
    const sanitizedPatients = patients.map(patient => {
      delete patient.passwordHash;
      return patient;
    });
    
    res.json({ patients: sanitizedPatients });
  } catch (err) {
    console.error('Error in /patients/:caregiverId:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
