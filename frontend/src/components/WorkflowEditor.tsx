import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, ArrowLeft } from 'lucide-react';
import { theme } from '../theme';
import { mockWorkflows } from '../mockData';

interface WorkflowEditorProps {
  workflowId?: string;
  onBack: () => void;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
    style: {
      background: theme.colors.glass.surface,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.glass.border}`,
      borderRadius: theme.borderRadius.lg,
    },
  },
  {
    id: '2',
    data: { label: 'Chord Generator' },
    position: { x: 100, y: 125 },
    style: {
      background: theme.colors.glass.surface,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.glass.border}`,
      borderRadius: theme.borderRadius.lg,
    },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output Node' },
    position: { x: 250, y: 250 },
    style: {
      background: theme.colors.glass.surface,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.glass.border}`,
      borderRadius: theme.borderRadius.lg,
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflowId, onBack }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedWorkflows] = useState(mockWorkflows);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element)?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
        style: {
          background: theme.colors.glass.surface,
          color: theme.colors.text.primary,
          border: `1px solid ${theme.colors.glass.border}`,
          borderRadius: theme.borderRadius.lg,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          width: '300px',
          background: theme.colors.glass.surface,
          backdropFilter: theme.blur.md,
          borderRight: `1px solid ${theme.colors.glass.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.primary,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
          </motion.button>
          <h2
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.25rem',
              fontWeight: '600',
            }}
          >
            Editor
          </h2>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: theme.spacing.lg }}>
          <h3
            style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              color: theme.colors.text.primary,
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Modules & Workflows
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {selectedWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                draggable
                onDragStart={(event) => onDragStart(event, workflow.isModule ? 'module' : 'workflow')}
                whileHover={{ scale: 1.02 }}
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'grab',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    color: theme.colors.text.primary,
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {workflow.name}
                </div>
                <div
                  style={{
                    color: theme.colors.text.secondary,
                    fontSize: '0.8rem',
                    lineHeight: '1.3',
                  }}
                >
                  {workflow.description}
                </div>
                <div style={{ marginTop: theme.spacing.xs }}>
                  <span
                    style={{
                      background: workflow.isModule 
                        ? theme.colors.accent.secondary 
                        : theme.colors.accent.primary,
                      color: theme.colors.text.primary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.7rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {workflow.isModule ? 'Module' : 'Workflow'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.colors.glass.surface,
            backdropFilter: theme.blur.sm,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            Workflow Editor
          </h1>
          
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: theme.colors.surface,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              <Save size={16} />
              Save
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: theme.colors.accent.primary,
                color: theme.colors.text.primary,
                border: 'none',
                borderRadius: theme.borderRadius.lg,
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              <Play size={16} />
              Run
            </motion.button>
          </div>
        </div>

        <div style={{ flex: 1, background: theme.colors.background }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{ background: theme.colors.background }}
          >
            <Controls
              style={{
                background: theme.colors.glass.surface,
                border: `1px solid ${theme.colors.glass.border}`,
                borderRadius: theme.borderRadius.lg,
              }}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color={theme.colors.border}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};