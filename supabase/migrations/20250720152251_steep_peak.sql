/*
  # Create users table and authentication setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique) - user's email address
      - `role` (text) - either 'patient' or 'caregiver'
      - `full_name` (text) - user's full name
      - `caregiver_code` (text, optional) - unique code for caregivers
      - `linked_caregiver_id` (uuid, optional) - reference to caregiver for patients
      - `emergency_contact` (text, optional) - emergency contact name
      - `emergency_phone` (text, optional) - emergency contact phone
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read/update their own data
    - Add policy for caregivers to read their linked patients' data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'caregiver')),
  full_name text NOT NULL,
  caregiver_code text UNIQUE,
  linked_caregiver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Caregivers can read their linked patients' data
CREATE POLICY "Caregivers can read linked patients"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users caregiver
      WHERE caregiver.id = auth.uid()
      AND caregiver.role = 'caregiver'
      AND users.linked_caregiver_id = caregiver.id
    )
  );

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create index for caregiver code lookups
CREATE INDEX IF NOT EXISTS idx_users_caregiver_code ON users(caregiver_code);

-- Create index for linked caregiver lookups
CREATE INDEX IF NOT EXISTS idx_users_linked_caregiver ON users(linked_caregiver_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();