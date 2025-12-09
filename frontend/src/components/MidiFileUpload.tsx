import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, Check, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
      const response = await fetch('http://localhost:8000/sample/');
      const data = await response.json();
      setSamples(data.map((s: any) => {
        const fileName = s.path.split('/').pop() || `sample-${s.id}`;
        return {
          id: s.id.toString(),
          name: fileName,
          type: s.type.toLowerCase() as 'midi' | 'audio',
          duration: 0,
          createdAt: new Date().toISOString(),
          size: 0,
          format: fileName.split('.').pop()?.toUpperCase() || '',
          detailedDescription: '',
        };
      }));
    } catch (error) {
      console.error('Error fetching samples:', error);
    }
  };

  const handleSampleSelect = (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      onFileSelect({ 
        sampleId: sample.id, 
        name: sample.name,
        size: sample.size 
      });
    }
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
    <div className="w-full relative">
      {!selectedFile ? (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('midi-file-input')?.click()}
          className={cn(
            "border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[120px] transition-all hover:border-primary",
            isDragging && "border-primary bg-primary/10"
          )}
        >
          <Upload
            size={32}
            className={cn(
              "text-muted-foreground",
              isDragging && "text-primary"
            )}
          />
          <div className="text-center text-sm font-medium">
            Drop file here
          </div>

          {allowSampleSelection && samples.length > 0 && (
            <>
              <div className="relative w-full my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Select onValueChange={handleSampleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select from Samples">
                    <div className="flex items-center gap-2">
                      <Music size={16} />
                      Select from Samples
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {samples.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      <div className="flex items-center gap-2">
                        <Music size={16} className="text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{sample.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(sample.size / 1024).toFixed(2)} KB • {new Date(sample.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-primary bg-primary/10 p-4 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center",
              isFile(selectedFile) ? "bg-primary" : "bg-secondary"
            )}>
              {isFile(selectedFile) ? (
                <File size={20} className="text-primary-foreground" />
              ) : (
                <Music size={20} className="text-secondary-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">
                {getDisplayName()}
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                {getDisplaySize()} KB {!isFile(selectedFile) && '• From Samples'}
              </div>
            </div>
            <Badge variant="default" className="bg-primary">
              <Check size={14} className="mr-1" />
              Ready
            </Badge>
            <Button
              onClick={onClearFile}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X size={16} />
            </Button>
          </Card>
        </motion.div>
      )}

      <input
        id="midi-file-input"
        type="file"
        accept=".mid,.midi"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};