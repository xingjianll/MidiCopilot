import { useState } from 'react';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleRun = async () => {
    if (!selectedFile) {
      alert('Please select a MIDI file first');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setStatusMessage('');

    try {
      // Prepare the input data
      let inputTrackPath: string;

      if (selectedFile instanceof File) {
        // For uploaded files, we need to upload them first to get a server path
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await fetch('http://localhost:8000/sample/upload/', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = await uploadResponse.json();
        inputTrackPath = uploadData.path;
      } else {
        // Use sample file path
        // Fetch sample details to get the path
        const sampleResponse = await fetch(`http://localhost:8000/sample/${selectedFile.sampleId}`);
        if (!sampleResponse.ok) {
          throw new Error('Failed to get sample details');
        }
        const sampleData = await sampleResponse.json();
        inputTrackPath = sampleData.path;
      }

      // Prepare run request based on workflow type
      const runRequest: any = {
        inputs: {}
      };

      if (workflow.isModule) {
        // For modules, use module_name
        runRequest.module_name = workflow.id;

        // Map inputs - for MidiTrack type, send the file path
        workflow.inputs.forEach(input => {
          if (input.type === 'MidiTrack') {
            runRequest.inputs[input.id] = inputTrackPath;
          }
        });
      } else {
        // For workflows, use workflow_id (converted to number)
        runRequest.workflow_id = parseInt(workflow.id);
        // TODO: Handle workflow inputs based on workflow structure
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
          {workflow.inputs.map((input) => (
            <Card key={input.id}>
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

                {/* Show file upload for MidiTrack type */}
                {input.type === 'MidiTrack' && (
                  <MidiFileUpload
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClearFile={() => setSelectedFile(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Outputs</h3>
        <div className="flex flex-col gap-3">
          {workflow.outputs.map((output) => (
            <Card key={output.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{output.name}</span>
                  <Badge variant="default" className="text-xs bg-green-500">
                    {output.type}
                  </Badge>
                </div>
                {output.description && (
                  <p className="text-sm text-muted-foreground">
                    {output.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
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
          disabled={!selectedFile || isRunning}
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