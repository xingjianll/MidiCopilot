import { Workflow, Run, Sample } from './types';

export const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Aria',
    description: 'AI-powered MIDI music continuation and generation',
    detailedDescription: `## Aria - Autoregressive Piano MIDI Generation

Aria is a pretrained autoregressive generative model specialized in symbolic music generation, built on the LLaMA 3.2 architecture.

### Model Architecture
- **Base Model**: LLaMA 3.2 (1B)
- **Parameters**: 659M parameters
- **License**: Apache 2.0 (open source)
- **Specialization**: Solo piano MIDI generation and embeddings

### Training Details
- **Dataset**: ~60,000 hours of expressive solo-piano MIDI recordings
- **Focus**: Realistic piano compositions and continuations
- **Approach**: Pure autoregressive training (no instruction tuning or RLHF)
- **Quality**: Trained on high-quality, expressive performances

### Key Capabilities
- **MIDI Continuation**: Generates natural continuations of existing piano pieces
- **Realistic Compositions**: Produces musically coherent piano music
- **Contrastive Embeddings**: Creates MIDI embeddings for analysis
- **Expressive Performance**: Captures nuanced piano playing dynamics

### Best Practices
- **Optimal Input**: Single-track piano MIDI files
- **Input Quality**: Works best with well-played music as prompts
- **Use Case**: Piano composition continuation and generation
- **Note**: Model may compositionally memorize some popular classical pieces

### Technical Notes
- Sensitive to input quality - better prompts yield better results
- Designed specifically for solo piano, not multi-instrument arrangements
- No post-training alignment, pure generative capability

Developed with support from EleutherAI, Stability AI, and the Korean Ministry of Science and ICT.

*This is a specialized AI module optimized for solo piano MIDI generation.*`,
    createdAt: '2024-01-15T10:30:00Z',
    isModule: true,
    inputs: [
      { id: 'track', name: 'Track', type: 'MidiTrack', required: true, description: 'Input MIDI track to continue' }
    ],
    outputs: [
      { id: 'continuation', name: 'Continuation', type: 'MidiTrack', description: 'AI-generated MIDI continuation' }
    ]
  },
  
  // Aria Harmony
  {
    id: 'aria-harmony',
    name: 'Aria Harmony',
    description: 'ARIA model fine-tuned for harmonic generation and accompaniment',
    createdAt: '2024-10-15',
    isModule: true,
    inputs: [
      {
        id: 'track',
        name: 'Track',
        type: 'MidiTrack',
        description: 'Input MIDI track (melody or partial harmony)',
        required: true
      }
    ],
    outputs: [
      {
        id: 'harmony',
        name: 'Harmony',
        type: 'MidiTrack',
        description: 'Generated harmonic accompaniment'
      }
    ],
    detailedDescription: `## ARIA Harmony

ARIA Harmony is a specialized variant of the base ARIA model, fine-tuned specifically for **harmonic generation and accompaniment**. This model excels at creating rich harmonic contexts for melodies or completing partial harmonic structures.

### Key Features
- **Harmonic Intelligence**: Understands complex chord progressions and voice leading
- **Style Preservation**: Maintains harmonic style consistent with the input
- **Multi-Voice Generation**: Creates full harmonic textures with proper voice leading
- **Context-Sensitive**: Adapts harmony based on melodic and rhythmic context

### Technical Details
- **Base Model**: ARIA (LLaMA 3.2)
- **Fine-tuning**: LoRA adapters trained on harmonic progressions
- **Specialized Training**: Focus on Bach chorales, classical harmonizations
- **Checkpoint**: aria-harmony-epoch=02-val_loss=4.2002.ckpt

### Usage Notes
- Excellent for harmonizing melodies
- Can complete partial chord progressions
- Works well with both simple and complex melodic inputs
- Option to ignore prompt for pure harmonic generation

### Ignore Prompt Option
When enabled, generates completely new harmonic material inspired by but not directly continuing the input.`
  },
  
  // Aria Style (Chopin)
  {
    id: 'aria-style',
    name: 'Aria Style (Chopin)',
    description: 'ARIA model fine-tuned on Chopin\'s romantic style',
    createdAt: '2024-10-15',
    isModule: true,
    inputs: [
      {
        id: 'track',
        name: 'Track',
        type: 'MidiTrack',
        description: 'Input MIDI track for style transfer',
        required: true
      }
    ],
    outputs: [
      {
        id: 'styled',
        name: 'Styled Output',
        type: 'MidiTrack',
        description: 'Chopin-style transformation'
      }
    ],
    detailedDescription: `## ARIA Style - Chopin

ARIA Style (Chopin) is a specialized variant fine-tuned exclusively on **Frédéric Chopin's** complete works. This model captures the essence of Chopin's romantic style, including his characteristic rubato, ornamentations, and harmonic language.

### Key Features
- **Authentic Chopin Style**: Trained on all of Chopin's piano works
- **Romantic Expression**: Captures rubato, dynamics, and phrasing
- **Ornamental Flourishes**: Generates characteristic runs, trills, and grace notes
- **Harmonic Sophistication**: Uses Chopin's unique harmonic progressions

### Technical Details
- **Base Model**: ARIA (LLaMA 3.2)
- **Fine-tuning**: LoRA adapters trained exclusively on Chopin
- **Training Data**: Complete Chopin piano works (Nocturnes, Études, Ballades, etc.)
- **Checkpoint**: aria-style-epoch=06-val_loss=2.0712.ckpt

### Musical Characteristics
- **Nocturne-like**: Singing melodies with rich accompaniment
- **Virtuosic Elements**: Incorporates technical passages typical of Chopin
- **Romantic Harmony**: Chromatic progressions and unexpected modulations
- **Expressive Timing**: Natural rubato and tempo fluctuations

### Usage Notes
- Best with romantic-era style inputs
- Can transform simple melodies into Chopin-like compositions
- Maintains input structure while applying stylistic elements
- Option to generate entirely new Chopin-style pieces

### Ignore Prompt Option
When enabled, generates original Chopin-style compositions inspired by but not directly based on the input.`
  }
];

export const mockRuns: Run[] = [
  {
    id: 'run-1',
    workflowId: '1',
    workflowName: 'Aria',
    detailedDescription: `## MIDI Continuation - Piano Ballad

Aria successfully generated a 16-bar continuation for a romantic piano ballad in F major.

### Input Analysis
- **Original Track**: 8-bar piano melody in F major, 4/4 time
- **Style Detected**: Contemporary ballad with jazz influences
- **Harmonic Context**: I-vi-IV-V progression pattern
- **Melodic Character**: Lyrical, stepwise motion with occasional leaps

### Generated Continuation
- **Length**: 16 bars (double the input length)
- **Harmonic Development**: Extended the progression with ii-V-I cadences
- **Melodic Continuity**: Maintained the lyrical character while introducing new motivic material
- **Dynamic Flow**: Natural phrase structure with breathing spaces
- **Voice Leading**: Smooth connections maintaining the established style

### AI Insights
Aria identified the romantic ballad style and applied learned patterns from similar songs in its training data, creating a continuation that feels both familiar and fresh. The generated material includes subtle variations that maintain musical interest while respecting the original's emotional character.`,
    status: 'completed',
    createdAt: '2024-01-16T14:30:00Z',
    completedAt: '2024-01-16T14:32:45Z',
    inputs: { track: 'piano_ballad_8bars.mid' },
    outputs: { continuation: 'piano_ballad_continuation_16bars.mid' }
  },
  {
    id: 'run-2',
    workflowId: '1',
    workflowName: 'Aria',
    detailedDescription: `## MIDI Continuation - Jazz Solo Processing

Currently generating a continuation for a bebop-style jazz melody using Aria's jazz-trained neural networks.

### Process Details
- **Input Track**: 32-bar jazz standard melody in Bb major
- **Detected Style**: Bebop with complex chord changes
- **Harmonic Analysis**: Sophisticated ii-V-I chains with tritone substitutions
- **Processing Stage**: Analyzing melodic phrases and chord-tone relationships

### AI Processing
Aria is applying its knowledge of jazz improvisation patterns, learned from thousands of jazz transcriptions in its training data. The model is identifying key bebop characteristics like chromatic approach notes, chord extensions, and rhythmic displacement.

### Expected Output
A musically coherent 32-bar continuation that maintains the bebop style while introducing new melodic ideas consistent with the harmonic context.`,
    status: 'running',
    createdAt: '2024-01-16T15:00:00Z',
    inputs: { track: 'jazz_bebop_32bars.mid' }
  },
  {
    id: 'run-3',
    workflowId: '1',
    workflowName: 'Aria',
    detailedDescription: `## MIDI Continuation Failed - Input Validation Error

Aria encountered an error while processing a multi-track MIDI file due to input format constraints.

### Error Analysis
The input MIDI file contained 8 separate tracks (piano, bass, drums, strings, etc.) but Aria is designed to process single melodic tracks for continuation generation.

### Input Specifications
- **File**: full_arrangement_8tracks.mid
- **Problem**: Multi-track arrangement with complex orchestration
- **Expected Format**: Single melodic track (MidiTrack type)

### Resolution Required
Extract the main melodic line into a separate single-track MIDI file, or use a different workflow designed for full arrangement processing.

### Technical Details
Aria's Anticipatory Music Transformer is optimized for symbolic melody continuation rather than full multi-track orchestration. For best results, provide isolated melodic content."""`,
    status: 'failed',
    createdAt: '2024-01-16T13:45:00Z',
    completedAt: '2024-01-16T13:46:12Z',
    inputs: { track: 'full_arrangement_8tracks.mid' },
    error: 'Invalid input format: Multi-track MIDI not supported. Please provide single melodic track.'
  },
  {
    id: 'run-4',
    workflowId: '2',
    workflowName: 'ACE-Step Music Generator',
    detailedDescription: `## Electronic Dance Music Generation

ACE-Step successfully generated a 3-minute electronic dance music track with professional production quality.

### Generation Details
- **Prompt**: "High-energy EDM track with deep bass drops, synthesizer leads, and driving 4/4 beat"
- **Duration**: 180 seconds
- **Genre**: Electronic Dance Music
- **Processing Time**: 18 seconds on A100 GPU

### Generated Elements
- **Intro**: 16-bar buildup with filtered synths and rising tension
- **Drop**: Massive bass drop with hard-hitting kick drums and lead synth
- **Breakdown**: Melodic section with arpeggiated sequences
- **Final Drop**: Climactic section with all elements combined

### Technical Quality
- **Sample Rate**: 44.1kHz stereo
- **Dynamic Range**: Professional mastering levels
- **Frequency Response**: Full spectrum with powerful sub-bass
- **Stereo Imaging**: Wide soundstage with proper instrument placement

Perfect for DJ sets, workout playlists, or commercial dance music applications.`,
    status: 'completed',
    createdAt: '2024-01-16T16:15:00Z',
    completedAt: '2024-01-16T16:15:18Z',
    inputs: { prompt: 'High-energy EDM track with deep bass drops, synthesizer leads, and driving 4/4 beat', duration: 180, genre: 'electronic' },
    outputs: { audio: 'edm_track_180sec.wav' }
  },
  {
    id: 'run-5',
    workflowId: '3',
    workflowName: 'ACE-Step Voice Cloning',
    detailedDescription: `## Voice Cloning - Pop Ballad Performance

Currently processing voice cloning for an emotional pop ballad using a reference vocal sample.

### Processing Details
- **Reference Voice**: 30-second sample of female pop vocalist
- **Lyrics**: Full verse and chorus of emotional ballad (64 words)
- **Melody Guide**: Piano melody in D minor, 72 BPM
- **Style**: Contemporary pop with emotional delivery

### Voice Analysis
ACE-Step is analyzing the reference vocal's characteristics including:
- **Timbre**: Warm, breathy vocal texture
- **Vibrato**: Natural vibrato patterns on sustained notes
- **Articulation**: Clear consonants with smooth legato phrasing
- **Dynamics**: Natural crescendos and emotional swells

### Expected Output
A complete vocal performance that captures the reference voice's characteristics while delivering the new lyrics with emotional authenticity and musical precision.`,
    status: 'running',
    createdAt: '2024-01-16T17:30:00Z',
    inputs: { reference_voice: 'female_pop_reference_30sec.wav', lyrics: 'When the stars align tonight, I\'ll be waiting here for you...', melody: 'ballad_melody_d_minor.mid' }
  },
  {
    id: 'run-6',
    workflowId: '4',
    workflowName: 'ACE-Step Stem Separator',
    detailedDescription: `## Stem Separation - Classic Rock Track

ACE-Step successfully separated a classic rock song into individual instrumental and vocal stems for remixing.

### Separation Results
- **Original Track**: 4-minute classic rock song with full band arrangement
- **Processing Time**: 45 seconds
- **Quality**: Professional-grade separation with minimal artifacts

### Extracted Stems
1. **Lead Vocals**: Clean vocal isolation with natural reverb preserved
2. **Background Vocals**: Harmony parts separated from lead
3. **Electric Guitar**: Lead guitar with effects chain intact  
4. **Rhythm Guitar**: Power chords and rhythm patterns
5. **Bass Guitar**: Deep bass line with punch and clarity
6. **Drums**: Full drum kit with proper kit piece isolation
7. **Piano**: Hammond organ and piano accompaniment

### Technical Quality
- **Frequency Separation**: Clean separation across all frequency ranges
- **Phase Coherence**: Stems maintain phase relationships for remixing
- **Dynamic Preservation**: Original dynamics and punch retained
- **Artifact Level**: Minimal bleeding between instruments

Perfect for remixing, karaoke production, or educational music analysis.`,
    status: 'completed',
    createdAt: '2024-01-16T18:45:00Z',
    completedAt: '2024-01-16T18:45:45Z',
    inputs: { mixed_audio: 'classic_rock_full_mix.wav', separation_type: 'full_stems' },
    outputs: { stems: ['lead_vocal.wav', 'bg_vocals.wav', 'lead_guitar.wav', 'rhythm_guitar.wav', 'bass.wav', 'drums.wav', 'piano.wav'] }
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