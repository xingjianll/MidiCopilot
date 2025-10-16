import { useState, useCallback, useEffect } from 'react';
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
import { Save, Play, ArrowLeft, Cpu, Loader2, ArrowRight, ArrowDown } from 'lucide-react';
import { theme } from '../theme';
import { Workflow } from '../types';
import { WorkflowDetail } from './WorkflowDetail';
import { AriaExecutionPanel } from './AriaExecutionPanel';
import { MidiFileUpload } from './MidiFileUpload';

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

  // Get inferred types for special nodes
  const getInferredWorkflow = () => {
    if (!workflow || (workflow.name !== 'InputNode' && workflow.name !== 'OutputNode')) {
      return workflow;
    }

    // For special nodes, use inferred types from data if available
    if (data.inferredInputs || data.inferredOutputs) {
      return {
        ...workflow,
        inputs: data.inferredInputs || workflow.inputs,
        outputs: data.inferredOutputs || workflow.outputs
      };
    }

    return workflow;
  };

  const displayWorkflow = getInferredWorkflow();
  
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
      {displayWorkflow.inputs.map((input: any, index: number) => (
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
      {displayWorkflow.outputs.map((output: any, index: number) => (
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
        {displayWorkflow.name === 'InputNode' ? (
          <ArrowRight size={22} color={theme.colors.accent.primary} />
        ) : displayWorkflow.name === 'OutputNode' ? (
          <ArrowDown size={22} color={theme.colors.accent.primary} />
        ) : (
          <Cpu size={22} color={theme.colors.accent.primary} />
        )}
        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
          {displayWorkflow.name}
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
        {displayWorkflow.description}
      </div>

      {/* Input annotations aligned with handles */}
      {displayWorkflow.inputs.length > 0 && (
        <div style={{ 
          position: 'absolute',
          left: theme.spacing.lg,
          top: `${startingTop - 8}px`,
        }}>
          {displayWorkflow.inputs.map((input: any, index: number) => (
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
      {displayWorkflow.outputs.length > 0 && (
        <div style={{ 
          position: 'absolute',
          right: theme.spacing.lg,
          top: `${startingTop - 8}px`,
        }}>
          {displayWorkflow.outputs.map((output: any, index: number) => (
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

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflowId, onBack }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [modules, setModules] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowInputs, setWorkflowInputs] = useState<Array<{name: string, type: string, nodeId: string}>>([]);
  const [workflowOutputs, setWorkflowOutputs] = useState<Array<{name: string, type: string, nodeId: string}>>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [parameterNames, setParameterNames] = useState<Record<string, string>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');

  // Fetch modules from backend
  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/module/');
        if (!response.ok) {
          throw new Error(`Failed to fetch modules: ${response.status}`);
        }
        const data = await response.json();

        // Transform module API response to frontend format
        const transformedModules: Workflow[] = data.map((module: any) => {
          const inputs = Object.entries(module.inputs || {}).map(([key, type]: [string, any]) => ({
            id: key,
            name: key,
            type: type as string,
            required: true,
            description: `Input parameter of type ${type}`
          }));

          const outputs = Object.entries(module.outputs || {}).map(([key, type]: [string, any]) => ({
            id: key,
            name: key,
            type: type as string,
            description: `Output parameter of type ${type}`
          }));

          return {
            id: module.name,
            name: module.name,
            description: module.description,
            detailedDescription: module.description,
            createdAt: new Date().toISOString(),
            isModule: true,
            inputs,
            outputs
          };
        });

        // Add special nodes
        const specialNodes: Workflow[] = [
          {
            id: 'InputNode',
            name: 'InputNode',
            description: 'Input node for workflow - provides input parameters',
            detailedDescription: 'Input node for workflow - provides input parameters',
            createdAt: new Date().toISOString(),
            isModule: true,
            inputs: [],
            outputs: [{ id: 'user_defined', name: 'user_defined', type: 'any', description: 'User-defined output parameter' }]
          },
          {
            id: 'OutputNode',
            name: 'OutputNode',
            description: 'Output node for workflow - collects final results',
            detailedDescription: 'Output node for workflow - collects final results',
            createdAt: new Date().toISOString(),
            isModule: true,
            inputs: [{ id: 'user_defined', name: 'user_defined', type: 'any', required: true, description: 'User-defined input parameter' }],
            outputs: []
          }
        ];

        setModules([...specialNodes, ...transformedModules]);
      } catch (err: any) {
        console.error('Error fetching modules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Load existing workflow if workflowId is provided
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId || workflowId === 'new') return;

      setLoadingWorkflow(true);
      try {
        const response = await fetch(`http://localhost:8000/workflow/${workflowId}`);
        if (!response.ok) {
          throw new Error(`Failed to load workflow: ${response.status}`);
        }
        const workflowData = await response.json();
        setCurrentWorkflow(workflowData);
        setWorkflowName(workflowData.name || '');
        setWorkflowDescription(workflowData.description || '');

        // Convert WorkflowVo to ReactFlow format
        const reactFlowNodes = workflowData.nodes.map((node: any) => {
          // Find the module definition for this node type
          const moduleDefinition = modules.find(m => m.name === node.type_);

          return {
            id: node.uid,
            type: 'module',
            position: { x: node.x, y: node.y },
            data: {
              workflow: moduleDefinition || {
                id: node.type_,
                name: node.type_,
                description: `Module: ${node.type_}`,
                isModule: true,
                inputs: [],
                outputs: []
              }
            }
          };
        });

        const reactFlowEdges = workflowData.edges.map((edge: any) => ({
          id: `${edge.from_uid}-${edge.to_uid}`,
          source: edge.from_uid,
          target: edge.to_uid,
          sourceHandle: edge.from_parameter,
          targetHandle: edge.to_parameter,
        }));

        // Load user-defined parameter names from edges
        const loadedParameterNames: Record<string, string> = {};
        workflowData.edges.forEach((edge: any) => {
          // Extract parameter names from the edges for special nodes
          const sourceNode = workflowData.nodes.find((n: any) => n.uid === edge.from_uid);
          const targetNode = workflowData.nodes.find((n: any) => n.uid === edge.to_uid);

          if (sourceNode?.type_ === 'InputNode' && edge.from_parameter) {
            loadedParameterNames[`${edge.from_uid}_output`] = edge.from_parameter;
          }
          if (targetNode?.type_ === 'OutputNode' && edge.to_parameter) {
            loadedParameterNames[`${edge.to_uid}_input`] = edge.to_parameter;
          }
        });

        setParameterNames(loadedParameterNames);
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
      } catch (error) {
        console.error('Error loading workflow:', error);
        alert('Failed to load workflow');
      } finally {
        setLoadingWorkflow(false);
      }
    };

    // Only load workflow after modules are loaded
    if (!loading && modules.length > 0) {
      loadWorkflow();
    }
  }, [workflowId, loading, modules, setNodes, setEdges]);

  // Analyze workflow to extract inputs and outputs
  const analyzeWorkflow = useCallback(() => {
    const inputs: Array<{name: string, type: string, nodeId: string}> = [];
    const outputs: Array<{name: string, type: string, nodeId: string}> = [];

    nodes.forEach(node => {
      if (node.data?.workflow?.name === 'InputNode') {
        // Find outgoing edges from this InputNode to determine type
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        if (outgoingEdges.length > 0) {
          outgoingEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode && edge.targetHandle) {
              // Find the expected input type from the target module
              const targetInput = targetNode.data?.workflow?.inputs?.find((input: any) => input.id === edge.targetHandle);
              const paramKey = `${node.id}_${edge.sourceHandle || 'output'}`;
              const paramName = parameterNames[paramKey] || edge.sourceHandle || 'input';
              inputs.push({
                name: paramName,
                type: targetInput?.type || 'any',
                nodeId: node.id
              });
            }
          });
        } else {
          // No connections, use user-defined name or default
          const paramKey = `${node.id}_output`;
          const paramName = parameterNames[paramKey] || 'input';
          inputs.push({
            name: paramName,
            type: 'any',
            nodeId: node.id
          });
        }
      }

      if (node.data?.workflow?.name === 'OutputNode') {
        // Find incoming edges to this OutputNode to determine type
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        if (incomingEdges.length > 0) {
          incomingEdges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && edge.sourceHandle) {
              // Find the output type from the source module
              const sourceOutput = sourceNode.data?.workflow?.outputs?.find((output: any) => output.id === edge.sourceHandle);
              const paramKey = `${node.id}_${edge.targetHandle || 'input'}`;
              const paramName = parameterNames[paramKey] || edge.targetHandle || 'output';
              outputs.push({
                name: paramName,
                type: sourceOutput?.type || 'any',
                nodeId: node.id
              });
            }
          });
        } else {
          // No connections, use user-defined name or default
          const paramKey = `${node.id}_input`;
          const paramName = parameterNames[paramKey] || 'output';
          outputs.push({
            name: paramName,
            type: 'any',
            nodeId: node.id
          });
        }
      }
    });

    setWorkflowInputs(inputs);
    setWorkflowOutputs(outputs);
  }, [nodes, edges, parameterNames]);

  useEffect(() => {
    analyzeWorkflow();
  }, [analyzeWorkflow]);

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

  const handleParameterNameChange = (nodeId: string, handleType: 'input' | 'output', newName: string) => {
    const paramKey = `${nodeId}_${handleType}`;
    setParameterNames(prev => ({
      ...prev,
      [paramKey]: newName
    }));
  };

  const handleInputValueChange = (inputName: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [inputName]: value
    }));
  };

  const renderInputField = (input: {name: string, type: string, nodeId: string}) => {
    const inputKey = `${input.nodeId}_${input.name}`;
    const currentValue = inputValues[inputKey];

    switch (input.type) {
      case 'str':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(inputKey, e.target.value)}
            placeholder="Enter text..."
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.background,
              color: theme.colors.text.primary,
              fontSize: '0.8rem',
            }}
          />
        );

      case 'int':
        return (
          <input
            type="number"
            step="1"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(inputKey, parseInt(e.target.value) || 0)}
            placeholder="Enter integer..."
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.background,
              color: theme.colors.text.primary,
              fontSize: '0.8rem',
            }}
          />
        );

      case 'float':
        return (
          <input
            type="number"
            step="0.01"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(inputKey, parseFloat(e.target.value) || 0.0)}
            placeholder="Enter decimal..."
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.background,
              color: theme.colors.text.primary,
              fontSize: '0.8rem',
            }}
          />
        );

      case 'bool':
        return (
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.colors.text.primary, fontSize: '0.8rem' }}>
              <input
                type="radio"
                name={inputKey}
                checked={currentValue === true}
                onChange={() => handleInputValueChange(inputKey, true)}
              />
              True
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.colors.text.primary, fontSize: '0.8rem' }}>
              <input
                type="radio"
                name={inputKey}
                checked={currentValue === false}
                onChange={() => handleInputValueChange(inputKey, false)}
              />
              False
            </label>
          </div>
        );

      case 'MidiTrack':
        return (
          <div style={{ marginTop: theme.spacing.xs }}>
            <MidiFileUpload
              onFileSelect={(file) => handleInputValueChange(inputKey, file)}
              selectedFile={currentValue}
              onClearFile={() => handleInputValueChange(inputKey, null)}
              allowSampleSelection={true}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(inputKey, e.target.value)}
            placeholder="Enter value..."
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.background,
              color: theme.colors.text.primary,
              fontSize: '0.8rem',
            }}
          />
        );
    }
  };

  const handleSave = () => {
    // Set default values if creating new workflow
    if (!workflowName && workflowId === 'new') {
      setWorkflowName(`Workflow_${Date.now()}`);
    }
    if (!workflowDescription && workflowId === 'new') {
      setWorkflowDescription('Workflow created in editor');
    }

    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setShowSaveDialog(false);
    try {
      // Convert ReactFlow nodes and edges to WorkflowVo format
      const workflowNodes = nodes.map(node => ({
        uid: node.id,
        type_: node.data.workflow.name, // Use module name as type
        x: node.position.x,
        y: node.position.y
      }));

      const workflowEdges = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        let fromParameter = edge.sourceHandle || '';
        let toParameter = edge.targetHandle || '';

        // Use custom parameter names for special nodes
        if (sourceNode?.data?.workflow?.name === 'InputNode') {
          fromParameter = parameterNames[`${edge.source}_output`] || edge.sourceHandle || '';
        }
        if (targetNode?.data?.workflow?.name === 'OutputNode') {
          toParameter = parameterNames[`${edge.target}_input`] || edge.targetHandle || '';
        }

        return {
          from_uid: edge.source,
          from_parameter: fromParameter,
          to_uid: edge.target,
          to_parameter: toParameter
        };
      });

      const workflowVo = {
        name: workflowName || `Workflow_${Date.now()}`,
        description: workflowDescription || 'Workflow created in editor',
        edges: workflowEdges,
        nodes: workflowNodes
      };

      const isEditing = workflowId && workflowId !== 'new';
      const url = isEditing
        ? `http://localhost:8000/workflow/${workflowId}`
        : 'http://localhost:8000/workflow/';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowVo),
      });

      if (!response.ok) {
        throw new Error(`Failed to save workflow: ${response.status}`);
      }

      const result = await response.json();
      console.log('Workflow saved successfully:', result);
      alert(isEditing ? 'Workflow updated successfully!' : 'Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loadingWorkflow) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: theme.colors.background }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: theme.colors.accent.primary, marginBottom: theme.spacing.md }} />
          <p style={{ color: theme.colors.text.secondary, margin: 0 }}>Loading workflow...</p>
        </div>
      </div>
    );
  }

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
            Modules
          </h3>
          
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl }}>
              <Loader2 size={24} className="animate-spin" style={{ color: theme.colors.text.secondary }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {modules.map((module) => (
                <motion.div
                  key={module.id}
                  draggable
                  onDragStart={(event) => onDragStart(event, module)}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent bubbling to parent
                    handleWorkflowClick(module);
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
                    {module.name}
                  </div>
                  <div
                    style={{
                      color: theme.colors.text.secondary,
                      fontSize: '0.8rem',
                      lineHeight: '1.3',
                    }}
                  >
                    {module.description}
                  </div>
                  <div style={{ marginTop: theme.spacing.xs }}>
                    <span
                      style={{
                        background: theme.colors.accent.secondary,
                        color: theme.colors.text.primary,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Module
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
          )}
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
          <div>
            <h1
              style={{
                margin: 0,
                color: theme.colors.text.primary,
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              {currentWorkflow?.name || 'Workflow Editor'}
            </h1>
            {currentWorkflow && (
              <p
                style={{
                  margin: 0,
                  marginTop: '4px',
                  color: theme.colors.text.secondary,
                  fontSize: '0.9rem',
                }}
              >
                {currentWorkflow.description}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: saving ? theme.colors.border : theme.colors.surface,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExecutionPanel(true)}
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

        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1, background: theme.colors.background }}>
            <ReactFlow
            nodes={nodes.map(node => {
              const baseNode = {
                ...node,
                selected: false, // Disable ReactFlow's built-in selection
                data: {
                  ...node.data,
                  isSelected: selectedWorkflow?.id === node.data?.workflow?.id
                }
              };

              // Add inferred types for special nodes
              if (node.data?.workflow?.name === 'InputNode') {
                const nodeInputs = workflowInputs.filter(input => input.nodeId === node.id);
                if (nodeInputs.length > 0) {
                  baseNode.data.inferredOutputs = nodeInputs.map(input => ({
                    id: 'user_defined',
                    name: parameterNames[`${node.id}_output`] || 'user_defined',
                    type: input.type,
                    description: 'User-defined output parameter'
                  }));
                }
              } else if (node.data?.workflow?.name === 'OutputNode') {
                const nodeOutputs = workflowOutputs.filter(output => output.nodeId === node.id);
                if (nodeOutputs.length > 0) {
                  baseNode.data.inferredInputs = nodeOutputs.map(output => ({
                    id: 'user_defined',
                    name: parameterNames[`${node.id}_input`] || 'user_defined',
                    type: output.type,
                    required: true,
                    description: 'User-defined input parameter'
                  }));
                }
              }

              return baseNode;
            })}
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

          {/* Right Sidebar - Workflow I/O */}
          <div
            style={{
              width: '300px',
              background: theme.colors.glass.surface,
              backdropFilter: theme.blur.md,
              borderLeft: `1px solid ${theme.colors.glass.border}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: theme.spacing.lg,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: theme.colors.text.primary,
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                Workflow I/O
              </h3>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: theme.spacing.lg }}>
              {/* Inputs Section */}
              <div style={{ marginBottom: theme.spacing.xl }}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: theme.spacing.md,
                    color: theme.colors.text.primary,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Inputs ({workflowInputs.length})
                </h4>
                {workflowInputs.length === 0 ? (
                  <div
                    style={{
                      padding: theme.spacing.md,
                      background: theme.colors.surface,
                      border: `1px dashed ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      textAlign: 'center',
                      color: theme.colors.text.secondary,
                      fontSize: '0.8rem',
                    }}
                  >
                    Add InputNode to define workflow inputs
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {workflowInputs.map((input, index) => (
                      <div
                        key={index}
                        style={{
                          padding: theme.spacing.md,
                          background: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                        }}
                      >
                        <div style={{ marginBottom: theme.spacing.sm }}>
                          <label
                            style={{
                              display: 'block',
                              color: theme.colors.text.secondary,
                              fontSize: '0.7rem',
                              marginBottom: '4px',
                              fontWeight: '500',
                            }}
                          >
                            Parameter Name:
                          </label>
                          <input
                            type="text"
                            value={parameterNames[`${input.nodeId}_output`] || ''}
                            onChange={(e) => handleParameterNameChange(input.nodeId, 'output', e.target.value)}
                            placeholder="Enter parameter name..."
                            style={{
                              width: '100%',
                              padding: theme.spacing.xs,
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: theme.borderRadius.sm,
                              background: theme.colors.background,
                              color: theme.colors.text.primary,
                              fontSize: '0.8rem',
                              fontWeight: '500',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            color: theme.colors.accent.secondary,
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            marginBottom: theme.spacing.sm,
                          }}
                        >
                          Type: {input.type}
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              color: theme.colors.text.secondary,
                              fontSize: '0.7rem',
                              marginBottom: '4px',
                              fontWeight: '500',
                            }}
                          >
                            Value:
                          </label>
                          {renderInputField(input)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outputs Section */}
              <div>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: theme.spacing.md,
                    color: theme.colors.text.primary,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Outputs ({workflowOutputs.length})
                </h4>
                {workflowOutputs.length === 0 ? (
                  <div
                    style={{
                      padding: theme.spacing.md,
                      background: theme.colors.surface,
                      border: `1px dashed ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      textAlign: 'center',
                      color: theme.colors.text.secondary,
                      fontSize: '0.8rem',
                    }}
                  >
                    Add OutputNode to define workflow outputs
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {workflowOutputs.map((output, index) => (
                      <div
                        key={index}
                        style={{
                          padding: theme.spacing.md,
                          background: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                        }}
                      >
                        <div style={{ marginBottom: theme.spacing.sm }}>
                          <label
                            style={{
                              display: 'block',
                              color: theme.colors.text.secondary,
                              fontSize: '0.7rem',
                              marginBottom: '4px',
                              fontWeight: '500',
                            }}
                          >
                            Parameter Name:
                          </label>
                          <input
                            type="text"
                            value={parameterNames[`${output.nodeId}_input`] || ''}
                            onChange={(e) => handleParameterNameChange(output.nodeId, 'input', e.target.value)}
                            placeholder="Enter parameter name..."
                            style={{
                              width: '100%',
                              padding: theme.spacing.xs,
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: theme.borderRadius.sm,
                              background: theme.colors.background,
                              color: theme.colors.text.primary,
                              fontSize: '0.8rem',
                              fontWeight: '500',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            color: theme.colors.accent.secondary,
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          Type: {output.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Execution Panel Drawer */}
      <AnimatePresence>
        {showExecutionPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExecutionPanel(false)}
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
              <AriaExecutionPanel onClose={() => setShowExecutionPanel(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveDialog(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme.colors.glass.backdrop,
                zIndex: 60,
              }}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '500px',
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                border: `1px solid ${theme.colors.glass.border}`,
                borderRadius: theme.borderRadius.lg,
                zIndex: 70,
                padding: theme.spacing.xl,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: theme.spacing.lg,
                  color: theme.colors.text.primary,
                  fontSize: '1.5rem',
                  fontWeight: '600',
                }}
              >
                Save Workflow
              </h2>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                    marginBottom: theme.spacing.sm,
                    fontWeight: '500',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name..."
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    background: theme.colors.background,
                    color: theme.colors.text.primary,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.xl }}>
                <label
                  style={{
                    display: 'block',
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                    marginBottom: theme.spacing.sm,
                    fontWeight: '500',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Enter workflow description..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    background: theme.colors.background,
                    color: theme.colors.text.primary,
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    background: theme.colors.surface,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmSave}
                  disabled={!workflowName.trim() || saving}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    background: (!workflowName.trim() || saving) ? theme.colors.border : theme.colors.accent.primary,
                    color: theme.colors.text.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: (!workflowName.trim() || saving) ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: (!workflowName.trim() || saving) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};