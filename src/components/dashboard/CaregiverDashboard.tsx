import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, User, Reminder } from '../../lib/api';
import { PatientCard } from './PatientCard';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function CaregiverDashboard() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchPatients();
      fetchAlerts();
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Patients</p>
                <p className="text-xl font-bold text-blue-700">{patients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-600 font-medium">Active Alerts</p>
                <p className="text-xl font-bold text-red-700">{alerts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">On Track Today</p>
                <p className="text-xl font-bold text-green-700">{patients.length - alerts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Actions</p>
                <p className="text-xl font-bold text-yellow-700">{alerts.filter(a => !a.escalated).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            Active Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-800">
                      {alert.users?.full_name} - Missed Medication
                    </p>
                    <p className="text-red-700">
                      {alert.medications?.name} ({alert.medications?.dosage})
                    </p>
                    <p className="text-sm text-red-600">
                      Scheduled: {new Date(alert.reminder_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.escalated ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.escalated ? 'Escalated' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Patients</h2>
        
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Patients Yet</h3>
            <p className="text-gray-600 mb-4">
              Share your caregiver code with patients to get started
            </p>
            {userProfile?.caregiver_code && (
              <div className="bg-blue-50 rounded-lg p-4 inline-block">
                <p className="text-sm text-blue-600 font-medium mb-1">Your Code:</p>
                <p className="text-2xl font-mono font-bold text-blue-700">
                  {userProfile.caregiver_code}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard key={patient._id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}