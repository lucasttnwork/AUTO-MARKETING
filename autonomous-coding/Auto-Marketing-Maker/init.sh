#!/bin/bash

# AMA - Autonomous Marketing Agency Platform
# Environment Initialization Script

set -e  # Exit on error

echo "🚀 Initializing AMA Platform Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) detected"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

echo -e "${GREEN}✓${NC} pnpm $(pnpm --version) detected"

# Create agency_core directory structure if it doesn't exist
echo ""
echo -e "${BLUE}📁 Setting up agency_core directory structure...${NC}"

mkdir -p agency_core/{sops,clients,memory,harness}

echo -e "${GREEN}✓${NC} Created /agency_core/sops"
echo -e "${GREEN}✓${NC} Created /agency_core/clients"
echo -e "${GREEN}✓${NC} Created /agency_core/memory"
echo -e "${GREEN}✓${NC} Created /agency_core/harness"

# Install backend dependencies if server directory exists or create it
echo ""
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"

if [ ! -d "server" ]; then
    echo "Creating server directory..."
    mkdir -p server
fi

cd server

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "ama-server",
  "version": "1.0.0",
  "description": "Autonomous Marketing Agency Platform - Backend",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "keywords": ["marketing", "ai", "automation"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "@anthropic-ai/sdk": "^0.14.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
EOF
    echo -e "${GREEN}✓${NC} Created server/package.json"
fi

# Install dependencies
pnpm install

cd ..

# Install frontend dependencies
echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "ama-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7",
    "react-markdown": "^9.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
EOF
    echo -e "${GREEN}✓${NC} Created package.json"
fi

pnpm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${BLUE}🔐 Creating .env file...${NC}"

    # Check if API key exists at /tmp/api-key
    if [ -f "/tmp/api-key" ]; then
        echo "VITE_ANTHROPIC_API_KEY=/tmp/api-key" > .env
        echo "PORT=3001" >> .env
        echo -e "${GREEN}✓${NC} Created .env with API key reference"
    else
        echo "VITE_ANTHROPIC_API_KEY=/tmp/api-key" > .env
        echo "PORT=3001" >> .env
        echo -e "${YELLOW}⚠${NC}  .env created, but /tmp/api-key not found"
    fi
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo ""
    echo -e "${BLUE}📝 Initializing git repository...${NC}"
    git init
    git config user.name "AMA Platform" 2>/dev/null || true
    git config user.email "ama@platform.local" 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Git repository initialized"
fi

# Create basic .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.db
*.db-journal
.DS_Store
*.log
.vite/
EOF
    echo -e "${GREEN}✓${NC} Created .gitignore"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ AMA Platform Environment Setup Complete! ✨${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo -e "  1. Start the backend server:"
echo -e "     ${YELLOW}cd server && pnpm start${NC}"
echo ""
echo -e "  2. In a new terminal, start the frontend:"
echo -e "     ${YELLOW}pnpm dev${NC}"
echo ""
echo -e "  3. Open your browser to:"
echo -e "     ${YELLOW}http://localhost:5173${NC} (frontend)"
echo -e "     ${YELLOW}http://localhost:3001${NC} (backend API)"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  - Feature list: ${YELLOW}feature_list.json${NC}"
echo -e "  - Project spec: ${YELLOW}app_spec.txt${NC}"
echo -e "  - README: ${YELLOW}README.md${NC}"
echo ""
echo -e "${GREEN}Happy building! 🚀${NC}"
echo ""
