import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Sample } from '../types';
import { ViewToggle } from '../components/ViewToggle';
import { SampleCard } from '../components/SampleCard';
import { SampleRow } from '../components/SampleRow';
import { SampleDetail } from '../components/SampleDetail';
import { PageHeader } from '../components/page-header';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Plus, Upload, Loader2, RefreshCw } from 'lucide-react';

export const SamplesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch samples from backend
  const fetchSamples = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/sample/');
      const data = await response.json();
      
      // Convert backend format to frontend format
      // Backend returns array of {id: number, type: SampleType, path: string}
      const formattedSamples: Sample[] = data.map((s: any) => {
        const fileName = s.path.split('/').pop() || `sample-${s.id}`;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        return {
          id: s.id.toString(),
          name: fileName,
          type: s.type.toLowerCase() as 'midi' | 'audio',
          duration: 0, // We don't track duration in backend yet
          createdAt: new Date().toISOString(), // Backend doesn't return creation date yet
          size: 0, // We don't track size in backend yet
          format: extension.toUpperCase(),
          detailedDescription: generateDetailedDescription({
            id: s.id,
            name: fileName,
            type: s.type,
            path: s.path,
            format: extension.toUpperCase()
          }),
        };
      });
      
      setSamples(formattedSamples);
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate detailed description from sample metadata
  const generateDetailedDescription = (sample: any) => {
    let description = `## ${sample.name}\n\n`;

    description += `### Sample Details\n`;
    description += `- **Type**: ${sample.type}\n`;
    description += `- **Format**: ${sample.format}\n`;
    description += `- **File Path**: ${sample.path}\n`;
    description += `- **Sample ID**: ${sample.id}\n`;

    if (sample.type.toLowerCase() === 'midi') {
      description += `\n### MIDI Information\n`;
      description += `This is a MIDI file that can be used as input for AI music generation models like ARIA.\n`;
    } else if (sample.type.toLowerCase() === 'audio') {
      description += `\n### Audio Information\n`;
      description += `This is an audio file that can be processed or analyzed.\n`;
    }

    return description;
  };

  // Load samples on mount and when samples change
  useEffect(() => {
    fetchSamples();
  }, []);

  // Auto-select first sample in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedSample && samples.length > 0) {
      setSelectedSample(samples[0]);
    }
  }, [viewMode, selectedSample, samples]);

  const handleSampleClick = (sample: Sample) => {
    setSelectedSample(sample);
  };

  const closeDetail = () => {
    if (viewMode === 'card') {
      setSelectedSample(null);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'card') {
      setSelectedSample(null);
    } else if (mode === 'column' && !selectedSample && samples.length > 0) {
      setSelectedSample(samples[0]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/sample/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh samples list
        await fetchSamples();
      } else {
        alert('Failed to upload sample: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error uploading sample:', error);
      alert('Failed to upload sample');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (sampleId: string) => {
    if (!confirm('Are you sure you want to delete this sample?')) return;

    try {
      const response = await fetch(`http://localhost:8000/sample/${sampleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh samples list
        await fetchSamples();
        // Clear selection if deleted sample was selected
        if (selectedSample?.id === sampleId) {
          setSelectedSample(null);
        }
      } else {
        alert('Failed to delete sample: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Failed to delete sample');
    }
  };

  const handleDownload = (sampleId: string) => {
    // TODO: Backend doesn't have download endpoint yet
    // window.open(`http://localhost:8000/sample/${sampleId}/download`, '_blank');
    console.log('Download not implemented yet for sample:', sampleId);
  };

  if (viewMode === 'column') {
    return (
      <>
        <PageHeader
          title="Samples"
          actions={
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchSamples}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                size="sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sample
                  </>
                )}
              </Button>
              <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
            </div>
          }
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Column view: Split screen */}
          <div className="w-96 flex flex-col border-r">
            <div className="flex-1 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : samples.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No samples yet. Upload your first MIDI file!</p>
                  </div>
                ) : (
                  samples.map((sample) => (
                    <SampleRow
                      key={sample.id}
                      sample={sample}
                      onClick={() => handleSampleClick(sample)}
                      isSelected={selectedSample?.id === sample.id}
                    />
                  ))
                )}
              </motion.div>
            </div>
          </div>

          {/* Detail panel takes remaining space */}
          <div className="flex-1 overflow-auto p-6 bg-muted/50">
            {selectedSample && (
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-2 z-10">
                  <Button
                    onClick={() => handleDownload(selectedSample.id)}
                    size="sm"
                  >
                    Download
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedSample.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
                <SampleDetail sample={selectedSample} />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Card view: Full screen with overlay drawer
  return (
    <>
      <PageHeader
        title="Samples"
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchSamples}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </>
              )}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-row gap-4 w-full overflow-x-auto pb-4"
        >
          {loading ? (
            <div className="flex items-center justify-center w-full h-48 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center w-full p-8 text-muted-foreground">
              <p>No samples yet. Upload your first MIDI file!</p>
            </div>
          ) : (
            samples.map((sample) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-w-[300px] w-[300px] flex-shrink-0"
              >
                <SampleCard
                  sample={sample}
                  onClick={() => handleSampleClick(sample)}
                  isSelected={selectedSample?.id === sample.id}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Sheet overlay for card view */}
      <Sheet open={!!selectedSample} onOpenChange={() => setSelectedSample(null)}>
        <SheetContent className="w-[500px] overflow-auto">
          {selectedSample && (
            <div className="relative">
              <div className="absolute top-0 right-0 flex gap-2 z-10">
                <Button
                  onClick={() => handleDownload(selectedSample.id)}
                  size="sm"
                >
                  Download
                </Button>
                <Button
                  onClick={() => handleDelete(selectedSample.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
              <SampleDetail sample={selectedSample} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mid,.midi"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
};