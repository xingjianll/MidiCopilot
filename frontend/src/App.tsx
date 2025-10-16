import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppSidebar } from './components/app-sidebar';
import { HomePage } from './pages/HomePage';
import { RunsPage } from './pages/RunsPage';
import { SamplesPage } from './pages/SamplesPage';
import { WorkflowEditor } from './components/WorkflowEditor';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
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
        return <HomePage onEditWorkflow={handleEditWorkflow} />;
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
        return <HomePage onEditWorkflow={handleEditWorkflow} />;
    }
  };

  // For editor view, use full screen without sidebar
  if (activeTab === 'editor') {
    return (
      <div className="h-screen w-full">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full"
        >
          {renderContent()}
        </motion.div>
      </div>
    );
  }

  // For other views, use shadcn SidebarInset layout
  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <SidebarInset>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col"
        >
          {renderContent()}
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
