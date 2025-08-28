# Hours Tracker - System Requirements & Installation

## System Requirements

### Operating System
- **Linux**: Ubuntu 18.04+ or equivalent
- **macOS**: macOS 10.15+  
- **Windows**: Windows 10+

### Development Environment
- **Node.js**: v18.0+ (LTS recommended)
- **npm**: v8.0+ (comes with Node.js)
- **Rust**: v1.70+ (for Tauri desktop builds)

### Runtime Requirements
- **SQLite**: Built-in with better-sqlite3 (no separate installation needed)
- **Modern Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+

## Dependencies

### Production Dependencies
```json
{
  "better-sqlite3": "^12.2.0",      // SQLite database driver
  "date-fns": "^4.1.0",             // Date manipulation utilities
  "next": "15.5.2",                 // React framework
  "react": "^19.1.0",               // UI library
  "react-datepicker": "^8.7.0",     // Date picker component
  "react-dom": "^19.1.0",           // React DOM rendering
  "react-toastify": "^11.0.5"       // Toast notifications
}
```

### Development Dependencies
```json
{
  "@eslint/eslintrc": "^3",                    // ESLint configuration
  "@tauri-apps/api": "^2.8.0",               // Tauri API bindings
  "@tauri-apps/cli": "^2.8.3",               // Tauri CLI tools
  "@types/better-sqlite3": "^7.6.13",        // SQLite TypeScript types
  "@types/node": "^20",                       // Node.js TypeScript types
  "@types/react": "^19",                      // React TypeScript types
  "@types/react-datepicker": "^6.2.0",       // Date picker types
  "@types/react-dom": "^19",                  // React DOM TypeScript types
  "autoprefixer": "^10.4.21",                // CSS autoprefixer
  "eslint": "^9",                             // JavaScript/TypeScript linter
  "eslint-config-next": "15.5.2",            // Next.js ESLint rules
  "postcss": "^8",                            // CSS post-processor
  "tailwindcss": "^3.4.1",                   // CSS framework
  "typescript": "^5"                          // TypeScript compiler
}
```

## Installation Instructions

### 1. Prerequisites
```bash
# Install Node.js (if not installed)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be v18.0+
npm --version   # Should be v8.0+
```

### 2. Install Project Dependencies
```bash
# Navigate to project directory
cd /path/to/Hours-tracker

# Install all dependencies
npm install
```

### 3. Database Setup
```bash
# Database file (timetracker.db) will be created automatically on first run
# No manual setup required - SQLite handles initialization
```

### 4. Development Server
```bash
# Start development server
npm run dev

# Access application at: http://localhost:3000
```

### 5. Production Build
```bash
# Build for production
npm run build

# Start production server
npm run start

# Export static files (for Tauri)
npm run export
```

### 6. Desktop Application (Optional)

#### Install Rust (Required for Tauri)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
```

#### Build Desktop App
```bash
# Development desktop app
npm run tauri:dev

# Production desktop build
npm run tauri:build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build production-ready application |
| `npm run start` | Start production server |
| `npm run export` | Export static files for desktop deployment |
| `npm run lint` | Run ESLint code quality checks |
| `npm run tauri:dev` | Run desktop application in development mode |
| `npm run tauri:build` | Build desktop application for distribution |

## Quick Start
```bash
# 1. Clone or download project
# 2. Install dependencies
npm install

# 3. Start development
npm run dev

# 4. Open browser to http://localhost:3000
```

## Troubleshooting

### Common Issues
1. **Node.js version too old**: Upgrade to Node.js v18+
2. **SQLite errors**: Ensure better-sqlite3 compiled correctly with `npm rebuild`
3. **Tauri build fails**: Install Rust and system dependencies for your OS
4. **Port 3000 in use**: Kill existing process or use different port

### System-Specific Notes
- **Windows**: May need Visual Studio Build Tools for native dependencies
- **Linux**: May need `python3`, `make`, `g++` for native compilation
- **macOS**: Xcode Command Line Tools required for native dependencies

## Database Location
- Development: `./timetracker.db` in project root
- Production: Same location as application executable
- Data persists between application restarts