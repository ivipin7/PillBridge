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
    
    let caregiverInfo = null;
    
    // If user is a patient and has a linked caregiver, fetch caregiver details
    if (user.role === 'patient' && user.linked_caregiver_id) {
      try {
        console.log('Patient has linked_caregiver_id:', user.linked_caregiver_id, 'Type:', typeof user.linked_caregiver_id);
        
        let caregiver = null;
        
        // Try to find caregiver by ObjectId first (if it's a valid ObjectId)
        try {
          caregiver = await db.collection('users').findOne({ 
            _id: new ObjectId(user.linked_caregiver_id) 
          });
          console.log('Found caregiver by ObjectId:', caregiver ? caregiver.full_name : 'Not found');
        } catch (objectIdError) {
          console.log('linked_caregiver_id is not a valid ObjectId, trying as string');
        }
        
        // If not found by ObjectId, try as string comparison (backup)
        if (!caregiver) {
          caregiver = await db.collection('users').findOne({ 
            _id: user.linked_caregiver_id // Try direct string comparison
          });
          console.log('Found caregiver by string comparison:', caregiver ? caregiver.full_name : 'Not found');
        }
        
        if (caregiver) {
          caregiverInfo = {
            name: caregiver.full_name,
            email: caregiver.email,
            phone: caregiver.emergency_phone || caregiver.phone || 'Not provided'
          };
          console.log('Caregiver info prepared:', caregiverInfo);
        } else {
          console.log('No caregiver found with ID:', user.linked_caregiver_id);
        }
      } catch (caregiverError) {
        console.log('Error fetching caregiver details:', caregiverError.message);
      }
    } else {
      console.log('User is not a patient or has no linked_caregiver_id. Role:', user.role, 'LinkedCaregiverId:', user.linked_caregiver_id);
    }
    
    res.json({ 
      emergency_contact: user.emergency_contact, 
      emergency_phone: user.emergency_phone,
      hospital_name: user.hospital_name,
      hospital_address: user.hospital_address,
      hospital_phone: user.hospital_phone,
      doctor_name: user.doctor_name,
      doctor_phone: user.doctor_phone,
      caregiver: caregiverInfo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /emergency/:userId
router.put('/:userId', async (req, res) => {
  try {
    const db = await connectDb();
    const { userId } = req.params;
    const { 
      emergency_contact, 
      emergency_phone, 
      hospital_name,
      hospital_address,
      hospital_phone,
      doctor_name,
      doctor_phone
    } = req.body;
    
    // Build update object with only provided fields
    const updateFields = { updated_at: new Date().toISOString() };
    if (emergency_contact !== undefined) updateFields.emergency_contact = emergency_contact;
    if (emergency_phone !== undefined) updateFields.emergency_phone = emergency_phone;
    if (hospital_name !== undefined) updateFields.hospital_name = hospital_name;
    if (hospital_address !== undefined) updateFields.hospital_address = hospital_address;
    if (hospital_phone !== undefined) updateFields.hospital_phone = hospital_phone;
    if (doctor_name !== undefined) updateFields.doctor_name = doctor_name;
    if (doctor_phone !== undefined) updateFields.doctor_phone = doctor_phone;
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    res.json({ 
      emergency_contact: user.emergency_contact, 
      emergency_phone: user.emergency_phone,
      hospital_name: user.hospital_name,
      hospital_address: user.hospital_address,
      hospital_phone: user.hospital_phone,
      doctor_name: user.doctor_name,
      doctor_phone: user.doctor_phone
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEBUG: Get all users with their relationships (remove in production)
router.get('/debug/relationships', async (req, res) => {
  try {
    const db = await connectDb();
    const users = await db.collection('users').find({}, {
      projection: {
        _id: 1,
        full_name: 1,
        email: 1,
        role: 1,
        caregiver_code: 1,
        linked_caregiver_id: 1,
        passwordHash: 0 // Exclude password hash for security
      }
    }).toArray();
    
    const caregivers = users.filter(u => u.role === 'caregiver');
    const patients = users.filter(u => u.role === 'patient');
    
    const relationships = patients.map(patient => {
      const caregiver = caregivers.find(c => 
        c._id.toString() === patient.linked_caregiver_id || 
        c._id === patient.linked_caregiver_id
      );
      
      return {
        patient: {
          id: patient._id,
          name: patient.full_name,
          email: patient.email,
          linked_caregiver_id: patient.linked_caregiver_id
        },
        caregiver: caregiver ? {
          id: caregiver._id,
          name: caregiver.full_name,
          email: caregiver.email,
          code: caregiver.caregiver_code
        } : null
      };
    });
    
    res.json({
      total_users: users.length,
      caregivers: caregivers.length,
      patients: patients.length,
      relationships
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 
