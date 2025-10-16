import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Loader2, Settings } from 'lucide-react';
import { theme } from '../theme';
import { MidiFileUpload } from './MidiFileUpload';

interface AriaExecutionPanelProps {
  onClose: () => void;
}

export const AriaExecutionPanel: React.FC<AriaExecutionPanelProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Parameters
  const [maxLength, setMaxLength] = useState(1024);
  const [temperature, setTemperature] = useState(0.97);
  const [topP, setTopP] = useState(0.95);

  const handleRun = async () => {
    if (!selectedFile) {
      alert('Please select a MIDI file first');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('max_length', maxLength.toString());
      formData.append('temperature', temperature.toString());
      formData.append('top_p', topP.toString());

      const response = await fetch('http://localhost:8000/api/aria/continuation', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || data.message);
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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            margin: 0,
            marginBottom: theme.spacing.sm,
            color: theme.colors.text.primary,
            fontSize: '1.5rem',
            fontWeight: '600',
          }}
        >
          Run Aria
        </h2>
        <p
          style={{
            margin: 0,
            color: theme.colors.text.secondary,
            fontSize: '0.9rem',
          }}
        >
          Generate AI-powered MIDI continuations
        </p>
      </div>

      {/* Input Section */}
      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          Inputs
        </h3>
        <div
          style={{
            padding: theme.spacing.md,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <div
            style={{
              marginBottom: theme.spacing.sm,
              color: theme.colors.text.primary,
              fontWeight: '500',
              fontSize: '0.9rem',
            }}
          >
            Track <span style={{ color: theme.colors.accent.primary }}>*</span>
          </div>
          <div
            style={{
              marginBottom: theme.spacing.xs,
              color: theme.colors.text.secondary,
              fontSize: '0.85rem',
            }}
          >
            Input MIDI track to continue
          </div>
          <MidiFileUpload
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClearFile={() => setSelectedFile(null)}
          />
        </div>
      </div>

      {/* Parameters Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <Settings size={18} color={theme.colors.text.primary} />
          <h3
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Parameters
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          {/* Max Length */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text.primary,
                fontWeight: '500',
                fontSize: '0.85rem',
              }}
            >
              Max Length: {maxLength}
            </label>
            <input
              type="range"
              min="256"
              max="2048"
              step="256"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                marginTop: theme.spacing.xs,
                color: theme.colors.text.tertiary,
                fontSize: '0.75rem',
              }}
            >
              Maximum length of generated sequence
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text.primary,
                fontWeight: '500',
                fontSize: '0.85rem',
              }}
            >
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                marginTop: theme.spacing.xs,
                color: theme.colors.text.tertiary,
                fontSize: '0.75rem',
              }}
            >
              Controls randomness (higher = more creative)
            </div>
          </div>

          {/* Top P */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text.primary,
                fontWeight: '500',
                fontSize: '0.85rem',
              }}
            >
              Top P: {topP.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                marginTop: theme.spacing.xs,
                color: theme.colors.text.tertiary,
                fontSize: '0.75rem',
              }}
            >
              Nucleus sampling parameter
            </div>
          </div>
        </div>
      </div>

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
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRun}
        disabled={!selectedFile || isRunning}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.lg,
          background: selectedFile && !isRunning ? theme.colors.accent.primary : theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.lg,
          color: theme.colors.text.primary,
          fontWeight: '600',
          fontSize: '1rem',
          cursor: selectedFile && !isRunning ? 'pointer' : 'not-allowed',
          opacity: selectedFile && !isRunning ? 1 : 0.5,
        }}
      >
        {isRunning ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Generating...
          </>
        ) : (
          <>
            <Play size={20} />
            Run Aria
          </>
        )}
      </motion.button>

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
