import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicationList } from '../medications/MedicationList';
import { AddMedicationForm } from '../medications/AddMedicationForm';
import { MoodTracker } from '../health/MoodTracker';
import { PillGame } from '../game/PillGame';
import { EmergencyInfo } from '../emergency/EmergencyInfo';
import { Pill as Pills, Plus, Heart, Gamepad2, Phone, Calendar } from 'lucide-react';
import { createReminder, updateReminder, deleteReminder } from '../../utils/remindersApi';
import { notificationManager } from '../../utils/notifications';

const API_BASE = 'http://localhost:3000';

export function PatientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('medications');
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [reminderForm, setReminderForm] = useState({
    medication_id: '',
    patient_id: user?._id || '',
    reminder_time: '',
    acknowledged: false,
    escalated: false,
  });

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchTodayReminders(); // Enable fetching today's reminders
      
      // Request notification permissions
      requestNotificationPermissions();
    }
  }, [user]);
  
  // Schedule reminders when medications are updated
  useEffect(() => {
    if (medications.length > 0) {
      notificationManager.scheduleReminders(medications);
    }
  }, [medications]);
  
  const requestNotificationPermissions = async () => {
    try {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        console.log('Notification permissions granted');
      } else {
        console.warn('Notification permissions denied');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${API_BASE}/medications?patient_id=${user._id}`);
      const data = await res.json();
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReminders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/reminders?patient_id=${user._id}&date=${today}`);
      const data = await res.json();
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddReminder = () => {
    setEditingReminder(null);
    setReminderForm({ medication_id: '', patient_id: user._id, reminder_time: '', acknowledged: false, escalated: false });
    setShowReminderModal(true);
  };
  const openEditReminder = (reminder: any) => {
    setEditingReminder(reminder);
    setReminderForm({ ...reminder });
    setShowReminderModal(true);
  };
  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await updateReminder(editingReminder._id, reminderForm);
      } else {
        await createReminder(reminderForm);
      }
      setShowReminderModal(false);
      fetchTodayReminders();
    } catch (err) {
      alert('Failed to save reminder');
    }
  };
  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      fetchTodayReminders();
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const tabs = [
    { id: 'medications', label: 'My Medications', icon: Pills },
    { id: 'add-medication', label: 'Add Medication', icon: Plus },
    { id: 'mood', label: 'Daily Check-in', icon: Heart },
    { id: 'game', label: 'Pill Game', icon: Gamepad2 },
    { id: 'emergency', label: 'Emergency', icon: Phone },
    { id: 'reminders', label: 'Reminders', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Audio Medication Reminders Active
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                You'll receive audio notifications at your scheduled medication times. 
                Make sure your browser notifications are enabled for the best experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Today is {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Today's Reminders</p>
              <p className="text-2xl font-bold text-blue-700">{reminders.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center">
              <Pills className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">Active Medications</p>
                <p className="text-xl font-bold text-green-700">{medications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Low Stock Items</p>
                <p className="text-xl font-bold text-yellow-700">
                  {medications.filter(med => med.current_count <= med.low_stock_threshold).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Mood Today</p>
                <p className="text-xl font-bold text-purple-700">Track Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 px-6 py-4 text-lg font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'medications' && (
            <MedicationList 
              medications={medications} 
              onMedicationUpdate={fetchMedications}
            />
          )}
          {activeTab === 'add-medication' && (
            <AddMedicationForm onMedicationAdded={fetchMedications} />
          )}
          {activeTab === 'mood' && <MoodTracker />}
          {activeTab === 'game' && <PillGame medications={medications} />}
          {activeTab === 'emergency' && <EmergencyInfo />}
          {activeTab === 'reminders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Reminders</h2>
                <button onClick={openAddReminder} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add Reminder</button>
              </div>
              <ul className="space-y-2">
                {reminders.map((reminder: any) => (
                  <li key={reminder._id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div><span className="font-semibold">Time:</span> {reminder.reminder_time}</div>
                      <div><span className="font-semibold">Acknowledged:</span> {reminder.acknowledged ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold">Escalated:</span> {reminder.escalated ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openEditReminder(reminder)} className="px-3 py-1 bg-gray-200 rounded">Edit</button>
                      <button onClick={() => handleDeleteReminder(reminder._id)} className="px-3 py-1 bg-red-200 text-red-700 rounded">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
              {showReminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl relative">
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowReminderModal(false)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">{editingReminder ? 'Edit' : 'Add'} Reminder</h2>
                    <form onSubmit={handleReminderSubmit} className="space-y-4">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-1">Reminder Time</label>
                        <input type="datetime-local" name="reminder_time" value={reminderForm.reminder_time} onChange={handleReminderFormChange} className="w-full px-4 py-2 border rounded-lg" required />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}