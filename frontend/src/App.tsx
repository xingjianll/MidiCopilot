import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { RunsPage } from './pages/RunsPage';
import { SamplesPage } from './pages/SamplesPage';
import { WorkflowEditor } from './components/WorkflowEditor';
import { theme } from './theme';
import './App.css';

type AppView = 'home' | 'runs' | 'samples' | 'editor';

function App() {
  const [activeTab, setActiveTab] = useState<AppView>('home');
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AppView);
    if (tab !== 'editor') {
      setEditingWorkflowId(null);
    }
  };

  const handleEditWorkflow = (workflowId: string) => {
    setEditingWorkflowId(workflowId);
    setActiveTab('editor');
  };

  const handleBackFromEditor = () => {
    setActiveTab('home');
    setEditingWorkflowId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'runs':
        return <RunsPage />;
      case 'samples':
        return <SamplesPage />;
      case 'editor':
        return (
          <WorkflowEditor 
            workflowId={editingWorkflowId || undefined} 
            onBack={handleBackFromEditor}
          />
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: theme.colors.background,
        color: theme.colors.text.primary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {activeTab !== 'editor' && (
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
      
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ flex: 1, width: '100%', overflow: 'hidden' }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}

export default App;
