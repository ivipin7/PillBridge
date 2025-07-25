/*
  # Create reminders table

  1. New Tables
    - `reminders`
      - `id` (uuid, primary key)
      - `medication_id` (uuid) - reference to medication
      - `patient_id` (uuid) - reference to patient
      - `reminder_time` (timestamptz) - when reminder was sent
      - `acknowledged` (boolean) - if patient acknowledged
      - `escalated` (boolean) - if escalated to caregiver
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on `reminders` table
    - Add policies for patients and caregivers to access reminder data
*/

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_time timestamptz NOT NULL,
  acknowledged boolean DEFAULT false,
  escalated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Patients and their caregivers can access reminder data
CREATE POLICY "Users can access reminder data"
  ON reminders
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
        WHERE patient.id = reminders.patient_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_medication_id ON reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_acknowledged ON reminders(acknowledged);