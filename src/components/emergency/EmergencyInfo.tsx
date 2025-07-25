import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, MapPin, Edit3, Save, X } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const nearbyPharmacies = [
  {
    name: 'CVS Pharmacy',
    address: '123 Main St, Downtown',
    phone: '(555) 123-4567',
    hours: 'Open 24 hours',
    distance: '0.5 miles',
  },
  {
    name: 'Walgreens',
    address: '456 Oak Ave, Midtown',
    phone: '(555) 234-5678',
    hours: 'Mon-Sun: 8AM-10PM',
    distance: '0.8 miles',
  },
  {
    name: 'Rite Aid',
    address: '789 Pine St, Uptown',
    phone: '(555) 345-6789',
    hours: 'Mon-Fri: 9AM-9PM, Weekends: 9AM-6PM',
    distance: '1.2 miles',
  },
];

export function EmergencyInfo() {
  const { user } = useAuth();
  const [editingContact, setEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmergencyInfo();
    }
  }, [user]);

  const fetchEmergencyInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/emergency/${user._id}`);
      const data = await res.json();
      setContactData({
        emergencyContact: data.emergency_contact || '',
        emergencyPhone: data.emergency_phone || '',
      });
    } catch (error) {
      // fallback to empty
      setContactData({ emergencyContact: '', emergencyPhone: '' });
    }
  };

  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emergency/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_contact: contactData.emergencyContact,
          emergency_phone: contactData.emergencyPhone,
        }),
      });
      if (!res.ok) throw new Error('Failed to update emergency contact');
      setEditingContact(false);
      fetchEmergencyInfo();
    } catch (error) {
      console.error('Error updating emergency contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Emergency Information</h2>
        <p className="text-gray-600 mt-2">Quick access to important contacts and nearby pharmacies</p>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Phone className="h-6 w-6 text-red-600 mr-2" />
            Emergency Contacts
          </h3>
          {!editingContact ? (
            <button
              onClick={() => setEditingContact(true)}
              className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingContact(false);
                  setContactData({
                    emergencyContact: user.emergency_contact || '',
                    emergencyPhone: user.emergency_phone || '',
                  });
                }}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Emergency Contact Name
            </label>
            {editingContact ? (
              <input
                type="text"
                value={contactData.emergencyContact}
                onChange={(e) => setContactData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact name"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-lg text-gray-900">
                  {contactData.emergencyContact || 'Not set'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Emergency Phone Number
            </label>
            {editingContact ? (
              <input
                type="tel"
                value={contactData.emergencyPhone}
                onChange={(e) => setContactData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-lg text-gray-900">
                  {contactData.emergencyPhone || 'Not set'}
                </p>
                {contactData.emergencyPhone && (
                  <a
                    href={`tel:${contactData.emergencyPhone}`}
                    className="inline-flex items-center mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Call Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Emergency Numbers</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="tel:911"
              className="flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Emergency: 911
            </a>
            <a
              href="tel:1-800-222-1222"
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Poison Control
            </a>
            <a
              href="tel:211"
              className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-2" />
              Health Info: 211
            </a>
          </div>
        </div>
      </div>

      {/* Nearby Pharmacies */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <MapPin className="h-6 w-6 text-blue-600 mr-2" />
          Nearby Pharmacies
        </h3>

        <div className="space-y-4">
          {nearbyPharmacies.map((pharmacy, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{pharmacy.name}</h4>
                  <p className="text-gray-600 mt-1">{pharmacy.address}</p>
                  <p className="text-gray-600">{pharmacy.hours}</p>
                  <p className="text-sm text-blue-600 font-medium mt-1">{pharmacy.distance} away</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                  <a
                    href={`https://maps.google.com/maps?q=${encodeURIComponent(pharmacy.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Directions
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}