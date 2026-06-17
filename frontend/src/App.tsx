import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { JobDescriptions } from './pages/JobDescriptions';
import { Candidates } from './pages/Candidates';
import { CandidateDetails } from './pages/CandidateDetails';
import { Rankings } from './pages/Rankings';
import { Compare } from './pages/Compare';
import { Analytics } from './pages/Analytics';
import { Copilot } from './pages/Copilot';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-descriptions" element={<JobDescriptions />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidate/:id" element={<CandidateDetails />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/copilot" element={<Copilot />} />
            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
