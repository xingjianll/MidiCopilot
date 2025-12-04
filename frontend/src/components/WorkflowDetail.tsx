import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Edit, Clock, Cpu, Workflow as WorkflowIcon, X, Loader2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Workflow, Sample } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { MidiFileUpload } from './MidiFileUpload';
import { BottomDrawer } from './BottomDrawer';
import { SampleDetail } from './SampleDetail';

interface WorkflowDetailProps {
  workflow: Workflow;
  onClose?: () => void;
  onEdit?: (workflowId: string) => void;
}

export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflow, onClose, onEdit }) => {
  const [selectedFile, setSelectedFile] = useState<File | { sampleId: string; name: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    generated: number;
    promptLength: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showResultDrawer, setShowResultDrawer] = useState(false);
  const [resultSample, setResultSample] = useState<Sample | null>(null);
  const [workflowInputs, setWorkflowInputs] = useState<Array<{name: string, type: string, description?: string, required?: boolean}>>([]);
  const [workflowOutputs, setWorkflowOutputs] = useState<Array<{name: string, type: string}>>([]);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Analyze workflow to extract inputs and outputs from InputNode/OutputNode
  useEffect(() => {
    const analyzeWorkflow = async () => {
      if (workflow.isModule) {
        // For modules, use the existing inputs/outputs
        setWorkflowInputs(workflow.inputs || []);
        setWorkflowOutputs(workflow.outputs || []);
        return;
      }

      try {
        // Fetch the workflow data from backend
        const response = await fetch(`http://localhost:8000/workflow/${workflow.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow: ${response.status}`);
        }
        const workflowData = await response.json();
        console.log('Workflow API response:', workflowData);

        // Fetch module definitions to get type information
        const modulesResponse = await fetch('http://localhost:8000/module/');
        if (!modulesResponse.ok) {
          throw new Error('Failed to fetch modules');
        }
        const modules = await modulesResponse.json();
        console.log('Modules API response:', modules);

        // Create a map of module names to their definitions
        const moduleMap = new Map();
        modules.forEach((module: any) => {
          moduleMap.set(module.name, module);
        });

        const inputs: Array<{name: string, type: string, description?: string, required?: boolean}> = [];
        const outputs: Array<{name: string, type: string}> = [];

        // Analyze nodes and edges
        workflowData.nodes.forEach((node: any) => {
          if (node.type_ === 'InputNode') {
            // Find outgoing edges from this InputNode to determine type
            const outgoingEdges = workflowData.edges.filter((edge: any) => edge.from_uid === node.uid);
            if (outgoingEdges.length > 0) {
              outgoingEdges.forEach((edge: any) => {
                const targetNode = workflowData.nodes.find((n: any) => n.uid === edge.to_uid);
                if (targetNode && edge.to_parameter) {
                  // Find the expected input type from the target module
                  const moduleDefinition = moduleMap.get(targetNode.type_);
                  if (moduleDefinition && moduleDefinition.inputs && moduleDefinition.inputs[edge.to_parameter]) {
                    inputs.push({
                      name: edge.from_parameter || 'input',
                      type: moduleDefinition.inputs[edge.to_parameter],
                      description: `Input parameter connected to ${targetNode.type_}.${edge.to_parameter}`,
                      required: true
                    });
                  }
                }
              });
            } else {
              // No connections, use default
              inputs.push({
                name: 'input',
                type: 'any',
                description: 'Unconnected input parameter',
                required: true
              });
            }
          }

          if (node.type_ === 'OutputNode') {
            // Find incoming edges to this OutputNode to determine type
            const incomingEdges = workflowData.edges.filter((edge: any) => edge.to_uid === node.uid);
            if (incomingEdges.length > 0) {
              incomingEdges.forEach((edge: any) => {
                const sourceNode = workflowData.nodes.find((n: any) => n.uid === edge.from_uid);
                if (sourceNode && edge.from_parameter) {
                  // Find the output type from the source module
                  const moduleDefinition = moduleMap.get(sourceNode.type_);
                  if (moduleDefinition && moduleDefinition.outputs && moduleDefinition.outputs[edge.from_parameter]) {
                    const outputEntry = {
                      name: edge.to_parameter || 'output',
                      type: moduleDefinition.outputs[edge.from_parameter]
                    };
                    outputs.push(outputEntry);
                  }
                }
              });
            } else {
              // No connections, use default
              outputs.push({
                name: 'output',
                type: 'any'
              });
            }
          }
        });

        setWorkflowInputs(inputs);
        setWorkflowOutputs(outputs);
      } catch (error) {
        console.error('Error analyzing workflow:', error);
        // Fallback to empty arrays
        setWorkflowInputs([]);
        setWorkflowOutputs([]);
      }
    };

    analyzeWorkflow();
  }, [workflow]);

  const handleInputValueChange = (inputName: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [inputName]: value
    }));
  };

  const renderInputField = (input: {name: string, type: string, description?: string, required?: boolean}) => {
    const currentValue = inputValues[input.name];

    switch (input.type) {
      case 'str':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(input.name, e.target.value)}
            placeholder="Enter text..."
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
          />
        );

      case 'int':
        return (
          <input
            type="number"
            step="1"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(input.name, parseInt(e.target.value) || 0)}
            placeholder="Enter integer..."
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
          />
        );

      case 'float':
        return (
          <input
            type="number"
            step="0.01"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(input.name, parseFloat(e.target.value) || 0.0)}
            placeholder="Enter decimal..."
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
          />
        );

      case 'bool':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={input.name}
                checked={currentValue === true}
                onChange={() => handleInputValueChange(input.name, true)}
              />
              True
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={input.name}
                checked={currentValue === false}
                onChange={() => handleInputValueChange(input.name, false)}
              />
              False
            </label>
          </div>
        );

      case 'MidiTrack':
        return (
          <MidiFileUpload
            onFileSelect={(file) => handleInputValueChange(input.name, file)}
            selectedFile={currentValue}
            onClearFile={() => handleInputValueChange(input.name, null)}
            allowSampleSelection={true}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputValueChange(input.name, e.target.value)}
            placeholder="Enter value..."
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
          />
        );
    }
  };

  const handleRun = async () => {
    // Check if all required inputs have values
    const missingInputs = workflowInputs.filter(input =>
      input.required && !inputValues[input.name]
    );

    if (missingInputs.length > 0) {
      alert(`Please provide values for required inputs: ${missingInputs.map(i => i.name).join(', ')}`);
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setStatusMessage('');

    try {
      // Prepare run request based on workflow type
      const runRequest: any = {
        inputs: {}
      };

      // Process all input values
      for (const input of workflowInputs) {
        const inputValue = inputValues[input.name];

        if (input.type === 'MidiTrack') {
          // Handle MidiTrack inputs - need to get file path
          if (inputValue instanceof File) {
            // For uploaded files, upload first to get server path
            const formData = new FormData();
            formData.append('file', inputValue);

            const uploadResponse = await fetch('http://localhost:8000/sample/upload/', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload file');
            }

            const uploadData = await uploadResponse.json();
            runRequest.inputs[input.name] = uploadData.path;
          } else if (inputValue && typeof inputValue === 'object' && inputValue.sampleId) {
            // Use sample file path
            const sampleResponse = await fetch(`http://localhost:8000/sample/${inputValue.sampleId}`);
            if (!sampleResponse.ok) {
              throw new Error('Failed to get sample details');
            }
            const sampleData = await sampleResponse.json();
            runRequest.inputs[input.name] = sampleData.path;
          }
        } else {
          // For other types, use the value directly
          runRequest.inputs[input.name] = inputValue;
        }
      }

      if (workflow.isModule) {
        // For modules, use module_name
        runRequest.module_name = workflow.id;
      } else {
        // For workflows, use workflow_id (converted to number)
        runRequest.workflow_id = parseInt(workflow.id);
      }

      console.log('Creating run with request:', runRequest);

      // Call the create run endpoint
      const response = await fetch('http://localhost:8000/run/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Run creation failed:', response.status, errorText);
        throw new Error(`Failed to create run: ${response.status} ${errorText}`);
      }

      const runData = await response.json();
      console.log('Run created:', runData);

      // Set success result
      setResult({
        success: true,
        message: `Run created successfully with ID: ${runData.id}`,
        run_id: runData.id,
        sample_id: runData.sample_id
      });

      setStatusMessage('Run completed successfully!');

    } catch (err: any) {
      console.error('Error creating run:', err);
      setError(err.message || 'Failed to create run');
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewSample = async () => {
    if (result?.sample_id) {
      try {
        // Fetch the sample details
        const response = await fetch(`http://localhost:8000/sample/${result.sample_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sample details');
        }
        const sampleData = await response.json();

        // Convert to frontend format
        const fileName = sampleData.path.split('/').pop() || `sample-${sampleData.id}`;
        const sample: Sample = {
          id: sampleData.id.toString(),
          name: fileName,
          type: sampleData.type.toLowerCase() as 'midi' | 'audio',
          duration: 0,
          createdAt: new Date().toISOString(),
          size: 0,
          format: fileName.split('.').pop()?.toUpperCase() || '',
          detailedDescription: `## ${fileName}\n\n### Sample Details\n- **Type**: ${sampleData.type}\n- **Path**: ${sampleData.path}\n- **Sample ID**: ${sampleData.id}`,
        };

        setResultSample(sample);
        setShowResultDrawer(true);
      } catch (error) {
        console.error('Error fetching sample:', error);
        alert('Failed to load sample details');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {onClose && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          workflow.isModule ? 'bg-secondary' : 'bg-primary'
        }`}>
          {workflow.isModule ? (
            <Cpu className="h-6 w-6 text-secondary-foreground" />
          ) : (
            <WorkflowIcon className="h-6 w-6 text-primary-foreground" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {workflow.name}
          </h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Created {formatDate(workflow.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-semibold text-foreground mb-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-foreground mb-2 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-foreground mb-2 mt-4">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground mb-2 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-muted-foreground pl-6 mb-2 list-disc">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="mb-1">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-foreground font-semibold">{children}</strong>
            ),
            code: ({ children }) => (
              <code className="bg-muted px-1 py-0.5 text-sm text-primary rounded">{children}</code>
            ),
          }}
        >
          {workflow.detailedDescription}
        </ReactMarkdown>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Inputs</h3>
        <div className="flex flex-col gap-3">
          {workflowInputs.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  {workflow.isModule ? 'No inputs defined' : 'No InputNode found in workflow'}
                </p>
              </CardContent>
            </Card>
          ) : (
            workflowInputs.map((input, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{input.name}</span>
                    <Badge variant="default" className="text-xs">
                      {input.type}
                    </Badge>
                    {input.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {input.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {input.description}
                    </p>
                  )}

                  {/* Render dynamic input field */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Value:
                    </label>
                    {renderInputField(input)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Outputs</h3>
        <div className="flex flex-col gap-3">
          {workflowOutputs.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  {workflow.isModule ? 'No outputs defined' : 'No OutputNode found in workflow'}
                </p>
              </CardContent>
            </Card>
          ) : (
            workflowOutputs.map((output, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{output.name}</span>
                    <Badge variant="default" className="text-xs bg-green-500">
                      {output.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Progress Display */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-2">
                Generating...
              </div>

              {statusMessage && (
                <div className="text-sm text-muted-foreground mb-4">
                  {statusMessage}
                </div>
              )}

              {progress && (
                <>
                  <div className="flex justify-between mb-2 text-sm text-muted-foreground font-mono">
                    <span>
                      {progress.generated} / {progress.total - progress.promptLength} tokens generated
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>

                  <Progress value={progress.percentage} className="mb-2" />

                  <div className="text-xs text-muted-foreground font-mono">
                    Prompt: {progress.promptLength} tokens | Current: {progress.current} / {progress.total}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertDescription>
              Error: {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert>
            <AlertDescription>
              <div className="font-semibold mb-2">Success!</div>
              <div className="text-sm mb-4">{result.message}</div>
              {result.sample_id && (
                <Button onClick={handleViewSample} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  View Sample (ID: {result.sample_id})
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Run Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleRun}
          disabled={isRunning || workflowInputs.some(input => input.required && !inputValues[input.name])}
          className="flex-1"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run
            </>
          )}
        </Button>

        {!workflow.isModule && (
          <Button
            onClick={() => onEdit?.(workflow.id)}
            variant="outline"
            size="lg"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Bottom Drawer for Sample Result */}
      <BottomDrawer
        isOpen={showResultDrawer}
        onClose={() => setShowResultDrawer(false)}
        title={resultSample ? `Generated Sample: ${resultSample.name}` : 'Generated Sample'}
      >
        {resultSample && <SampleDetail sample={resultSample} />}
      </BottomDrawer>
    </div>
  );
};