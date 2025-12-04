import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Volume2, Clock, HardDrive, FileIcon, Play, Download, ChevronDown, Loader2, Square } from 'lucide-react';
import { Sample } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { PianoRoll } from './PianoRoll';

interface SampleDetailProps {
  sample: Sample;
}

interface MidiPort {
  name: string;
  type: string;
}

export const SampleDetail: React.FC<SampleDetailProps> = ({ sample }) => {
  const [actualDuration, setActualDuration] = useState<number>(sample.duration);
  const [fileSize, setFileSize] = useState<number>(sample.size);
  const [midiPorts, setMidiPorts] = useState<MidiPort[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Fetch actual file size from backend
  useEffect(() => {
    const fetchFileSize = async () => {
      try {
        const response = await fetch(`http://localhost:8000/sample/${sample.id}/download`, {
          method: 'HEAD' // Just get headers, not the full file
        });
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            setFileSize(parseInt(contentLength));
          }
        }
      } catch (error) {
        console.error('Error fetching file size:', error);
      }
    };

    fetchFileSize();
  }, [sample.id]);

  // Fetch MIDI ports when component loads (for MIDI samples only)
  useEffect(() => {
    if (sample.type === 'midi') {
      fetchMidiPorts();
    }
  }, [sample.type]);

  // Fetch MIDI output ports
  const fetchMidiPorts = async () => {
    setLoadingPorts(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/ports');
      if (response.ok) {
        const data = await response.json();
        // Convert output_ports array to the expected format
        const ports = data.output_ports.map((portName: string) => ({
          name: portName,
          type: 'output'
        }));
        setMidiPorts(ports);
      } else {
        console.error('Failed to fetch MIDI ports');
        setMidiPorts([]);
      }
    } catch (error) {
      console.error('Error fetching MIDI ports:', error);
      setMidiPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  };

  // Play sample through selected MIDI port
  const handlePlaySample = async (portName: string) => {
    setPlaying(true);
    try {
      // First get the sample details to get the file path
      const sampleResponse = await fetch(`http://localhost:8000/sample/${sample.id}`);
      if (!sampleResponse.ok) {
        throw new Error('Failed to get sample details');
      }
      const sampleData = await sampleResponse.json();

      // Now play the MIDI file using the new Flask endpoint
      const response = await fetch('http://127.0.0.1:8001/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          midi_path: sampleData.path,
          port_name: portName 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sample played successfully:', result);
        // Keep playing state as true since music is playing asynchronously
      } else {
        const error = await response.json();
        alert(`Failed to play sample: ${error.error}`);
        setPlaying(false); // Only reset on error
      }
    } catch (error) {
      console.error('Error playing sample:', error);
      alert('Failed to play sample');
      setPlaying(false); // Only reset on error
    }
  };

  // Stop playing MIDI
  const handleStopSample = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/stop', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('Playback stopped successfully');
      } else {
        console.error('Failed to stop playback');
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    } finally {
      setPlaying(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = () => {
    return sample.type === 'midi' ? Music : Volume2;
  };

  const IconComponent = getIcon();

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          sample.type === 'midi' ? 'bg-primary' : 'bg-secondary'
        }`}>
          <IconComponent className={`h-6 w-6 ${
            sample.type === 'midi' ? 'text-primary-foreground' : 'text-secondary-foreground'
          }`} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {sample.name}
          </h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Created {formatDate(sample.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {sample.type === 'midi' ? (
          playing ? (
            <Button 
              size="lg" 
              onClick={handleStopSample}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg" 
                  disabled={loadingPorts}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {loadingPorts ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading MIDI ports...
                  </DropdownMenuItem>
                ) : midiPorts.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No MIDI output ports available
                  </DropdownMenuItem>
                ) : (
                  midiPorts.map((port) => (
                    <DropdownMenuItem
                      key={port.name}
                      onClick={() => handlePlaySample(port.name)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {port.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        ) : (
          <Button size="lg" disabled>
            <Play className="h-4 w-4 mr-2" />
            Play (MIDI only)
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Properties</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Type</span>
              <Badge variant={sample.type === 'midi' ? 'default' : 'secondary'} className="text-xs uppercase">
                {sample.type}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Format</span>
              <span className="font-medium">{sample.format}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(actualDuration)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">File Size</span>
              <span className="font-medium">{formatFileSize(fileSize)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {sample.type === 'midi' && (
        <PianoRoll sampleId={sample.id} onDurationUpdate={setActualDuration} />
      )}
    </div>
  );
};