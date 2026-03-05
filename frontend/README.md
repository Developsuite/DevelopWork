# Board Platform - Frontend

A beautiful, modern monday.com-style board platform built with React, TypeScript, and a minimal white & blue design theme.

## 🎨 Design System

- **Font**: Figtree (Google Fonts)
- **Base Font Size**: Small (13px)
- **Color Scheme**: White & Blue minimal aesthetic
- **Primary Color**: #0073EA (Blue)
- **Background**: White (#FFFFFF) with light gray accents

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components (AppShell)
│   ├── sidebar/          # Sidebar components (WorkspaceSwitcher, BoardList)
│   ├── topbar/           # Top bar components (Search, Notifications, Profile)
│   ├── board/
│   │   ├── table-view/   # Table view components
│   │   ├── kanban-view/  # Kanban view components
│   │   └── item-drawer/  # Item drawer components
│   └── common/           # Shared/reusable components
├── pages/
│   ├── auth/             # Authentication pages (Login, Register)
│   ├── board/            # Board pages
│   └── workspace/        # Workspace pages
├── store/
│   └── slices/           # Redux slices (boards, groups, items, ui, auth)
├── services/
│   └── api/              # API service modules
├── styles/               # Theme, GlobalStyles, ThemeProvider
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── hooks/                # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Emotion** - CSS-in-JS styling
- **Lucide React** - Icon library

## 📦 Key Dependencies

- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React bindings for Redux
- `react-router-dom` - Routing
- `@emotion/react` & `@emotion/styled` - Styling
- `lucide-react` - Icons

## 🎯 Development Phases

### Phase 1: ✅ Project Setup & Design System (Complete)
- Project structure created
- Design system with Figtree font
- White & blue minimal theme
- Redux store setup
- Basic layout (AppShell, Sidebar, TopBar)

### Phase 2: 🚧 Core Board Functionality (Next)
- Table view with groups and items
- Mock data integration
- Board navigation

### Phase 3: Inline Editing & Item Drawer
### Phase 4: Advanced Features (Kanban, Search)
### Phase 5: Backend Integration
### Phase 6: Authentication & Security
### Phase 7: Polish & Testing

## 🎨 Theme Colors

```typescript
Primary Blue: #0073EA
Light Blue: #4A9FF5
Lighter Blue: #E3F2FF
Dark Blue: #0060C2

Background: #FFFFFF
Secondary BG: #F8F9FA
Tertiary BG: #F1F3F5

Text Primary: #212529
Text Secondary: #6C757D
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Development Server

The app runs on `http://localhost:5173/` by default.

## 📄 License

MIT
