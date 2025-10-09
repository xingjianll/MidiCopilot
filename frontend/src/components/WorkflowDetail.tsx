import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Edit, Clock, Cpu, Workflow as WorkflowIcon, X, Loader2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Workflow } from '../types';
import { theme } from '../theme';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </motion.button>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.lg,
            background: workflow.isModule 
              ? theme.colors.accent.secondary 
              : theme.colors.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {workflow.isModule ? <Cpu size={24} /> : <WorkflowIcon size={24} />}
        </div>
        
        <div>
          <h1
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            {workflow.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            <Clock size={14} color={theme.colors.text.tertiary} />
            <span style={{ color: theme.colors.text.tertiary, fontSize: '0.9rem' }}>
              Created {formatDate(workflow.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          color: theme.colors.text.secondary,
          lineHeight: '1.6',
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 style={{ color: theme.colors.text.primary, fontSize: '1.5rem', marginBottom: theme.spacing.md }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ color: theme.colors.text.primary, fontSize: '1.25rem', marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ color: theme.colors.text.primary, fontSize: '1.1rem', marginBottom: theme.spacing.sm, marginTop: theme.spacing.md }}>{children}</h3>
            ),
            p: ({ children }) => (
              <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{ color: theme.colors.text.secondary, paddingLeft: theme.spacing.lg, marginBottom: theme.spacing.sm }}>{children}</ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{children}</strong>
            ),
            code: ({ children }) => (
              <code style={{ 
                background: theme.colors.surface, 
                padding: '2px 4px', 
                fontSize: '0.9em', 
                color: theme.colors.accent.primary 
              }}>{children}</code>
            ),
          }}
        >
          {workflow.detailedDescription}
        </ReactMarkdown>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          Inputs
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {workflow.inputs.map((input) => (
            <div
              key={input.id}
              style={{
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
                  {input.name}
                </span>
                <span
                  style={{
                    background: theme.colors.accent.primary,
                    color: theme.colors.text.primary,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.7rem',
                    fontWeight: '500',
                  }}
                >
                  {input.type}
                </span>
                {input.required && (
                  <span
                    style={{
                      background: theme.colors.accent.warning,
                      color: theme.colors.text.primary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.7rem',
                      fontWeight: '500',
                    }}
                  >
                    Required
                  </span>
                )}
              </div>
              {input.description && (
                <p
                  style={{
                    margin: 0,
                    marginBottom: theme.spacing.md,
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                  }}
                >
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
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          Outputs
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {workflow.outputs.map((output) => (
            <div
              key={output.id}
              style={{
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
                  {output.name}
                </span>
                <span
                  style={{
                    background: theme.colors.accent.success,
                    color: theme.colors.text.primary,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.7rem',
                    fontWeight: '500',
                  }}
                >
                  {output.type}
                </span>
              </div>
              {output.description && (
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                  }}
                >
                  {output.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Display */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: theme.spacing.md,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <div
            style={{
              color: theme.colors.text.primary,
              fontWeight: '600',
              marginBottom: theme.spacing.sm,
            }}
          >
            Generating...
          </div>

          {statusMessage && (
            <div
              style={{
                color: theme.colors.text.secondary,
                fontSize: '0.9rem',
                marginBottom: theme.spacing.md,
              }}
            >
              {statusMessage}
            </div>
          )}

          {progress && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                  fontSize: '0.85rem',
                  color: theme.colors.text.secondary,
                  fontFamily: 'monospace',
                }}
              >
                <span>
                  {progress.generated} / {progress.total - progress.promptLength} tokens generated
                </span>
                <span>{progress.percentage}%</span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: theme.colors.background,
                  borderRadius: theme.borderRadius.sm,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: theme.spacing.sm,
                  fontSize: '0.75rem',
                  color: theme.colors.text.tertiary,
                  fontFamily: 'monospace',
                }}
              >
                Prompt: {progress.promptLength} tokens | Current: {progress.current} / {progress.total}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: theme.spacing.md,
            background: '#ff444420',
            border: '1px solid #ff4444',
            borderRadius: theme.borderRadius.lg,
            color: '#ff4444',
            fontSize: '0.9rem',
          }}
        >
          Error: {error}
        </motion.div>
      )}

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: theme.spacing.md,
            background: `${theme.colors.accent.primary}20`,
            border: `1px solid ${theme.colors.accent.primary}`,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <div
            style={{
              color: theme.colors.text.primary,
              fontWeight: '600',
              marginBottom: theme.spacing.sm,
            }}
          >
            Success!
          </div>
          <div
            style={{
              color: theme.colors.text.secondary,
              fontSize: '0.9rem',
              marginBottom: theme.spacing.md,
            }}
          >
            {result.message}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.accent.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.primary,
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            Download Continuation
          </motion.button>
        </motion.div>
      )}

      {/* Run Button */}
      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRun}
          disabled={!selectedFile || isRunning}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: selectedFile && !isRunning ? theme.colors.accent.primary : theme.colors.surface,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            cursor: selectedFile && !isRunning ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            opacity: selectedFile && !isRunning ? 1 : 0.5,
          }}
        >
          {isRunning ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Running...
            </>
          ) : (
            <>
              <Play size={16} />
              Run
            </>
          )}
        </motion.button>

        {!workflow.isModule && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit?.(workflow.id)}
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
            <Edit size={16} />
            Edit
          </motion.button>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};