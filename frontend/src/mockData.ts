import { Workflow, Run, Sample } from './types';

export const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Aria',
    description: 'AI-powered MIDI music continuation and generation',
    detailedDescription: `## Aria - Generative AI for MIDI Music

Aria is a state-of-the-art generative AI system designed for symbolic music composition, powered by the Anticipatory Music Transformer from Stanford University and Carnegie Mellon University.

### Core Technology
- **Base Model**: Anticipatory Music Transformer by John Thickstun, David Hall, Percy Liang (Stanford) and Chris Donahue (CMU)
- **Training Data**: Fine-tuned on 50,000+ MIDI transcriptions of popular songs across all genres
- **Specialization**: Fluent in harmonic structures and melodic patterns from the corpus of popular music

### Key Capabilities
- **Continuation Generation**: Creates natural left-to-right continuations of existing MIDI tracks
- **Contextual Awareness**: Analyzes surrounding musical context to generate fitting continuations
- **Genre Versatility**: Trained on diverse musical styles from jazz to electronic to classical
- **Symbolic Music Focus**: Specialized for MIDI/symbolic music rather than audio generation

### How It Works
1. Analyzes the input MIDI track for harmonic and melodic patterns
2. Uses transformer architecture to predict musically coherent continuations
3. Applies learned patterns from 50,000+ song database
4. Generates contextually appropriate MIDI continuation

Perfect for composers seeking AI-assisted inspiration, breaking creative blocks, or exploring new musical directions. Developed in partnership with HookTheory and integrated into professional music composition workflows.

*This is a specialized AI module optimized for MIDI music generation.*`,
    createdAt: '2024-01-15T10:30:00Z',
    isModule: true,
    inputs: [
      { id: 'track', name: 'Track', type: 'MidiTrack', required: true, description: 'Input MIDI track to continue' }
    ],
    outputs: [
      { id: 'continuation', name: 'Continuation', type: 'MidiTrack', description: 'AI-generated MIDI continuation' }
    ]
  },
  {
    id: '2',
    name: 'ACE-Step Music Generator',
    description: 'Foundation model for AI music generation from text prompts',
    detailedDescription: `## ACE-Step Music Generator - Foundation Model for AI Music

ACE-Step is a cutting-edge open-source foundation model for AI music generation developed by ACE Studio and StepFun, representing the "stable diffusion moment for music."

### Core Technology
- **Architecture**: Diffusion-based generation with Sana's Deep Compression AutoEncoder (DCAE)
- **Transformer**: Lightweight linear transformer for efficient processing
- **Semantic Alignment**: MERT and m-hubert for representation alignment (REPA)
- **License**: Apache 2.0 (fully open-source)

### Performance Capabilities
- **Ultra-Fast Generation**: Up to 4 minutes of music in 20 seconds on A100 GPU
- **Efficiency**: 15× faster than LLM-based baselines
- **Quality**: Superior musical coherence and lyric alignment
- **Hardware Support**: Optimized for RTX 4090 (34.48x RTF) and RTX 3090 (12.76x RTF)

### Advanced Features
- **Multi-genre Support**: All mainstream music styles
- **Multilingual**: 19 languages supported (English, Chinese, Russian, Spanish, Japanese, etc.)
- **Flexible Input**: Tags, genres, scene descriptions, lyrics, or detailed prompts
- **High Fidelity**: Preserves fine-grained acoustic details

Perfect for rapid prototyping, content creation, and professional music production workflows requiring high-quality AI-generated audio.

*This is a foundation model optimized for high-speed audio music generation.*`,
    createdAt: '2024-01-16T09:15:00Z',
    isModule: true,
    inputs: [
      { id: 'prompt', name: 'Prompt', type: 'string', required: true, description: 'Text description of the music to generate' },
      { id: 'duration', name: 'Duration', type: 'number', required: false, description: 'Length in seconds (up to 240)' },
      { id: 'genre', name: 'Genre', type: 'string', required: false, description: 'Musical genre (optional)' }
    ],
    outputs: [
      { id: 'audio', name: 'Generated Music', type: 'AudioTrack', description: 'AI-generated music audio' }
    ]
  },
  {
    id: '3',
    name: 'ACE-Step Voice Cloning',
    description: 'Advanced voice cloning and vocal synthesis',
    detailedDescription: `## ACE-Step Voice Cloning - Advanced Vocal Synthesis

Specialized ACE-Step module for voice cloning and vocal generation, enabling creation of custom vocal performances with remarkable fidelity.

### Core Capabilities
- **Voice Cloning**: Create synthetic vocals based on reference voice samples
- **Lyric-to-Vocal**: Generate singing voices from lyrics and melody
- **Style Transfer**: Apply different vocal styles to existing performances
- **Multi-language**: Support for 19 languages with native pronunciation

### Technical Features
- **Few-shot Learning**: Clone voices from minimal reference material
- **Emotional Control**: Adjust vocal emotion and expression
- **Pitch Accuracy**: Precise control over vocal pitch and timing
- **Natural Synthesis**: Human-like vocal characteristics and breathing

### Advanced Controls
- **Vocal Effects**: Vibrato, breathiness, vocal fry controls
- **Performance Style**: Pop, jazz, classical, folk vocal styles
- **Dynamic Expression**: Crescendo, diminuendo, accent control
- **Harmonic Generation**: Multi-part vocal harmonies

Built on ACE-Step's diffusion architecture for professional-quality vocal synthesis in creative and commercial applications.

*This is a specialized AI module for vocal synthesis and voice cloning.*`,
    createdAt: '2024-01-16T10:45:00Z',
    isModule: true,
    inputs: [
      { id: 'reference_voice', name: 'Reference Voice', type: 'AudioTrack', required: true, description: 'Voice sample to clone' },
      { id: 'lyrics', name: 'Lyrics', type: 'string', required: true, description: 'Lyrics to sing' },
      { id: 'melody', name: 'Melody', type: 'MidiTrack', required: false, description: 'Optional melody guide' }
    ],
    outputs: [
      { id: 'vocal', name: 'Cloned Vocal', type: 'AudioTrack', description: 'Generated vocal performance' }
    ]
  },
  {
    id: '4',
    name: 'ACE-Step Stem Separator',
    description: 'Intelligent music stem separation and remixing',
    detailedDescription: `## ACE-Step Stem Separator - Advanced Audio Separation

ACE-Step's stem separation module uses advanced AI to isolate and manipulate individual musical elements for remixing and production workflows.

### Separation Capabilities
- **Vocal Extraction**: Clean vocal isolation from mixed tracks
- **Instrumental Stems**: Separate drums, bass, guitar, piano, strings
- **Harmonic Analysis**: Identify and separate chord progressions
- **Rhythmic Elements**: Isolate percussion and rhythmic components

### Advanced Features
- **Smart Accompaniment**: Generate complementary instrument tracks
- **Style Adaptation**: Transform separated stems into different genres
- **Quality Enhancement**: AI-powered audio restoration and cleanup
- **Real-time Processing**: Low-latency separation for live applications

### Production Tools
- **Remix Ready**: Export stems optimized for DAW integration
- **Loop Creation**: Generate seamless loops from separated elements
- **Mashup Support**: Combine elements from multiple tracks
- **Creative Effects**: Apply AI-driven transformations to stems

Perfect for DJs, producers, and remixers who need professional-quality stem separation with creative flexibility.

*This is a specialized AI module for audio separation and stem processing.*`,
    createdAt: '2024-01-16T11:30:00Z',
    isModule: true,
    inputs: [
      { id: 'mixed_audio', name: 'Mixed Audio', type: 'AudioTrack', required: true, description: 'Full mix to separate' },
      { id: 'separation_type', name: 'Separation Type', type: 'string', required: true, description: 'Type of stems to extract (vocals, drums, bass, etc.)' }
    ],
    outputs: [
      { id: 'stems', name: 'Separated Stems', type: 'AudioTrack[]', description: 'Individual instrument/vocal tracks' }
    ]
  },
  {
    id: '5',
    name: 'Audio to MIDI Converter',
    description: 'Convert audio recordings to MIDI using advanced pitch detection',
    detailedDescription: `## Audio to MIDI Converter - Advanced Pitch Detection

A sophisticated AI-powered converter that analyzes audio recordings and extracts MIDI data with high accuracy and musical intelligence.

### Core Technology
- **Pitch Detection**: Advanced algorithms for fundamental frequency estimation
- **Onset Detection**: Precise note timing and rhythm analysis
- **Harmonic Analysis**: Multi-voice polyphonic transcription capability
- **Noise Filtering**: Robust performance with background noise

### Key Features
- **Polyphonic Transcription**: Handle multiple simultaneous notes
- **Instrument Recognition**: Optimized for different instrument types
- **Rhythm Quantization**: Smart timing correction and beat alignment
- **Dynamic Analysis**: Velocity mapping from audio amplitude

### Advanced Capabilities
- **Real-time Processing**: Low-latency conversion for live performance
- **Multi-track Support**: Separate stems into individual MIDI tracks
- **Genre Adaptation**: Optimized algorithms for different musical styles
- **Quality Control**: Confidence scoring and error detection

Perfect for musicians wanting to transcribe recordings, create backing tracks, or convert audio performances into editable MIDI data for further production work.

*This is a specialized AI module for audio-to-MIDI transcription.*`,
    createdAt: '2024-01-16T12:15:00Z',
    isModule: true,
    inputs: [
      { id: 'audio_input', name: 'Audio Input', type: 'AudioTrack', required: true, description: 'Audio recording to convert' },
      { id: 'instrument_type', name: 'Instrument Type', type: 'string', required: false, description: 'Type of instrument (piano, guitar, vocals, etc.)' }
    ],
    outputs: [
      { id: 'midi_output', name: 'MIDI Output', type: 'MidiTrack', description: 'Converted MIDI track' }
    ]
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