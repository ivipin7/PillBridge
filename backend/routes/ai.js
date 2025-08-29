const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');

// Ensure the API key is loaded from .env
require('dotenv').config();

// Check if the API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error("FATAL ERROR: OPENAI_API_KEY is not defined. Please check your .env file.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Constructs a detailed, context-rich prompt for the AI.
 * @param {object} patient - The patient's user document.
 * @param {Array<object>} medications - The patient's list of medications.
 * @param {Array<object>} moodEntries - The patient's recent mood entries.
 * @param {string} userPrompt - The caretaker's question.
 * @returns {string} The system prompt for the AI.
 */
const constructSystemPrompt = (patient, medications, moodEntries, userPrompt) => {
  let prompt = `You are an expert medical AI assistant for a caregiver. Your role is to analyze patient data and provide clear, concise, and helpful answers. Be professional and empathetic.

Here is the patient's data:
- Name: ${patient.full_name}
- Age: (Not provided in schema, but important context if available)
- Gender: (Not provided in schema)
- Diagnosed Conditions/Allergies: (Not provided in schema)

Medications:
${medications.length > 0 ? medications.map(m => `- ${m.name} (${m.dosage}) - Instructions: ${m.instructions || 'N/A'}`).join('\n') : 'No medications listed.'}

Recent Mood Logs (last 7 days):
${moodEntries.length > 0 ? moodEntries.map(e => `- Date: ${new Date(e.date).toLocaleDateString()}, Score: ${e.mood_score}/5, Notes: ${e.notes || 'N/A'}`).join('\n') : 'No recent mood logs.'}

Based on this data, please answer the following question from the caregiver. If the question is outside the scope of the provided data (e.g., asking for a diagnosis), politely decline and advise consulting a doctor.

Caregiver's question: "${userPrompt}"`;

  return prompt;
};

// POST /ai/chat - Handle a new chat message
router.post('/chat', async (req, res) => {
  const { patientId, prompt } = req.body;

  if (!patientId || !prompt) {
    return res.status(400).json({ error: 'patientId and prompt are required' });
  }

  try {
    const db = getDB();
    const patient = await db.collection('users').findOne({ _id: new ObjectId(patientId) });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Fetch related patient data for context
    const medications = await db.collection('medications').find({ patient_id: patientId }).toArray();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const moodEntries = await db.collection('mood_entries').find({ patient_id: patientId, date: { $gte: sevenDaysAgo.toISOString() } }).sort({ date: -1 }).toArray();

    const systemPrompt = constructSystemPrompt(patient, medications, moodEntries, prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or "gpt-4" if available and preferred
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt } // We include the user prompt here again for clarity in the chat flow
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // Save conversation to database
    const chatMessage = {
      patient_id: patientId,
      sender: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    const aiMessage = {
      patient_id: patientId,
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date(),
    };

    await db.collection('chat_history').insertMany([chatMessage, aiMessage]);

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('Error with OpenAI API or database:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// GET /ai/chat/:patientId - Retrieve chat history for a patient
router.get('/chat/:patientId', async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  try {
    const db = getDB();
    const history = await db.collection('chat_history').find({ patient_id: patientId }).sort({ timestamp: 1 }).toArray();
    res.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
