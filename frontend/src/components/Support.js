import React, { useState, useEffect } from 'react';
import './css/Support.css';

export default function Support() {
  const [email, setEmail] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.email) setEmail(user.email);
        if (user && user.username && !email) setEmail(user.username);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    if (!email || !caseDescription) {
      setStatusMessage('Please provide both email and description.');
      return;
    }
    setSubmitting(true);
    try {
      const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';
      const url = `${API_BASE}/api/support/`;
      // Use the safe helper to avoid JSON parse errors when server returns HTML
      const fetchJson = (await import('../utils/fetchJson')).default;
      const result = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, case_description: caseDescription })
      });

      if (result.json) {
        if (result.ok) {
          setStatusMessage('Thank you — your complaint has been submitted.');
          setCaseDescription('');
        } else {
          setStatusMessage(result.json.error || `Server error (${result.status})`);
        }
      } else {
        // Non-JSON response — log and show concise message
        console.warn('Support API returned non-JSON response:', result);
        setStatusMessage(result.text ? 'Server returned non-JSON response. Check server logs.' : `Unexpected response (status ${result.status})`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Network error submitting support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="support-container">
      <h2 className="support-header">Support / Complaints</h2>
      <p className="support-description">If you have issues, feedback or complaints, please submit them here and our team will follow up.</p>
      <form onSubmit={handleSubmit} className="support-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={caseDescription}
            onChange={(e) => setCaseDescription(e.target.value)}
            rows={6}
            className="form-textarea"
            required
          />
        </div>
        <div>
          <button type="submit" disabled={submitting} className="submit-button">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
      {statusMessage && (
        <p className={`status-message ${statusMessage.includes('Thank you') ? 'success' : 'error'}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}
