# MyRivals Team Selector

## Contribution Rules

### Branching Policy
- **Always** create a new branch for your work:  
  `git checkout -b feature/your-feature-name` or `git checkout -b fix/issue-description`
- **Never** commit directly to `main` branch
- Prefix branch names with:
  - `feature/` for new features
  - `fix/` for bug fixes
  - `docs/` for documentation updates

### Commit Guidelines
- Use clear, descriptive commit messages
- Reference issues with `#issue-number`
- Keep commits focused - one feature/fix per commit

### Pull Requests
- PRs must be reviewed before merging
- Include description of changes
- Tag relevant team members for review

---

## Project Overview

A web application for generating balanced teams with Marvel characters across different game modes.

### Features
- Multiple game modes (Normal, Full Random, Role Queue)
- Dynamic team composition generation
- Real-time player lobby
- Responsive design for all devices

## Technologies
- React.js (Frontend)
- Node.js + WebSocket (Backend)
- Marvel API (Character data)

## Setup

### Prerequisites
- Node.js v16+
- npm/yarn

### Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/myrivals-team-selector.git
