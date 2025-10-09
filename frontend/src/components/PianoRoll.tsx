import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Midi } from '@tonejs/midi';
import { theme } from '../theme';
import { Loader2 } from 'lucide-react';

interface PianoRollProps {
  sampleId: string;
}

interface Note {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ sampleId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Piano roll dimensions
  const noteHeight = 6;
  const minNoteWidth = 2;
  const pianoKeyWidth = 40;
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
      const response = await fetch(`http://localhost:8000/api/samples/${sampleId}/download`);
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
    
    // Set canvas size
    const canvasWidth = canvas.parentElement?.clientWidth || 800;
    const canvasHeight = Math.max(300, pitchRange * noteHeight + 40);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate scaling
    const timeScale = (canvasWidth - pianoKeyWidth) / totalDuration;
    
    // Draw piano keys on the left
    for (let pitch = maxPitch; pitch >= minPitch; pitch--) {
      const y = (maxPitch - pitch) * noteHeight;
      const isWhiteKey = whiteKeyIndices.includes(pitch % 12);
      
      ctx.fillStyle = isWhiteKey ? '#FFFFFF' : '#2A2A2A';
      ctx.fillRect(0, y, pianoKeyWidth - 1, noteHeight - 1);
      
      // Add note name for C notes
      if (pitch % 12 === 0) {
        ctx.fillStyle = isWhiteKey ? '#000000' : '#FFFFFF';
        ctx.font = '10px monospace';
        ctx.fillText(`C${Math.floor(pitch / 12) - 1}`, 2, y + noteHeight - 2);
      }
    }
    
    // Draw grid lines
    ctx.strokeStyle = theme.colors.border;
    ctx.lineWidth = 0.5;
    
    // Horizontal lines for each note
    for (let pitch = maxPitch; pitch >= minPitch; pitch--) {
      const y = (maxPitch - pitch) * noteHeight;
      ctx.beginPath();
      ctx.moveTo(pianoKeyWidth, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    
    // Vertical lines for beats (assuming 120 BPM, 0.5s per beat)
    const beatInterval = 0.5;
    for (let time = 0; time <= totalDuration; time += beatInterval) {
      const x = pianoKeyWidth + time * timeScale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Draw notes
    notes.forEach(note => {
      const x = pianoKeyWidth + note.start * timeScale;
      const y = (maxPitch - note.pitch) * noteHeight;
      const width = Math.max(minNoteWidth, note.duration * timeScale);
      
      // Note color based on velocity
      const velocityColor = Math.floor(155 + note.velocity * 100);
      ctx.fillStyle = `rgb(${velocityColor}, ${Math.floor(velocityColor * 0.6)}, ${Math.floor(velocityColor * 0.3)})`;
      ctx.fillRect(x, y + 1, width - 1, noteHeight - 2);
      
      // Note border
      ctx.strokeStyle = theme.colors.accent.primary;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + 1, width - 1, noteHeight - 2);
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
        overflow: 'auto',
        maxWidth: '100%',
        background: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            minHeight: '300px',
          }}
        />
      </div>
      
      <div style={{
        marginTop: theme.spacing.sm,
        display: 'flex',
        gap: theme.spacing.lg,
        fontSize: '0.8rem',
        color: theme.colors.text.secondary,
      }}>
        <span>Total Notes: {notes.length}</span>
        <span>Duration: {notes.length > 0 ? Math.ceil(Math.max(...notes.map(n => n.start + n.duration))) : 0}s</span>
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