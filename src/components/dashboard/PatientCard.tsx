import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Heart, Pill, AlertTriangle, CheckCircle } from 'lucide-react';

interface PatientCardProps {
  patient: any;
}

export function PatientCard({ patient }: PatientCardProps) {
  const [medications, setMedications] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
    
    // Set up automatic refresh every 5 minutes for real-time progress updates
    const intervalId = setInterval(() => {
      fetchPatientData();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [patient._id]);

  const fetchPatientData = async () => {
    try {
      // Fetch medications using the new API
      const medData = await apiClient.medications.getByPatientId(patient._id);
      
      // Fetch today's reminders using the new API
      const today = new Date().toISOString().split('T')[0];
      const reminderData = await apiClient.reminders.getByPatientId(patient._id, today);

      setMedications(medData || []);
      setTodayReminders(reminderData || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // Set empty arrays on error to prevent crashes
      setMedications([]);
      setTodayReminders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const acknowledgedReminders = todayReminders.filter(r => r.acknowledged).length;
  const totalReminders = todayReminders.length;
  const lowStockCount = medications.filter(med => med.current_count <= med.low_stock_threshold).length;

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Heart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{patient.full_name}</h3>
            <p className="text-sm text-gray-600">{patient.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Pill className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-gray-700">Medications</span>
          </div>
          <span className="font-semibold text-gray-900">{medications.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-gray-700">Today's Progress</span>
          </div>
          <span className="font-semibold text-gray-900">
            {acknowledgedReminders}/{totalReminders}
          </span>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center justify-between text-red-600">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Low Stock</span>
            </div>
            <span className="font-semibold">{lowStockCount}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200">
            View Details
          </button>
          <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}