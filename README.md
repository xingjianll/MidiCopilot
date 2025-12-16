# MidiCopilot
AI-powered music workspace with visual workflow editor for MIDI generation and manipulation.

https://github.com/user-attachments/assets/5e86de6c-96cb-4d13-a207-acdc044494fd

## Architecture

MidiCopilot consists of two main components:

- **Frontend**: React + TypeScript + Vite with visual workflow editor
- **Backend**: FastAPI + PyTorch for ARIA model inference

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
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
