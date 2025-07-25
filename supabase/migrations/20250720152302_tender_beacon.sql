/*
  # Create medications table

  1. New Tables
    - `medications`
      - `id` (uuid, primary key)
      - `patient_id` (uuid) - reference to patient user
      - `name` (text) - medication name
      - `dosage` (text) - dosage information
      - `total_count` (integer) - total pills when full
      - `current_count` (integer) - current available pills
      - `low_stock_threshold` (integer) - alert threshold
      - `morning_dose` (boolean) - take in morning
      - `afternoon_dose` (boolean) - take in afternoon
      - `night_dose` (boolean) - take at night
      - `instructions` (text, optional) - special instructions
      - `image_url` (text, optional) - medication photo URL
      - `audio_url` (text, optional) - audio reminder URL
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `medications` table
    - Add policy for patients to manage their own medications
    - Add policy for caregivers to read their patients' medications
*/

CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  total_count integer NOT NULL DEFAULT 0,
  current_count integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  morning_dose boolean DEFAULT false,
  afternoon_dose boolean DEFAULT false,
  night_dose boolean DEFAULT false,
  instructions text,
  image_url text,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own medications
CREATE POLICY "Patients can manage own medications"
  ON medications
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
        WHERE patient.id = medications.patient_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_low_stock ON medications(current_count, low_stock_threshold);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();