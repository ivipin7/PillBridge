const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

// POST /users/register
router.post('/register', async (req, res) => {
  try {
    const db = await connectDb();
    const { email, password, full_name, role, caregiver_code, linked_caregiver_id, emergency_contact, emergency_phone } = req.body;
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    let caregiverCode = null;
    let linkedCaregiverId = null;
    
    if (role === 'caregiver') {
      // Generate unique caregiver code for caregivers
      caregiverCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    } else if (role === 'patient' && caregiver_code) {
      // For patients, find the caregiver with the provided code
      const caregiver = await db.collection('users').findOne({ 
        caregiver_code: caregiver_code,
        role: 'caregiver'
      });
      if (caregiver) {
        linkedCaregiverId = caregiver._id.toString();
      }
    }
    
    const userDoc = {
      email,
      passwordHash,
      full_name,
      role,
      caregiver_code: caregiverCode,
      linked_caregiver_id: linkedCaregiverId,
      emergency_contact,
      emergency_phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = await db.collection('users').insertOne(userDoc);
    userDoc._id = result.insertedId;
    res.json({ user: userDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/login
router.post('/login', async (req, res) => {
  try {
    const db = await connectDb();
    const { email, password } = req.body;
    const userDoc = await db.collection('users').findOne({ email });
    if (!userDoc) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, userDoc.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    res.json({ user: userDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/patients/:caregiverId
router.get('/patients/:caregiverId', async (req, res) => {
  try {
    const db = await connectDb();
    const { caregiverId } = req.params;
    
    console.log('Looking for patients with caregiver ID:', caregiverId);
    
    // Find all patients linked to this caregiver
    const patients = await db.collection('users').find({ 
      linked_caregiver_id: caregiverId,
      role: 'patient'
    }).toArray();
    
    console.log('Found patients:', patients.length);
    
    // Also check all patients to see what their linked_caregiver_id values look like
    const allPatients = await db.collection('users').find({ role: 'patient' }).toArray();
    console.log('All patients with linked_caregiver_id:', allPatients.map(p => ({ 
      name: p.full_name, 
      linked_caregiver_id: p.linked_caregiver_id 
    })));
    
    // Remove sensitive information
    const sanitizedPatients = patients.map(patient => ({
      _id: patient._id,
      email: patient.email,
      full_name: patient.full_name,
      role: patient.role,
      emergency_contact: patient.emergency_contact,
      emergency_phone: patient.emergency_phone,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));
    
    res.json({ patients: sanitizedPatients });
  } catch (err) {
    console.error('Error in /patients/:caregiverId:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
