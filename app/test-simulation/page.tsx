'use client';

import { useState } from 'react';

export default function TestSimulationPage() {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'What do you think of TikTok?'
        })
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      console.error(err);
      setReply('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Run Test Simulation</h1>
      <button onClick={handleRunSimulation} disabled={loading}>
        {loading ? 'Running...' : 'Run Simulation'}
      </button>

      {reply && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
          <strong>AI Reply:</strong>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
}
