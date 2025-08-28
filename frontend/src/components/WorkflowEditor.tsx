import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, ArrowLeft, Cpu } from 'lucide-react';
import { theme } from '../theme';
import { mockWorkflows } from '../mockData';
import { WorkflowDetail } from './WorkflowDetail';

interface WorkflowEditorProps {
  workflowId?: string;
  onBack: () => void;
}

// Custom node component for workflow modules
const ModuleNode = ({ data }: { data: any }) => {
  const workflow = data.workflow;
  const isSelected = data.isSelected;
  const handleSpacing = 32; // Spacing between handles
  const startingTop = 100; // Where first handle starts
  
  return (
    <div
      style={{
        background: theme.colors.glass.surface,
        border: `2px solid ${theme.colors.glass.border}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        minWidth: '420px',
        minHeight: '240px',
        color: theme.colors.text.primary,
        position: 'relative',
      }}
    >
      {/* Input handles on the left */}
      {workflow.inputs.map((input: any, index: number) => (
        <Handle
          key={`input-${input.id}`}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${startingTop + (index * handleSpacing)}px`,
            background: '#4A90E2',
            border: `2px solid ${theme.colors.background}`,
            width: '14px',
            height: '14px',
          }}
        />
      ))}

      {/* Output handles on the right */}
      {workflow.outputs.map((output: any, index: number) => (
        <Handle
          key={`output-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${startingTop + (index * handleSpacing)}px`,
            background: '#4A90E2',
            border: `2px solid ${theme.colors.background}`,
            width: '14px',
            height: '14px',
          }}
        />
      ))}

      {/* Node header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <Cpu size={22} color={theme.colors.accent.primary} />
        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
          {workflow.name}
        </div>
      </div>
      
      {/* Description */}
      <div style={{ 
        fontSize: '0.8rem', 
        color: theme.colors.text.secondary, 
        lineHeight: '1.3',
        marginBottom: theme.spacing.md,
        height: '2.6em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {workflow.description}
      </div>

      {/* Input annotations aligned with handles */}
      {workflow.inputs.length > 0 && (
        <div style={{ 
          position: 'absolute',
          left: theme.spacing.lg,
          top: `${startingTop - 8}px`,
        }}>
          {workflow.inputs.map((input: any, index: number) => (
            <div key={input.id} style={{ 
              height: `${handleSpacing}px`,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}>
              <span style={{ color: theme.colors.text.primary }}>{input.name}</span>
              <span style={{ color: theme.colors.text.tertiary }}>: </span>
              <span style={{ color: theme.colors.accent.secondary }}>{input.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output annotations aligned with handles */}
      {workflow.outputs.length > 0 && (
        <div style={{ 
          position: 'absolute',
          right: theme.spacing.lg,
          top: `${startingTop - 8}px`,
        }}>
          {workflow.outputs.map((output: any, index: number) => (
            <div key={output.id} style={{ 
              height: `${handleSpacing}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}>
              <span style={{ color: theme.colors.text.primary }}>{output.name}</span>
              <span style={{ color: theme.colors.text.tertiary }}>: </span>
              <span style={{ color: theme.colors.accent.secondary }}>{output.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom node types
const nodeTypes = {
  module: ModuleNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'module',
    data: { workflow: mockWorkflows[1] }, // ACE-Step Music Generator (generates AudioTrack)
    position: { x: 100, y: 50 },
  },
  {
    id: '2',
    type: 'module',
    data: { workflow: mockWorkflows[4] }, // Audio to MIDI Converter (AudioTrack -> MidiTrack)
    position: { x: 500, y: 50 },
  },
  {
    id: '3',
    type: 'module',
    data: { workflow: mockWorkflows[0] }, // Aria (MidiTrack -> MidiTrack)
    position: { x: 900, y: 50 },
  },
  {
    id: '4',
    type: 'module',
    data: { workflow: mockWorkflows[2] }, // ACE-Step Voice Cloning (AudioTrack + string + MidiTrack -> AudioTrack)
    position: { x: 500, y: 300 },
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    sourceHandle: 'audio', // ACE-Step Music Generator output
    targetHandle: 'audio_input', // Audio to MIDI Converter input
    style: { stroke: '#4A90E2', strokeWidth: 3 }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3',
    sourceHandle: 'midi_output', // Audio to MIDI Converter output
    targetHandle: 'track', // Aria input
    style: { stroke: '#4A90E2', strokeWidth: 3 }
  },
  { 
    id: 'e1-4', 
    source: '1', 
    target: '4',
    sourceHandle: 'audio', // ACE-Step Music Generator output
    targetHandle: 'reference_voice', // Voice Cloning reference voice input
    style: { stroke: '#4A90E2', strokeWidth: 3 }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4',
    sourceHandle: 'continuation', // Aria output
    targetHandle: 'melody', // Voice Cloning melody input
    style: { stroke: '#4A90E2', strokeWidth: 3 }
  },
];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflowId, onBack }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedWorkflows] = useState(mockWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);

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
      const workflowData = event.dataTransfer.getData('application/reactflow');

      if (typeof workflowData === 'undefined' || !workflowData) {
        return;
      }

      let workflow;
      try {
        workflow = JSON.parse(workflowData);
      } catch (e) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${Date.now()}`,
        type: 'module',
        position,
        data: { workflow },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = (event: React.DragEvent, workflow: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(workflow));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.data?.workflow) {
      setSelectedWorkflow(node.data.workflow);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedWorkflow(null);
  }, []);

  const onSidebarClick = useCallback(() => {
    setSelectedWorkflow(null);
  }, []);

  const handleWorkflowClick = (workflow: any) => {
    setSelectedWorkflow(workflow);
  };

  const closeDetail = () => {
    setSelectedWorkflow(null);
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
        onClick={(e) => {
          // Only clear selection if clicking empty space in sidebar
          if (e.target === e.currentTarget) {
            setSelectedWorkflow(null);
          }
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
          onClick={() => setSelectedWorkflow(null)}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
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

        <div 
          style={{ flex: 1, overflow: 'auto', padding: theme.spacing.lg }}
          onClick={(e) => {
            // Clear selection if clicking empty space in sidebar content
            if (e.target === e.currentTarget) {
              setSelectedWorkflow(null);
            }
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              color: theme.colors.text.primary,
              fontSize: '1rem',
              fontWeight: '600',
            }}
            onClick={() => setSelectedWorkflow(null)}
          >
            Modules & Workflows
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {selectedWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                draggable
                onDragStart={(event) => onDragStart(event, workflow)}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent bubbling to parent
                  handleWorkflowClick(workflow);
                }}
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
            
            {/* Clear selection area */}
            <div 
              style={{ 
                height: '100px', 
                flexGrow: 1,
                minHeight: '20px',
              }}
              onClick={() => {
                setSelectedWorkflow(null);
              }}
            />
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
            nodes={nodes.map(node => ({
              ...node,
              selected: false, // Disable ReactFlow's built-in selection
              data: {
                ...node.data,
                isSelected: selectedWorkflow?.id === node.data?.workflow?.id
              }
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            style={{ background: theme.colors.background }}
            defaultEdgeOptions={{
              style: { stroke: '#4A90E2', strokeWidth: 3 },
              type: 'smoothstep',
            }}
            connectionLineStyle={{ stroke: '#4A90E2', strokeWidth: 3 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={false}
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
              gap={25} 
              size={2} 
              color={theme.colors.border}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedWorkflow && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme.colors.glass.backdrop,
                zIndex: 40,
              }}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '500px',
                height: '100vh',
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                zIndex: 50,
                overflow: 'auto',
                padding: theme.spacing.xl,
              }}
            >
              <WorkflowDetail workflow={selectedWorkflow} onClose={closeDetail} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};