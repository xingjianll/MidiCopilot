# MidiCopilot Frontend

Modern React-based UI for MidiCopilot - AI-powered MIDI music generation and continuation.

## Features

- **Visual Workflow Editor**: ComfyUI-inspired node-based workflow design
- **ARIA Integration**: Intuitive interface for ARIA model interaction
- **Drag & Drop**: Easy MIDI file uploads with drag-and-drop support
- **Real-time Feedback**: Live status updates during generation
- **Responsive Design**: Beautiful glass morphism UI with smooth animations

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Flow** for node-based workflow editor
- **Framer Motion** for smooth animations
- **Lucide React** for icons

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Backend server running (see `backend/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Or with pnpm
pnpm install

# Or with bun
bun install
```

### Running the Development Server

```bash
# Start dev server
npm run dev

# Or with pnpm
pnpm dev

# Or with bun
bun dev
```

The frontend will be available at http://localhost:5173

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── AriaExecutionPanel.tsx   # ARIA execution UI
│   │   ├── MidiFileUpload.tsx       # Drag & drop file upload
│   │   ├── WorkflowEditor.tsx       # Main workflow editor
│   │   ├── WorkflowDetail.tsx       # Workflow info panel
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Main landing page
│   │   ├── RunsPage.tsx    # Run history
│   │   └── SamplesPage.tsx # Sample library
│   ├── mockData.ts         # Mock data for workflows
│   ├── types.ts            # TypeScript type definitions
│   ├── theme.ts            # UI theme configuration
│   ├── App.tsx             # Main app component
│   └── main.tsx            # App entry point
├── public/                 # Static assets
├── package.json
└── README.md
```

## Key Components

### WorkflowEditor

The main workflow editor component that provides a visual node-based interface for creating and editing music generation workflows.

**Features:**
- Drag and drop workflow modules
- Connect nodes to create workflows
- Real-time workflow visualization
- Run workflows directly from the editor

### AriaExecutionPanel

A specialized panel for running the ARIA model with configurable parameters.

**Features:**
- MIDI file upload with drag & drop
- Adjustable generation parameters (temperature, top_p, max_length)
- Real-time status updates
- Download generated MIDI files

### MidiFileUpload

Reusable component for uploading MIDI files with drag-and-drop support.

**Props:**
- `onFileSelect`: Callback when file is selected
- `selectedFile`: Currently selected file
- `onClearFile`: Callback to clear the selected file

## Configuration

### Backend API URL

The frontend connects to the backend API at `http://localhost:8000`. If your backend runs on a different port, update the API calls in:

- `src/components/AriaExecutionPanel.tsx`

```typescript
const response = await fetch('http://localhost:YOUR_PORT/api/aria/continuation', {
  method: 'POST',
  body: formData,
});
```

### Theme Customization

Customize the UI theme in `src/theme.ts`:

```typescript
export const theme = {
  colors: {
    background: '#0a0a0f',
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      tertiary: '#64748b',
    },
    accent: {
      primary: '#4A90E2',
      secondary: '#7C3AED',
    },
    // ... more colors
  },
  // ... more theme properties
};
```

## Usage

### Running a Workflow

1. Navigate to the workflow editor (Home page)
2. The Aria module is pre-loaded in the editor
3. Click the "Run" button in the top-right
4. Upload a MIDI file using drag & drop or file browser
5. Adjust parameters (optional):
   - **Max Length**: Length of generated sequence (256-2048)
   - **Temperature**: Creativity level (0.5-1.5)
   - **Top P**: Sampling parameter (0.5-1.0)
6. Click "Run Aria" to generate
7. Download the generated MIDI file

### Viewing Workflow Details

- Click on any workflow module in the sidebar to view detailed information
- Click on nodes in the editor to see module details
- Click anywhere outside to close the detail panel

## Development

### Adding New Workflow Modules

1. Define the workflow in `src/mockData.ts`:

```typescript
{
  id: 'new-workflow',
  name: 'New Workflow',
  description: 'Description',
  detailedDescription: `## Detailed Description...`,
  createdAt: new Date().toISOString(),
  isModule: true,
  inputs: [
    { id: 'input1', name: 'Input', type: 'Type', required: true }
  ],
  outputs: [
    { id: 'output1', name: 'Output', type: 'Type' }
  ]
}
```

2. The workflow will automatically appear in the editor sidebar

### Creating New Execution Panels

Follow the pattern in `AriaExecutionPanel.tsx` to create panels for new workflow types.

## Troubleshooting

### CORS Issues

If you see CORS errors, ensure the backend CORS configuration includes your frontend URL:

```python
# backend/src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    ...
)
```

### File Upload Issues

- Ensure the backend is running and accessible
- Check browser console for network errors
- Verify MIDI file format (.mid or .midi)

## Contributing

When contributing, please:

1. Follow the existing code style
2. Use TypeScript strict mode
3. Add proper type definitions
4. Test your changes thoroughly
5. Update documentation as needed
