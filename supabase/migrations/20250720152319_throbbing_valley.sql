/*
  # Create game scores table

  1. New Tables
    - `game_scores`
      - `id` (uuid, primary key)
      - `patient_id` (uuid) - reference to patient
      - `score` (integer) - points scored
      - `total_questions` (integer) - total questions in game
      - `date` (date) - game date
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on `game_scores` table
    - Add policies for patients and caregivers to access game data
*/

CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Patients and their caregivers can access game data
CREATE POLICY "Users can access game data"
  ON game_scores
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
        WHERE patient.id = game_scores.patient_id
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_patient_id ON game_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_date ON game_scores(date);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);