import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Edit, Clock, Cpu, Workflow as WorkflowIcon, X, Loader2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Workflow } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { MidiFileUpload } from './MidiFileUpload';

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
      let response;
      
      // Determine which API endpoint to use based on workflow ID
      let apiEndpoint = 'http://localhost:8000/api/aria/continuation/stream';
      if (workflow.id === 'aria-harmony') {
        apiEndpoint = 'http://localhost:8000/api/aria-harmony/continuation/stream';
      } else if (workflow.id === 'aria-style') {
        apiEndpoint = 'http://localhost:8000/api/aria-style/continuation/stream';
      }
      
      if (selectedFile instanceof File) {
        // Upload file directly
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('max_length', '1024');
        formData.append('temperature', '0.97');
        formData.append('top_p', '0.95');
        // Add ignore_prompt for harmony and style models
        if (workflow.id === 'aria-harmony' || workflow.id === 'aria-style') {
          formData.append('ignore_prompt', 'false');
        }
        
        response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use sample file - first download it, then upload
        console.log('Downloading sample:', selectedFile.sampleId);
        const sampleResponse = await fetch(`http://localhost:8000/api/samples/${selectedFile.sampleId}/download`);
        if (!sampleResponse.ok) {
          throw new Error('Failed to load sample file');
        }
        
        const blob = await sampleResponse.blob();
        console.log('Sample blob size:', blob.size, 'type:', blob.type);
        // Ensure the filename has .mid extension
        const filename = selectedFile.name.endsWith('.mid') || selectedFile.name.endsWith('.midi') 
          ? selectedFile.name 
          : `${selectedFile.name}.mid`;
        const file = new File([blob], filename, { type: 'audio/midi' });
        console.log('Created file:', file.name, 'size:', file.size);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('max_length', '1024');
        formData.append('temperature', '0.97');
        formData.append('top_p', '0.95');
        // Add ignore_prompt for harmony and style models
        if (workflow.id === 'aria-harmony' || workflow.id === 'aria-style') {
          formData.append('ignore_prompt', 'false');
        }
        
        console.log('Sending ARIA request with sample file');
        response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ARIA request failed:', response.status, errorText);
        throw new Error(`Failed to start generation: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'status') {
              setStatusMessage(data.message);
            } else if (data.type === 'progress') {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
                generated: data.generated,
                promptLength: data.prompt_length,
              });
            } else if (data.type === 'complete') {
              setResult({
                success: true,
                message: data.message,
                continuation_filename: data.filename
              });
              setStatusMessage('');
            } else if (data.type === 'error') {
              setError(data.message);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownload = () => {
    if (result?.continuation_filename) {
      window.open(
        `http://localhost:8000/api/aria/download/${result.continuation_filename}`,
        '_blank'
      );
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
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Continuation
              </Button>
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
    </div>
  );
};