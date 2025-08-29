import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, User, Reminder, MoodNotification } from '../../lib/api';
import { PatientCard } from './PatientCard';
import { AIChatSidebar } from '../ai/AIChatSidebar'; // Import the new component
import { Users, AlertTriangle, CheckCircle, Clock, Heart, Bell } from 'lucide-react';

export function CaregiverDashboard() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Reminder[]>([]);
  const [moodNotifications, setMoodNotifications] = useState<MoodNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null); // State for selected patient

  useEffect(() => {
    if (userProfile) {
      fetchPatients();
      fetchAlerts();
      fetchMoodNotifications();
    }
    // Set up automatic refresh every 5 minutes
    const intervalId = setInterval(() => {
      if (userProfile) {
        fetchPatients();
        fetchAlerts();
        fetchMoodNotifications();
      }
    }, 300000); // Fetch every 5 minutes
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [userProfile]);

  const fetchPatients = async () => {
    try {
      if (!userProfile?._id) return;
      
      console.log('Fetching patients for caregiver:', userProfile._id);
      const patients = await apiClient.users.getPatientsByCaregiver(userProfile._id);
      console.log('Fetched patients:', patients);
      setPatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]); // Set to empty array on error
    }
  };

  const fetchAlerts = async () => {
    try {
      // Placeholder for alerts - will be implemented when backend API supports this
      console.log('Fetching alerts for caregiver:', userProfile?._id);
      setAlerts([]); // Placeholder - will be implemented when backend API is ready
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodNotifications = async () => {
    try {
      if (!userProfile?._id) return;
      
      console.log('Fetching mood notifications for caregiver:', userProfile._id);
      const notifications = await apiClient.moodNotifications.getByCaregiverId(userProfile._id);
      console.log('Fetched mood notifications:', notifications);
      setMoodNotifications(notifications);
    } catch (error) {
      console.error('Error fetching mood notifications:', error);
      setMoodNotifications([]);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await apiClient.moodNotifications.markAsRead(id);
      // Update local state
      setMoodNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getMoodEmoji = (score: number) => {
    const moodMap = {
      1: '😢',
      2: '😟', 
      3: '😐',
      4: '😊',
      5: '😄'
    };
    return moodMap[score as keyof typeof moodMap] || '😐';
  };

  const getMoodLabel = (score: number) => {
    const labelMap = {
      1: 'Very Sad',
      2: 'Sad',
      3: 'Okay',
      4: 'Good', 
      5: 'Great'
    };
    return labelMap[score as keyof typeof labelMap] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex space-x-8 p-8 bg-gray-50 min-h-screen">
      {/* Main Dashboard Content */}
      <div className="flex-grow">
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Caregiver Dashboard
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Managing care for {patients.length} patient{patients.length !== 1 ? 's' : ''}
                </p>
              </div>

              {userProfile?.caregiver_code && (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Your Caregiver Code</p>
                  <p className="text-2xl font-mono font-bold text-blue-700">
                    {userProfile.caregiver_code}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Share with patients</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Stats Cards ... */}
            </div>
          </div>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Alerts content ... */}
            </div>
          )}

          {/* Mood Notifications */}
          {moodNotifications.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Mood notifications content ... */}
            </div>
          )}

          {/* Patients List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Patients</h2>
            <p className="text-gray-600 mb-4">Click on a patient to interact with the AI assistant.</p>

            {patients.length === 0 ? (
              <div className="text-center py-12">
                {/* No patients message ... */}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient._id}
                    patient={patient}
                    onClick={() => setSelectedPatient(patient)}
                    isSelected={selectedPatient?._id === patient._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      <div className="w-1/3 max-w-md flex-shrink-0">
        <AIChatSidebar
          patientId={selectedPatient?._id || null}
          patientName={selectedPatient?.full_name || null}
        />
      </div>
    </div>
  );
}