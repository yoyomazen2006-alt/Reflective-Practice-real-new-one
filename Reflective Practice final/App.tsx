import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { ReflectionWizard } from './components/ReflectionWizard';
import { Dashboard } from './components/Dashboard';
import { AppView, ReflectionEntry } from './types';

const STORAGE_KEY = 'reflect_surg_entries_v2';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved entries");
      }
    }
  }, []);

  // Save to local storage whenever entries change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleStart = () => setView('wizard');
  const handleToDashboard = () => setView('dashboard');
  const handleCancel = () => setView('home');

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this reflection?")) {
        setEntries(prev => prev.filter(e => e.id !== id));
    }
  }

  const handleToggleAction = (id: string) => {
    setEntries(prev => prev.map(e => 
        e.id === id ? { ...e, actionTaken: !e.actionTaken } : e
    ));
  }

  const handleSaveReflection = (newEntry: ReflectionEntry) => {
    // Direct save without AI processing
    setEntries(prev => [newEntry, ...prev]);
    setView('dashboard');
  };

  return (
    <div className="font-sans text-slate-900">
      {view === 'home' && (
        <Hero onStart={handleStart} onDashboard={handleToDashboard} />
      )}
      
      {view === 'wizard' && (
        <ReflectionWizard 
          onSave={handleSaveReflection} 
          onCancel={handleCancel}
          previousEntries={entries} 
        />
      )}

      {view === 'dashboard' && (
        <Dashboard 
          entries={entries} 
          onBack={() => setView('home')} 
          onDelete={handleDelete}
          onToggleAction={handleToggleAction}
        />
      )}
    </div>
  );
};

export default App;