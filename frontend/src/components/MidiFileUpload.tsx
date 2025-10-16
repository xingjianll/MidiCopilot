import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Check, Music, ChevronDown } from 'lucide-react';
import { theme } from '../theme';
import { Sample } from '../types';

type FileOrSample = File | { sampleId: string; name: string; size: number };

interface MidiFileUploadProps {
  onFileSelect: (file: FileOrSample) => void;
  selectedFile: FileOrSample | null;
  onClearFile: () => void;
  allowSampleSelection?: boolean;
}

export const MidiFileUpload: React.FC<MidiFileUploadProps> = ({
  onFileSelect,
  selectedFile,
  onClearFile,
  allowSampleSelection = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const midiFile = files.find(
        (file) => file.name.endsWith('.mid') || file.name.endsWith('.midi')
      );

      if (midiFile) {
        onFileSelect(midiFile);
      } else {
        alert('Please drop a MIDI file (.mid or .midi)');
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  // Fetch samples when component mounts
  useEffect(() => {
    if (allowSampleSelection) {
      fetchSamples();
    }
  }, [allowSampleSelection]);

  const fetchSamples = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/samples');
      const data = await response.json();
      setSamples(data.samples.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'midi' as const,
        duration: 0,
        createdAt: s.createdAt,
        size: s.size,
        format: s.format,
        detailedDescription: '',
      })));
    } catch (error) {
      console.error('Error fetching samples:', error);
    }
  };

  const handleSampleSelect = (sample: Sample) => {
    onFileSelect({ 
      sampleId: sample.id, 
      name: sample.name,
      size: sample.size 
    });
    setShowSamples(false);
  };

  const isFile = (file: any): file is File => {
    return file && typeof file === 'object' && 'size' in file && 'name' in file && !('sampleId' in file);
  };

  const getDisplayName = () => {
    if (isFile(selectedFile)) {
      return selectedFile.name;
    } else if (selectedFile) {
      return selectedFile.name;
    }
    return '';
  };

  const getDisplaySize = () => {
    if (isFile(selectedFile)) {
      return (selectedFile.size / 1024).toFixed(2);
    } else if (selectedFile) {
      return (selectedFile.size / 1024).toFixed(2);
    }
    return '0';
  };

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      {!selectedFile ? (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          style={{
            border: `2px dashed ${isDragging ? theme.colors.accent.primary : theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.md,
            background: isDragging
              ? `${theme.colors.accent.primary}10`
              : theme.colors.surface,
            cursor: 'pointer',
            minHeight: '180px',
            transition: 'all 0.2s ease',
          }}
          onClick={() => document.getElementById('midi-file-input')?.click()}
        >
          <Upload
            size={48}
            color={isDragging ? theme.colors.accent.primary : theme.colors.text.secondary}
          />
          <div
            style={{
              textAlign: 'center',
              color: theme.colors.text.primary,
              fontWeight: '500',
            }}
          >
            {isDragging ? 'Drop MIDI file here' : 'Drag & drop MIDI file here'}
          </div>
          <div
            style={{
              textAlign: 'center',
              color: theme.colors.text.secondary,
              fontSize: '0.9rem',
            }}
          >
            or click to browse
          </div>
          <div
            style={{
              textAlign: 'center',
              color: theme.colors.text.tertiary,
              fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
          >
            Supports .mid and .midi files
          </div>

          {allowSampleSelection && samples.length > 0 && (
            <>
              <div
                style={{
                  margin: `${theme.spacing.md} 0`,
                  height: '1px',
                  background: theme.colors.border,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: theme.colors.surface,
                    padding: `0 ${theme.spacing.sm}`,
                    color: theme.colors.text.tertiary,
                    fontSize: '0.75rem',
                  }}
                >
                  OR
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSamples(!showSamples)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: theme.spacing.md,
                  background: theme.colors.glass.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Music size={20} color={theme.colors.accent.secondary} />
                  Select from Samples
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    transition: 'transform 0.2s',
                    transform: showSamples ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </motion.button>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            border: `2px solid ${theme.colors.accent.primary}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            background: `${theme.colors.accent.primary}10`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: theme.borderRadius.md,
              background: isFile(selectedFile) ? theme.colors.accent.primary : theme.colors.accent.secondary,
            }}
          >
            {isFile(selectedFile) ? (
              <File size={20} color={theme.colors.text.primary} />
            ) : (
              <Music size={20} color={theme.colors.text.primary} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: theme.colors.text.primary,
                fontWeight: '500',
                marginBottom: theme.spacing.xs,
              }}
            >
              {getDisplayName()}
            </div>
            <div
              style={{
                color: theme.colors.text.secondary,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            >
              {getDisplaySize()} KB {!isFile(selectedFile) && '• From Samples'}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: theme.colors.accent.primary,
            }}
          >
            <Check size={18} color={theme.colors.text.primary} />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClearFile}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              color: theme.colors.text.secondary,
            }}
          >
            <X size={16} />
          </motion.button>
        </motion.div>
      )}

      {/* Sample Selection Dropdown */}
      <AnimatePresence>
        {showSamples && samples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, maxHeight: 0 }}
            animate={{ opacity: 1, y: 0, maxHeight: 300 }}
            exit={{ opacity: 0, y: -10, maxHeight: 0 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: theme.colors.glass.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.lg,
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <div
              style={{
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              {samples.map((sample) => (
                <motion.button
                  key={sample.id}
                  whileHover={{ backgroundColor: theme.colors.glass.hover }}
                  onClick={() => handleSampleSelect(sample)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text.primary,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Music size={16} color={theme.colors.text.secondary} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{sample.name}</div>
                    <div style={{ fontSize: '0.75rem', color: theme.colors.text.secondary }}>
                      {(sample.size / 1024).toFixed(2)} KB • {new Date(sample.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        id="midi-file-input"
        type="file"
        accept=".mid,.midi"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
};
