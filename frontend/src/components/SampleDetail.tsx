import { motion } from 'framer-motion';
import { Music, Volume2, Clock, HardDrive, FileIcon, Play, Download } from 'lucide-react';
import { Sample } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { PianoRoll } from './PianoRoll';

interface SampleDetailProps {
  sample: Sample;
}

export const SampleDetail: React.FC<SampleDetailProps> = ({ sample }) => {
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
    <div className="flex flex-col gap-6">
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
        <Button size="lg">
          <Play className="h-4 w-4 mr-2" />
          Play
        </Button>

        <Button variant="outline" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
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
              <span className="font-medium">{formatDuration(sample.duration)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">File Size</span>
              <span className="font-medium">{formatFileSize(sample.size)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {sample.type === 'midi' && (
        <PianoRoll sampleId={sample.id} />
      )}
    </div>
  );
};