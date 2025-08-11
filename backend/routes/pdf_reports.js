const express = require('express');
const router = express.Router();
const { connectDb } = require('../db');
const { ObjectId } = require('mongodb');
const puppeteer = require('puppeteer');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'PDF reports route is working!',
    timestamp: new Date().toISOString(),
    route: '/pdf-reports'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'PDF Reports',
    timestamp: new Date().toISOString()
  });
});

// Simple PDF test endpoint
router.get('/test-pdf', async (req, res) => {
  try {
    console.log('Testing PDF generation with simple content...');
    
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>Test PDF Generation</h1>
        <p>This is a test PDF to verify that Puppeteer is working correctly.</p>
        <p>Generated at: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-web-security', 
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.setContent(simpleHtml, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    
    console.log('Test PDF generated successfully, size:', pdf.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test-pdf.pdf"');
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
    
  } catch (error) {
    console.error('Test PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Test PDF generation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate patient PDF report
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const db = await connectDb();

    // Fetch patient data
    const patient = await db.collection('users').findOne({ _id: new ObjectId(patientId) });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Fetch related data
    const [medications, moodEntries, reminders, gameScores] = await Promise.all([
      db.collection('medications').find({ patient_id: patientId }).toArray(),
      db.collection('mood_entries').find({ patient_id: patientId })
        .sort({ created_at: -1 }).limit(30).toArray(),
      db.collection('reminders').find({ patient_id: patientId })
        .sort({ reminder_time: -1 }).limit(50).toArray(),
      db.collection('game_scores').find({ patient_id: patientId }).sort({ played_at: -1 }).limit(10).toArray()
    ]);

    console.log(`Generating PDF for patient: ${patient.full_name}`);
    console.log(`Data counts - Medications: ${medications.length}, Mood entries: ${moodEntries.length}, Reminders: ${reminders.length}, Game scores: ${gameScores.length}`);

    // Generate HTML content for PDF
    const htmlContent = generateHTMLReport(patient, medications, moodEntries, reminders, gameScores);

    // Try to generate PDF using Puppeteer
    let pdf;
    try {
      console.log('Attempting PDF generation with Puppeteer...');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-web-security', 
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Wait a bit more for any dynamic content
      await page.waitForTimeout(1000);
      
      // Generate PDF
      pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        preferCSSPageSize: true
      });

      await browser.close();
      console.log('PDF generated successfully with Puppeteer, size:', pdf.length, 'bytes');
      
    } catch (puppeteerError) {
      console.error('Puppeteer failed, falling back to simple HTML response:', puppeteerError.message);
      
      // Fallback: Return HTML content instead of PDF
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="patient-report-${patient.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html"`);
      return res.send(htmlContent);
    }

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patient-report-${patient.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF report',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Generate HTML content for PDF
function generateHTMLReport(patient, medications, moodEntries, reminders, gameScores) {
  const getMoodEmoji = (score) => {
    const moodMap = { 1: '😢', 2: '😟', 3: '😐', 4: '😊', 5: '😄' };
    return moodMap[score] || '😐';
  };

  const getMoodLabel = (score) => {
    const labelMap = { 1: 'Very Sad', 2: 'Sad', 3: 'Okay', 4: 'Good', 5: 'Great' };
    return labelMap[score] || 'Unknown';
  };

  const lowStockMeds = medications.filter(med => med.current_count <= (med.low_stock_threshold || 0));
  const totalReminders = reminders.length;
  const acknowledgedReminders = reminders.filter(r => r.acknowledged).length;
  const complianceRate = totalReminders === 0 ? 0 : Math.round((acknowledgedReminders / totalReminders) * 100);

  // Calculate mood trend
  let moodTrend = 'Stable';
  if (moodEntries.length >= 7) {
    const recent = moodEntries.slice(0, 7);
    const older = moodEntries.slice(7, 14);
    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
      const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
      const diff = recentAvg - olderAvg;
      if (diff > 0.3) moodTrend = 'Improving';
      else if (diff < -0.3) moodTrend = 'Declining';
    }
  }

  // Safe date formatting
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Unknown';
    }
  };

  // Safe string handling
  const safeString = (str) => {
    return str ? String(str).replace(/[<>]/g, '') : '';
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Patient Report - ${safeString(patient.full_name)}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: white;
          font-size: 12px;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        
        .section {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 10px;
          border: 1px solid #e1e5e9;
          page-break-inside: avoid;
        }
        
        .section h2 {
          color: #667eea;
          margin-top: 0;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
          font-size: 20px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: #f8f9ff;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid #667eea;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
        }
        
        .stat-label {
          color: #666;
          margin-top: 5px;
          font-size: 12px;
        }
        
        .medication-item, .mood-item {
          background: #f9f9f9;
          padding: 12px;
          margin: 8px 0;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }
        
        .low-stock {
          border-left-color: #e74c3c;
          background: #fdf2f2;
        }
        
        .mood-score {
          font-size: 18px;
          display: inline-block;
          margin-right: 8px;
        }
        
        .emergency-section {
          background: #ffeaa7;
          border: 2px solid #fdcb6e;
          padding: 15px;
          border-radius: 8px;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
          font-size: 11px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 11px;
        }
        
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #667eea;
          color: white;
          font-weight: bold;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          body { font-size: 10px; }
          .section { margin-bottom: 15px; }
          .header { padding: 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Patient Health Report</h1>
        <p>${safeString(patient.full_name)} • Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h2>Patient Information</h2>
        <table>
          <tr><th>Full Name</th><td>${safeString(patient.full_name)}</td></tr>
          <tr><th>Email</th><td>${safeString(patient.email)}</td></tr>
          <tr><th>Patient ID</th><td>${patient._id.toString().slice(-8)}</td></tr>
          <tr><th>Registration Date</th><td>${formatDate(patient.created_at)}</td></tr>
          <tr><th>Emergency Contact</th><td>${safeString(patient.emergency_contact || 'Not provided')}</td></tr>
          <tr><th>Emergency Phone</th><td>${safeString(patient.emergency_phone || 'Not provided')}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Health Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${medications.length}</div>
            <div class="stat-label">Active Medications</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${complianceRate}%</div>
            <div class="stat-label">Overall Compliance</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${lowStockMeds.length}</div>
            <div class="stat-label">Low Stock Alerts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${moodTrend}</div>
            <div class="stat-label">Mood Trend</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Current Medications (${medications.length})</h2>
        ${medications.length === 0 ? '<p>No medications found.</p>' : 
          medications.map(med => `
            <div class="medication-item ${med.current_count <= (med.low_stock_threshold || 0) ? 'low-stock' : ''}">
              <h4>${safeString(med.name)} - ${safeString(med.dosage)}</h4>
              <p><strong>Stock:</strong> ${med.current_count || 0}/${med.total_count || 0} pills 
                ${med.current_count <= (med.low_stock_threshold || 0) ? '(⚠️ Low Stock)' : ''}</p>
              <p><strong>Schedule:</strong> 
                ${med.morning_dose ? 'Morning ' : ''}
                ${med.afternoon_dose ? 'Afternoon ' : ''}
                ${med.night_dose ? 'Night' : ''}
              </p>
              ${med.instructions ? `<p><strong>Instructions:</strong> ${safeString(med.instructions)}</p>` : ''}
            </div>
          `).join('')
        }
      </div>

      <div class="section">
        <h2>Recent Mood Entries</h2>
        ${moodEntries.length === 0 ? '<p>No mood entries found.</p>' :
          moodEntries.slice(0, 10).map(entry => `
            <div class="mood-item">
              <span class="mood-score">${getMoodEmoji(entry.mood_score)}</span>
              <strong>${getMoodLabel(entry.mood_score)} (${entry.mood_score}/5)</strong>
              <span style="float: right; color: #666;">${formatDate(entry.created_at)}</span>
              ${entry.notes ? `<p style="margin-top: 8px; font-style: italic;">"${safeString(entry.notes)}"</p>` : ''}
            </div>
          `).join('')
        }
      </div>

      <div class="section">
        <h2>Recent Medication Reminders</h2>
        ${reminders.length === 0 ? '<p>No reminders found.</p>' :
          `<table>
            <thead>
              <tr><th>Date & Time</th><th>Status</th><th>Escalated</th></tr>
            </thead>
            <tbody>
              ${reminders.slice(0, 15).map(reminder => `
                <tr>
                  <td>${formatDate(reminder.reminder_time)}</td>
                  <td>${reminder.acknowledged ? '✅ Acknowledged' : '⏳ Pending'}</td>
                  <td>${reminder.escalated ? '🚨 Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>

      <div class="section">
        <h2>Recent Game Scores</h2>
        ${gameScores.length === 0 ? '<p>No game scores found.</p>' :
          `<table>
            <thead>
              <tr><th>Game</th><th>Score</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${gameScores.map(score => `
                <tr>
                  <td>${safeString(score.game_name || 'Pill Recognition')}</td>
                  <td>${score.score || 0}</td>
                  <td>${formatDate(score.played_at || score.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>

      <div class="footer">
        <p>This report was generated automatically by the PillBridge Medication Management System</p>
        <p>Report generated on ${new Date().toLocaleString()} • Patient ID: ${patient._id.toString().slice(-8)}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
