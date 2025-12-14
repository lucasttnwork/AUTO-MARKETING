# AMA - Autonomous Marketing Agency Platform

A fully functional Autonomous Marketing Agency platform—a "Company-in-a-Box" system that acts as a virtual marketing department. This application provides an interactive SaaS-style visual interface combined with a "Super Agent" conversational AI that understands all system functions and can guide users or execute any operation via natural language.

## 🎯 Overview

This project is mirrored on GitHub at [https://github.com/lucasttnwork/AUTO-MARKETING](https://github.com/lucasttnwork/AUTO-MARKETING). The agent can reference this repository whenever it needs to inspect commit history, push new changes, or correlate its local work with the remote source.

The AMA Platform integrates the MAKER framework (Maximal Agentic Decomposition with Voting) for reliable decision-making and multi-agent collaboration, backed by Git-based state management for full audit trails. The system executes, learns, evolves, and self-improves through continuous optimization cycles.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React with Vite
- **Styling:** Tailwind CSS (via CDN)
- **State Management:** React hooks, context, and Zustand
- **Routing:** React Router
- **Markdown:** React Markdown for message rendering
- **Port:** 5173 (default Vite port)

### Backend
- **Runtime:** Node.js with Express
- **Database:** SQLite with better-sqlite3
- **API Integration:** Claude/Anthropic API for all agent operations
- **Streaming:** Server-Sent Events (SSE) for real-time updates
- **Version Control:** Git integration for state management
- **Port:** 3001

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- API key available at `/tmp/api-key` (or configure in `.env`)

### Installation

1. **Clone or navigate to the project directory**

2. **Run the initialization script:**
   ```bash
   ./init.sh
   ```

   This script will:
   - Install all dependencies (frontend and backend)
   - Create the `/agency_core` directory structure
   - Initialize the Git repository
   - Create `.env` configuration
   - Set up the database schema

3. **Start the backend server:**
   ```bash
   cd server
   pnpm start
   ```

4. **In a new terminal, start the frontend:**
   ```bash
   pnpm dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📋 Project Structure

```
ama-platform/
├── agency_core/              # Core agency files
│   ├── sops/                # Standard Operating Procedures
│   ├── clients/             # Client workspaces
│   ├── memory/              # Performance memory & learnings
│   └── harness/             # Agent harness & state
├── server/                   # Backend application
│   ├── index.js             # Main server entry
│   ├── database.js          # Database setup & migrations
│   ├── routes/              # API route handlers
│   └── agents/              # Agent implementations
├── src/                      # Frontend application
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── store/               # Zustand stores
│   └── utils/               # Utility functions
├── feature_list.json         # 200+ test cases (source of truth)
├── app_spec.txt             # Complete project specification
├── init.sh                  # Environment setup script
└── README.md                # This file
```

## ✨ Core Features

### 1. Super Agent Interface
- Conversational AI assistant that knows ALL system functions
- Natural language command execution
- Intelligent task decomposition via MAKER framework
- Real-time streaming of agent thoughts and actions
- Voice input support
- Human-in-the-loop checkpoints

### 2. Visual Dashboard
- Modern SaaS-style interface with dark/light themes
- Client portfolio overview with key metrics
- Real-time task queue visualization
- Campaign performance dashboards
- Agent activity feed
- Git commit history audit trail

### 3. Client Management
- Client onboarding with brand absorption
- ICP (Ideal Customer Profile) definition
- Competitor analysis automation
- SWOT generation
- Client workspace management

### 4. Campaign Factory
- Campaign creation wizard
- Angle development with Congress voting
- Offer structuring tools
- Funnel mapping visual editor
- Multi-format asset production
- A/B test configuration

### 5. Agent Congress System
- Multi-agent parallel execution
- MAKER voting with consensus
- Worker agents: Copywriter, Designer, VideoScript, Spy
- Critic agent feedback loops
- Red-flag detection for human intervention

### 6. Market Intelligence
- Competitor monitoring dashboard
- Meta Ad Library integration
- Trend detection and alerts
- Winning pattern extraction
- Auto-generated iteration briefs

### 7. Performance Optimization
- Real-time ROAS, CTR, CPC, CPM monitoring
- Automated winner/loser identification
- Creative fatigue detection
- Scaling protocol recommendations
- Performance memory learning system

### 8. Reporting & Communication
- Weekly/monthly automated reports
- Client dashboard templates
- Meeting agenda generator
- Export in multiple formats (PDF, CSV, Notion)

## 🧪 Testing

The `feature_list.json` file contains **200+ detailed test cases** that serve as the single source of truth for what needs to be built. Each test case includes:

- **Category:** functional or style
- **Description:** What the feature does
- **Steps:** Detailed testing steps
- **Passes:** Boolean flag (initially all false)

### Testing Workflow

1. Implement a feature
2. Test according to the steps in `feature_list.json`
3. Mark `"passes": true` only when fully working
4. **NEVER remove or edit features** - only mark as passing

## 🎨 Design System

### Color Palette
- **Primary:** Deep Blue (#1E3A5F)
- **Accent:** Vibrant Orange (#FF6B35)
- **Success:** Green (#22C55E)
- **Warning:** Amber (#F59E0B)
- **Error:** Red (#EF4444)

### Dark Mode
- **Background:** #0F172A
- **Surface:** #1E293B
- **Text:** #F1F5F9

### Light Mode
- **Background:** #FFFFFF
- **Surface:** #F8FAFC
- **Text:** #1E293B

## 📊 Database Schema

The SQLite database includes the following tables:

- **users** - User accounts and preferences
- **clients** - Client information and settings
- **campaigns** - Campaign data and configurations
- **tasks** - Task queue and execution history
- **agent_executions** - Agent execution logs
- **voting_sessions** - Congress voting records
- **creative_assets** - Generated creative content
- **market_intel** - Competitor intelligence data
- **performance_memory** - Performance learnings
- **sops** - Standard Operating Procedures
- **constitution** - Policy rules and guidelines
- **conversations** - Super Agent chat history
- **git_commits** - Git audit trail
- **usage_tracking** - Token and cost tracking

## 🔌 API Endpoints

Key endpoint categories:

- `/api/agent/*` - Super Agent operations
- `/api/clients/*` - Client management
- `/api/campaigns/*` - Campaign operations
- `/api/tasks/*` - Task management
- `/api/agents/*` - Agent execution & voting
- `/api/creative/*` - Creative generation
- `/api/intel/*` - Market intelligence
- `/api/performance/*` - Performance data
- `/api/sops/*` - SOP management
- `/api/reports/*` - Report generation
- `/api/git/*` - Git operations

See `app_spec.txt` for complete endpoint documentation.

## 🔐 Security

- API keys stored securely (never in git)
- Environment variables for sensitive configuration
- Input validation on all endpoints
- Secure database queries (parameterized)
- CORS configuration for frontend access

## 🤝 Development Workflow

### For Continuing Agents

1. **Read `claude-progress.txt`** to understand what's been done
2. **Check `feature_list.json`** to see what needs work
3. **Implement features** one at a time
4. **Test thoroughly** following the test steps
5. **Mark features as passing** when complete
6. **Commit progress** with clear messages
7. **Update `claude-progress.txt`** before ending session

### Git Workflow

- Commit frequently with descriptive messages
- Include feature references in commit messages
- Use Git for audit trail of all changes
- Never force push or rewrite history

## 📈 Success Criteria

### Functionality
- Super Agent executes all system functions via natural language
- Agent Congress produces high-quality creative with consensus
- Client onboarding completes within 1 hour
- Performance optimization runs automatically every 24h
- Full audit trail via Git

### User Experience
- Intuitive SaaS-style interface
- Helpful and contextually aware responses
- Seamless navigation
- Fully functional mobile experience
- Polished dark mode

### Performance
- Time to First Ad Live: < 48 hours
- Creative Variations: > 50 per client/month
- Ad Compliance Rate: 100%
- Human Intervention: < 10% of tasks
- System Uptime: > 99.5%

## 📝 Notes

- **Production Quality:** This is built to production standards
- **Unlimited Time:** Quality over speed across many sessions
- **Feature List is Sacred:** Never remove features, only mark as passing
- **Git is Truth:** All state changes are tracked in Git
- **Documentation:** Keep README and progress notes updated

## 🆘 Troubleshooting

### Backend won't start
- Check Node.js version (18+ required)
- Verify dependencies are installed: `cd server && pnpm install`
- Check port 3001 is not in use

### Frontend won't start
- Verify dependencies are installed: `pnpm install`
- Check port 5173 is not in use
- Ensure Vite is properly configured

### API errors
- Verify API key is available at `/tmp/api-key`
- Check `.env` configuration
- Review server logs for details

### Database errors
- Delete `.db` files and restart to recreate schema
- Check file permissions on database file
- Verify better-sqlite3 is installed

## 📞 Support

For issues or questions:
1. Check `app_spec.txt` for detailed specifications
2. Review `feature_list.json` for feature requirements
3. Check `claude-progress.txt` for recent work
4. Review git commits for implementation history

---

**Built with ❤️ by autonomous Claude agents**

Version: 1.0.0
Last Updated: 2024
