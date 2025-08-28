import { Workflow, Run, Sample } from './types';

export const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Chord Progression Generator',
    description: 'Generate chord progressions based on key and style',
    detailedDescription: `## Chord Progression Generator

This workflow generates sophisticated chord progressions based on music theory principles. 

### Features
- **Multi-genre support**: Jazz, Classical, Pop, Rock, Blues
- **Smart voice leading**: Ensures smooth transitions between chords
- **Customizable parameters**: Length, complexity, inversions
- **MIDI export**: Direct integration with your DAW

### How it works
1. Analyzes the input key signature
2. Selects appropriate chord families based on style
3. Applies voice leading algorithms
4. Outputs clean MIDI data

Perfect for composers looking to break out of creative blocks or explore new harmonic territories.`,
    createdAt: '2024-01-15T10:30:00Z',
    isModule: false,
    inputs: [
      { id: 'key', name: 'Key', type: 'string', required: true, description: 'Musical key (e.g., C major)' },
      { id: 'style', name: 'Style', type: 'string', required: true, description: 'Musical style (e.g., jazz, pop)' },
      { id: 'length', name: 'Length', type: 'number', required: false, description: 'Number of chords' }
    ],
    outputs: [
      { id: 'midi', name: 'MIDI Output', type: 'midi', description: 'Generated chord progression' }
    ]
  },
  {
    id: '2',
    name: 'Melody Harmonizer',
    description: 'Add harmony to existing melodies',
    detailedDescription: `## Melody Harmonizer

A sophisticated AI-powered harmonization engine that adds rich harmonic layers to your melodies.

### Core Capabilities
- **Multiple harmony styles**: Classical, Jazz, Contemporary, Modal
- **Voice arrangement**: 2-8 part harmonies
- **Intelligent spacing**: Optimal voice distribution
- **Real-time preview**: Hear results instantly

### Algorithm Features
- Analyzes melodic contour and rhythm
- Respects voice leading principles
- Avoids parallel motion issues
- Maintains musical coherence

*This is a built-in module optimized for performance.*`,
    createdAt: '2024-01-14T15:45:00Z',
    isModule: true,
    inputs: [
      { id: 'melody', name: 'Melody', type: 'midi', required: true, description: 'Input melody' },
      { id: 'harmony_type', name: 'Harmony Type', type: 'string', required: true, description: 'Type of harmony to add' }
    ],
    outputs: [
      { id: 'harmonized', name: 'Harmonized MIDI', type: 'midi', description: 'Melody with harmony' }
    ]
  },
  {
    id: '3',
    name: 'Drum Pattern Generator',
    description: 'Create drum patterns for different genres',
    detailedDescription: `## Drum Pattern Generator

Generate authentic drum patterns across multiple genres with intelligent variation and humanization.

### Supported Genres
- **Rock/Pop**: Classic and modern patterns
- **Jazz**: Swing, bebop, fusion styles  
- **Electronic**: House, techno, trap, breakbeat
- **World**: Latin, Afro-Cuban, Brazilian

### Advanced Features
- **Humanization**: Natural timing variations
- **Fill generation**: Automatic transitions
- **Polyrhythmic support**: Complex time signatures
- **Velocity mapping**: Realistic dynamics

Built for producers who need authentic, groovy drum tracks fast.`,
    createdAt: '2024-01-13T09:15:00Z',
    isModule: false,
    inputs: [
      { id: 'genre', name: 'Genre', type: 'string', required: true, description: 'Musical genre' },
      { id: 'tempo', name: 'Tempo', type: 'number', required: true, description: 'BPM' },
      { id: 'complexity', name: 'Complexity', type: 'number', required: false, description: 'Pattern complexity (1-10)' }
    ],
    outputs: [
      { id: 'drums', name: 'Drum Pattern', type: 'midi', description: 'Generated drum pattern' }
    ]
  }
];

export const mockRuns: Run[] = [
  {
    id: 'run-1',
    workflowId: '1',
    workflowName: 'Chord Progression Generator',
    detailedDescription: `## Jazz Chord Progression in C Major

This run generated an 8-chord jazz progression in C major using sophisticated voice leading.

### Generated Progression
1. **CM7** - Tonic, stable foundation
2. **Am7** - Relative minor, smooth transition  
3. **Dm7** - Subdominant, adds color
4. **G7** - Dominant, creates tension
5. **Em7** - Mediant, harmonic interest
6. **A7** - Secondary dominant to Dm
7. **Dm7** - Return to subdominant
8. **G7** - Back to dominant for loop

### Voice Leading Features
- Smooth bass line movement
- Minimal finger movement for piano
- Rich jazz extensions (7ths, 9ths)
- Proper resolution of tensions`,
    status: 'completed',
    createdAt: '2024-01-16T14:30:00Z',
    completedAt: '2024-01-16T14:31:15Z',
    inputs: { key: 'C major', style: 'jazz', length: 8 },
    outputs: { midi: 'chord_progression_jazz_c_major.mid' }
  },
  {
    id: 'run-2',
    workflowId: '2',
    workflowName: 'Melody Harmonizer',
    detailedDescription: `## Classical Harmony Processing

Currently harmonizing a lyrical melody using classical voice leading principles.

### Process Details
- **Input melody**: 32-bar classical theme in F major
- **Harmony style**: 4-part classical (SATB)
- **Voice leading**: Strict counterpoint rules
- **Processing time**: ~2 minutes for quality analysis

The algorithm is analyzing melodic intervals and selecting appropriate chord progressions that complement the melodic line while maintaining proper voice independence.`,
    status: 'running',
    createdAt: '2024-01-16T15:00:00Z',
    inputs: { melody: 'melody_input.mid', harmony_type: 'classical' }
  },
  {
    id: 'run-3',
    workflowId: '3',
    workflowName: 'Drum Pattern Generator',
    detailedDescription: `## Rock Pattern Generation Failed

Attempted to generate a rock drum pattern but encountered a parameter validation error.

### Error Analysis
The tempo parameter (120 BPM) was flagged as invalid by the validation system. This appears to be a bug in the input validation logic.

### Expected Behavior
- **Genre**: Rock should support 80-180 BPM range
- **Complexity**: Level 7 is within valid range (1-10)
- **Pattern type**: Basic rock with moderate fills

### Resolution
Check parameter validation rules and adjust tempo constraints for rock genre.`,
    status: 'failed',
    createdAt: '2024-01-16T13:45:00Z',
    completedAt: '2024-01-16T13:46:30Z',
    inputs: { genre: 'rock', tempo: 120, complexity: 7 },
    error: 'Invalid tempo parameter'
  }
];

export const mockSamples: Sample[] = [
  {
    id: 'sample-1',
    name: 'Piano Melody.mid',
    type: 'midi',
    duration: 45.5,
    createdAt: '2024-01-15T12:00:00Z',
    size: 2048,
    format: 'MIDI',
    detailedDescription: `## Piano Melody - Contemplative Theme

A beautiful, flowing piano melody in D minor with classical influences.

### Musical Details
- **Key**: D minor (natural minor scale)
- **Time signature**: 4/4
- **Tempo**: 72 BPM (andante)
- **Range**: F3 to D6 (3 octaves)

### Characteristics
- Lyrical, singing quality
- Rich use of intervals (3rds, 4ths, 6ths)
- Natural breathing points every 4 bars
- Perfect for developing variations or harmonizations

Ideal as a foundation for larger compositions or solo piano pieces.`
  },
  {
    id: 'sample-2',
    name: 'Jazz Drums.wav',
    type: 'audio',
    duration: 120.0,
    createdAt: '2024-01-14T18:30:00Z',
    size: 15728640,
    format: 'WAV',
    detailedDescription: `## Jazz Drums - Medium Swing

Professional jazz drum track recorded in a vintage studio with authentic gear.

### Recording Details
- **Style**: Medium swing feel
- **Tempo**: 140 BPM
- **Kit**: 1960s Ludwig Classic Maple
- **Microphones**: Ribbon and condenser blend

### Performance Features
- **Groove**: Traditional jazz ride pattern
- **Dynamics**: Natural crescendos and accents
- **Fills**: Tasteful 2 and 4-bar transitions
- **Feel**: Loose, behind-the-beat timing

Perfect for backing jazz standards or as a reference for programming.`
  },
  {
    id: 'sample-3',
    name: 'Bassline.mid',
    type: 'midi',
    duration: 32.0,
    createdAt: '2024-01-13T16:15:00Z',
    size: 1536,
    format: 'MIDI',
    detailedDescription: `## Funk Bassline - Syncopated Groove

A tight, rhythmic bassline with classic funk characteristics.

### Groove Analysis
- **Style**: P-Funk inspired pocket
- **Key**: E minor pentatonic
- **Pattern**: 2-bar repeating phrase
- **Techniques**: Slides, ghost notes, staccato

### MIDI Features
- **Velocity range**: 40-120 (dynamic playing)
- **Note timing**: Slightly ahead of beat
- **Articulation**: Mix of legato and staccato
- **Range**: E1 to G3

Great for hip-hop, funk, or R&B productions. Easily adaptable to different keys.`
  },
  {
    id: 'sample-4',
    name: 'Ambient Pad.mp3',
    type: 'audio',
    duration: 180.5,
    createdAt: '2024-01-12T10:45:00Z',
    size: 7340032,
    format: 'MP3',
    detailedDescription: `## Ambient Pad - Ethereal Soundscape

A lush, evolving ambient texture perfect for atmospheric productions.

### Sound Design
- **Synthesis**: Analog-modeled wavetable
- **Effects**: Reverb, chorus, delay, filter automation
- **Evolution**: 8-bar cycle with subtle variations
- **Frequency**: Primarily mid-range (200Hz-2kHz)

### Technical Specs
- **Bitrate**: 320kbps CBR
- **Sample rate**: 44.1kHz/16-bit
- **Dynamic range**: High (no limiting)
- **Loop points**: Seamless 16-bar cycle

Ideal for film scoring, meditation music, or as a foundation layer in electronic compositions.`
  }
];