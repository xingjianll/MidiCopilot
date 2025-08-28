import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Sample } from '../types';
import { mockSamples } from '../mockData';
import { theme } from '../theme';
import { ViewToggle } from '../components/ViewToggle';
import { SampleCard } from '../components/SampleCard';
import { SampleRow } from '../components/SampleRow';
import { SampleDetail } from '../components/SampleDetail';

export const SamplesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  // Auto-select first sample in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedSample) {
      setSelectedSample(mockSamples[0]);
    }
  }, [viewMode, selectedSample]);

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
    } else if (mode === 'column' && !selectedSample) {
      setSelectedSample(mockSamples[0]);
    }
  };

  if (viewMode === 'column') {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Column view: Split screen */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: theme.colors.glass.surface,
              backdropFilter: theme.blur.sm,
            }}
          >
            <h1
              style={{
                margin: 0,
                color: theme.colors.text.primary,
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              Samples
            </h1>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                overflow: 'hidden',
              }}
            >
              {mockSamples.map((sample) => (
                <SampleRow
                  key={sample.id}
                  sample={sample}
                  onClick={() => handleSampleClick(sample)}
                  isSelected={selectedSample?.id === sample.id}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Detail panel takes remaining space */}
        <div style={{ flex: 1, background: theme.colors.background, overflow: 'auto', padding: theme.spacing.xl }}>
          {selectedSample && (
            <SampleDetail sample={selectedSample} />
          )}
        </div>
      </div>
    );
  }

  // Card view: Full screen with bottom drawer (better for piano rolls)
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            Samples
          </h1>
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: `${theme.spacing.lg} 0 ${theme.spacing.lg} ${theme.spacing.lg}` }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: theme.spacing.lg,
              width: '100%',
              overflowX: 'auto',
              padding: '0 0 1rem 0',
            }}
          >
            {mockSamples.map((sample) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ minWidth: '300px', width: '300px', flexShrink: 0 }}
              >
                <SampleCard
                  sample={sample}
                  onClick={() => handleSampleClick(sample)}
                  isSelected={selectedSample?.id === sample.id}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom drawer for card view (better for piano rolls) */}
      <AnimatePresence>
        {selectedSample && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme.colors.glass.backdrop,
                zIndex: 40,
              }}
            />
            
            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60vh',
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                zIndex: 50,
                overflow: 'auto',
                padding: theme.spacing.xl,
              }}
            >
              <SampleDetail sample={selectedSample} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};