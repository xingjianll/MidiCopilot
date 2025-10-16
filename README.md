# MidiCopilot

AI-powered music workspace with visual workflow editor for MIDI generation and manipulation.

## Features

🎵 **ARIA Model Integration**: State-of-the-art MIDI continuation using the Anticipatory Music Transformer
🎨 **Visual Workflow Editor**: ComfyUI-inspired node-based interface for music generation
📁 **Drag & Drop Upload**: Easy MIDI file uploads with intuitive UI
⚙️ **Configurable Parameters**: Fine-tune generation with temperature, top-p, and length controls
💾 **Export & Download**: Save and download generated MIDI files
🎭 **Glass Morphism UI**: Beautiful, modern interface with smooth animations

## Architecture

MidiCopilot consists of two main components:

- **Frontend**: React + TypeScript + Vite with visual workflow editor
- **Backend**: FastAPI + PyTorch for ARIA model inference

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+ or Bun
- [UV](https://astral.sh/uv) (Python package manager)
- [pnpm](https://pnpm.io) (Node package manager)

### Installation

Install UV:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install pnpm:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MidiCopilot
   ```

2. **Install dependencies**

   Backend:
   ```bash
   cd backend
   uv sync
   cd ..
   ```

   Frontend:
   ```bash
   cd frontend
   pnpm install
   cd ..
   ```

3. **Run the development servers**

   From the root directory:
   ```bash
   pnpm run dev
   ```

   This will start:
   - Backend API at http://localhost:8000
   - Frontend UI at http://localhost:5173

### Manual Start (Optional)

If you prefer to start servers separately:

**Backend:**
```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
pnpm dev
```

## Usage

1. **Open the application** at http://localhost:5173
2. **Navigate to the workflow editor** (Home page)
3. **Click the "Run" button** in the top-right corner
4. **Upload a MIDI file** using drag & drop or file browser
5. **Adjust parameters** (optional):
   - **Max Length**: 256-2048 tokens
   - **Temperature**: 0.5-1.5 (higher = more creative)
   - **Top P**: 0.5-1.0 (nucleus sampling)
6. **Click "Run Aria"** to generate
7. **Download** the generated MIDI continuation

## Project Structure

```
MidiCopilot/
├── backend/                 # FastAPI backend
│   ├── src/
│   │   ├── dto/            # Pydantic models
│   │   ├── services/       # Business logic (ARIA service)
│   │   └── main.py         # FastAPI app
│   ├── data/
│   │   ├── uploads/        # Uploaded MIDI files
│   │   └── outputs/        # Generated MIDI files
│   └── pyproject.toml      # Python dependencies
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AriaExecutionPanel.tsx
│   │   │   ├── MidiFileUpload.tsx
│   │   │   └── WorkflowEditor.tsx
│   │   ├── pages/          # Page components
│   │   ├── mockData.ts     # Workflow definitions
│   │   ├── types.ts        # TypeScript types
│   │   └── theme.ts        # UI theme
│   └── package.json        # Node dependencies
│
└── README.md
```

## API Documentation

Once the backend is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

- `POST /api/aria/continuation` - Generate MIDI continuation
- `GET /api/aria/download/{filename}` - Download generated MIDI

## Model Information

**ARIA (Anticipatory Music Transformer)**

- **Source**: `loubb/aria-medium-base` on Hugging Face
- **Type**: Causal Language Model for symbolic music
- **Training**: 50,000+ MIDI transcriptions across all genres
- **Specialization**: MIDI continuation and generation

### Device Support

- **macOS (Apple Silicon)**: Uses MPS (Metal Performance Shaders)
- **Others**: Falls back to CPU

## Configuration

### Backend

Edit `backend/src/main.py` to configure:
- CORS origins
- File upload limits
- Model parameters

### Frontend

Edit `frontend/src/components/AriaExecutionPanel.tsx` to change:
- API endpoint URL
- Default parameters

Edit `frontend/src/theme.ts` to customize:
- Colors
- Spacing
- Border radius
- Effects

## Development

### Adding New Workflows

1. Define workflow in `frontend/src/mockData.ts`
2. Create execution panel component (follow `AriaExecutionPanel.tsx`)
3. Implement backend service and endpoints
4. Connect frontend to backend API

### Backend Development

```bash
cd backend

# Run tests
pytest

# Format code
ruff format src/

# Lint code
ruff check src/
```

### Frontend Development

```bash
cd frontend

# Run type checking
pnpm tsc

# Lint code
pnpm lint

# Build for production
pnpm build
```

## Troubleshooting

### Model Loading Issues

If the ARIA model fails to load:

```bash
# Clear Hugging Face cache
rm -rf ~/.cache/huggingface/

# Manually trigger model download
python -c "from backend.src.services.aria_service import get_aria_service; get_aria_service()"
```

### CORS Errors

Ensure backend CORS settings in `backend/src/main.py` include your frontend URL:

```python
allow_origins=["http://localhost:5173"]
```

### File Upload Failures

- Check backend is running and accessible
- Verify MIDI file format (.mid or .midi)
- Check browser console for network errors

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license here]

## Acknowledgments

- **ARIA Model**: Based on the Anticipatory Music Transformer by Stanford and CMU
- **UI Inspiration**: ComfyUI's node-based workflow design
- **Libraries**: React Flow, Framer Motion, FastAPI, PyTorch

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation in `backend/README.md` and `frontend/README.md`

---

Built with ❤️ for musicians and AI enthusiasts
