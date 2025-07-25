/*
  # Create mood entries table

  1. New Tables
    - `mood_entries`
      - `id` (uuid, primary key)
      - `patient_id` (uuid) - reference to patient
      - `mood_score` (integer) - mood rating 1-5
      - `notes` (text, optional) - additional notes
      - `date` (date) - entry date
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on `mood_entries` table
    - Add policies for patients and caregivers to access mood data
*/

CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Patients and their caregivers can access mood data
CREATE POLICY "Users can access mood data"
  ON mood_entries
  FOR ALL
  TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'caregiver'
      AND users.id = (
        SELECT linked_caregiver_id FROM users patient
        WHERE patient.id = mood_entries.patient_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mood_entries_patient_id ON mood_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date);

-- Create unique constraint to prevent duplicate entries per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_entries_patient_date ON mood_entries(patient_id, date);