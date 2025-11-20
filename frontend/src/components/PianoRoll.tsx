import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Midi } from '@tonejs/midi';
import { theme } from '../theme';
import { Loader2 } from 'lucide-react';

interface PianoRollProps {
  sampleId: string;
  onDurationUpdate?: (duration: number) => void;
}

interface Note {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ sampleId, onDurationUpdate }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Piano roll dimensions
  const noteHeight = 12;
  const minNoteWidth = 4;
  const pianoKeyWidth = 80;
  const whiteKeyIndices = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
  
  useEffect(() => {
    loadMidiData();
  }, [sampleId]);

  useEffect(() => {
    if (notes.length > 0 && canvasRef.current) {
      drawPianoRoll();
    }
  }, [notes]);

  const loadMidiData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the MIDI file
      const response = await fetch(`http://localhost:8000/sample/${sampleId}/download`);
      if (!response.ok) {
        throw new Error('Failed to load MIDI file');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      
      // Extract all notes from all tracks
      const allNotes: Note[] = [];
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          allNotes.push({
            pitch: note.midi,
            start: note.time,
            duration: note.duration,
            velocity: note.velocity,
          });
        });
      });
      
      // Sort notes by start time
      allNotes.sort((a, b) => a.start - b.start);
      setNotes(allNotes);
      
      // Calculate duration and notify parent
      if (allNotes.length > 0 && onDurationUpdate) {
        const duration = Math.max(...allNotes.map(n => n.start + n.duration));
        onDurationUpdate(duration);
      }
    } catch (err) {
      console.error('Error loading MIDI:', err);
      setError(err instanceof Error ? err.message : 'Failed to load MIDI data');
    } finally {
      setLoading(false);
    }
  };

  const drawPianoRoll = () => {
    const canvas = canvasRef.current;
    if (!canvas || notes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions
    const minPitch = Math.min(...notes.map(n => n.pitch));
    const maxPitch = Math.max(...notes.map(n => n.pitch));
    const pitchRange = maxPitch - minPitch + 1;
    const totalDuration = Math.max(...notes.map(n => n.start + n.duration));
    
    // Set canvas size to fit container
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const canvasWidth = containerWidth;
    const canvasHeight = Math.max(400, pitchRange * noteHeight + 40);
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate scaling to fit timeline in available width
    const timeScale = (canvasWidth - pianoKeyWidth) / totalDuration;
    
    // Draw time ruler at top
    const rulerHeight = 30;
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(pianoKeyWidth, 0, canvasWidth - pianoKeyWidth, rulerHeight);
    
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pianoKeyWidth, rulerHeight);
    ctx.lineTo(canvasWidth, rulerHeight);
    ctx.stroke();
    
    // Time markers
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    for (let time = 0; time <= totalDuration; time += 1) { // Every second
      const x = pianoKeyWidth + time * timeScale;
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      ctx.fillText(timeText, x + 4, rulerHeight / 2);
      
      // Tick mark
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight - 5);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();
    }
    
    // Draw piano keys on the left (offset by ruler height)
    for (let pitch = maxPitch; pitch >= minPitch; pitch--) {
      const y = rulerHeight + (maxPitch - pitch) * noteHeight;
      const isWhiteKey = whiteKeyIndices.includes(pitch % 12);
      
      // Piano key background
      ctx.fillStyle = isWhiteKey ? '#f8f9fa' : '#343a40';
      ctx.fillRect(0, y, pianoKeyWidth, noteHeight);
      
      // Piano key border
      ctx.strokeStyle = '#6c757d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, pianoKeyWidth, noteHeight);
      
      // Add note names
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = noteNames[pitch % 12];
      const octave = Math.floor(pitch / 12) - 1;
      
      ctx.fillStyle = isWhiteKey ? '#212529' : '#f8f9fa';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${noteName}${octave}`, 4, y + noteHeight / 2);
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 0.3;
    
    // Horizontal lines for each note (lighter for black keys)
    for (let pitch = maxPitch; pitch >= minPitch; pitch--) {
      const y = rulerHeight + (maxPitch - pitch) * noteHeight;
      const isWhiteKey = whiteKeyIndices.includes(pitch % 12);
      
      ctx.strokeStyle = isWhiteKey ? '#404040' : '#303030';
      ctx.beginPath();
      ctx.moveTo(pianoKeyWidth, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    
    // Vertical lines for time divisions (quarter notes and beats)
    const quarterNoteInterval = 0.5; // Quarter note at 120 BPM
    ctx.strokeStyle = '#404040';
    for (let time = 0; time <= totalDuration; time += quarterNoteInterval / 4) { // 16th note grid
      const x = pianoKeyWidth + time * timeScale;
      const isBeat = time % quarterNoteInterval === 0; // Quarter note
      const isMeasure = time % (quarterNoteInterval * 4) === 0; // Measure
      
      if (isMeasure) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#808080';
      } else if (isBeat) {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#606060';
      } else {
        ctx.lineWidth = 0.2;
        ctx.strokeStyle = '#404040';
      }
      
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Draw notes (offset by ruler height)
    notes.forEach(note => {
      const x = pianoKeyWidth + note.start * timeScale;
      const y = rulerHeight + (maxPitch - note.pitch) * noteHeight;
      const width = Math.max(minNoteWidth, note.duration * timeScale);
      
      // Note color based on velocity with better gradient
      const velocity = Math.min(1, Math.max(0, note.velocity));
      const baseHue = 210; // Blue base
      const saturation = 70 + velocity * 30; // 70-100%
      const lightness = 45 + velocity * 25; // 45-70%
      
      // Main note body
      ctx.fillStyle = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x + 1, y + 1, width - 2, noteHeight - 2);
      
      // Note highlight (top edge)
      ctx.fillStyle = `hsl(${baseHue}, ${saturation}%, ${Math.min(85, lightness + 20)}%)`;
      ctx.fillRect(x + 1, y + 1, width - 2, 2);
      
      // Note border
      ctx.strokeStyle = `hsl(${baseHue}, ${saturation + 10}%, ${lightness - 15}%)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, width - 1, noteHeight - 1);
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: theme.colors.text.secondary
      }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: '#ff4444'
      }}>
        Error loading piano roll: {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginTop: theme.spacing.lg,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{
        margin: `0 0 ${theme.spacing.md} 0`,
        color: theme.colors.text.primary,
        fontSize: '1.1rem',
        fontWeight: '600',
      }}>
        Piano Roll
      </h3>
      
      <div style={{
        width: '100%',
        height: '400px',
        background: '#1a1a1a',
        borderRadius: theme.borderRadius.md,
        border: '1px solid #404040',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: 'crosshair',
          }}
        />
      </div>
      
      <div style={{
        marginTop: theme.spacing.md,
        display: 'flex',
        gap: theme.spacing.lg,
        fontSize: '0.85rem',
        color: theme.colors.text.secondary,
        padding: theme.spacing.sm,
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <span><strong>Notes:</strong> {notes.length}</span>
        <span><strong>Duration:</strong> {notes.length > 0 ? Math.ceil(Math.max(...notes.map(n => n.start + n.duration))) : 0}s</span>
        {notes.length > 0 && (
          <>
            <span><strong>Range:</strong> {Math.min(...notes.map(n => n.pitch))}-{Math.max(...notes.map(n => n.pitch))}</span>
            <span><strong>Tracks:</strong> Multiple</span>
          </>
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
    </motion.div>
  );
};