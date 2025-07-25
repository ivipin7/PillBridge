import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Camera, Pill } from 'lucide-react';

interface AddMedicationFormProps {
  onMedicationAdded: () => void;
}

const API_BASE = 'http://localhost:3000';

export function AddMedicationForm({ onMedicationAdded }: AddMedicationFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    totalCount: '',
    currentCount: '',
    lowStockThreshold: '',
    morningDose: false,
    afternoonDose: false,
    nightDose: false,
    instructions: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'image') {
        setImageFile(file);
      } else {
        setAudioFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate at least one dose time is selected
      if (!formData.morningDose && !formData.afternoonDose && !formData.nightDose) {
        setError('Please select at least one dose time');
        setLoading(false);
        return;
      }

      // For now, skip file upload and use null/placeholder
      let imageUrl = null;
      let audioUrl = null;

      // Insert medication via backend
      const res = await fetch(`${API_BASE}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user._id,
          name: formData.name,
          dosage: formData.dosage,
          total_count: parseInt(formData.totalCount),
          current_count: parseInt(formData.currentCount),
          low_stock_threshold: parseInt(formData.lowStockThreshold) || 5,
          morning_dose: formData.morningDose,
          afternoon_dose: formData.afternoonDose,
          night_dose: formData.nightDose,
          instructions: formData.instructions,
          image_url: imageUrl,
          audio_url: audioUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add medication');
      }

      // Reset form
      setFormData({
        name: '',
        dosage: '',
        totalCount: '',
        currentCount: '',
        lowStockThreshold: '',
        morningDose: false,
        afternoonDose: false,
        nightDose: false,
        instructions: '',
      });
      setImageFile(null);
      setAudioFile(null);
      onMedicationAdded();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Pill className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Add New Medication</h2>
        <p className="text-gray-600 mt-2">Fill in the details for your medication</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Lisinopril"
              />
            </div>

            <div>
              <label htmlFor="dosage" className="block text-lg font-medium text-gray-700 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 10mg"
              />
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="totalCount" className="block text-lg font-medium text-gray-700 mb-2">
                Total Pills *
              </label>
              <input
                type="number"
                id="totalCount"
                name="totalCount"
                value={formData.totalCount}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
              />
            </div>

            <div>
              <label htmlFor="currentCount" className="block text-lg font-medium text-gray-700 mb-2">
                Current Pills *
              </label>
              <input
                type="number"
                id="currentCount"
                name="currentCount"
                value={formData.currentCount}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
              />
            </div>

            <div>
              <label htmlFor="lowStockThreshold" className="block text-lg font-medium text-gray-700 mb-2">
                Low Stock Alert
              </label>
              <input
                type="number"
                id="lowStockThreshold"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dose Schedule *</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <input
                type="checkbox"
                name="morningDose"
                checked={formData.morningDose}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 rounded mr-3"
              />
              <span className="text-lg font-medium">Morning</span>
            </label>

            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <input
                type="checkbox"
                name="afternoonDose"
                checked={formData.afternoonDose}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 rounded mr-3"
              />
              <span className="text-lg font-medium">Afternoon</span>
            </label>

            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <input
                type="checkbox"
                name="nightDose"
                checked={formData.nightDose}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 rounded mr-3"
              />
              <span className="text-lg font-medium">Night</span>
            </label>
          </div>
        </div>

        {/* Files */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos & Audio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Medication Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'image')}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-blue-600 font-medium">Upload photo</span>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </label>
                {imageFile && (
                  <p className="text-sm text-green-600 mt-2">{imageFile.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Audio Reminder
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, 'audio')}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <span className="text-blue-600 font-medium">Upload audio</span>
                  <p className="text-sm text-gray-500 mt-1">MP3, WAV up to 10MB</p>
                </label>
                {audioFile && (
                  <p className="text-sm text-green-600 mt-2">{audioFile.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-lg font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Take with food, avoid dairy, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding Medication...' : 'Add Medication'}
        </button>
      </form>
    </div>
  );
}