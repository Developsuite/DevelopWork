# Implementation Plan: Monday-Style Board Platform

## Overview

This implementation plan follows a phased, frontend-first approach using the MERN stack (MongoDB, Express, React, Node.js). The design emphasizes a beautiful, sleek, modern aesthetic with Figtree font and minimal, clean styling. Each phase builds incrementally, allowing for early validation and iterative development.

The implementation is organized into 7 phases:
1. Project setup, design system, and basic layout structure
2. Core board functionality (Table view, groups, items)
3. Inline editing and item drawer
4. Additional views (Kanban) and advanced features
5. Backend API integration and state management
6. Authentication, RBAC, and security
7. Polish, optimization, and testing

## Tasks

## Phase 1: Project Setup, Design System, and Basic Layout

- [x] 1. Initialize project structure and development environment
  - Create React app with TypeScript using Vite
  - Set up ESLint and Prettier for code quality
  - Configure TypeScript with strict mode
  - Install core dependencies: React 18, TypeScript, React Router
  - Create basic folder structure: /src/components, /src/pages, /src/styles, /src/utils
  - _Requirements: Foundation for all development_

- [ ] 2. Set up design system and global styles
  - [ ] 2.1 Install and configure styling solution (Emotion or styled-components)
    - Install @emotion/react and @emotion/styled
    - Create theme configuration file with color palette
    - Define spacing scale, breakpoints, and shadows
    - _Requirements: Design foundation_
  
  - [ ] 2.2 Implement typography system with Figtree font
    - Import Figtree font from Google Fonts
    - Create typography scale (heading1-6, body, caption, small)
    - Set small base font size as specified in design preferences
    - Define font weights and line heights
    - _Requirements: Design theme consistency_
  
  - [ ] 2.3 Create design tokens and theme provider
    - Define color tokens (primary, secondary, neutral, status colors)
    - Create spacing tokens (xs, sm, md, lg, xl)
    - Implement ThemeProvider wrapper component
    - Export theme hook for component usage
    - _Requirements: Consistent design system_


- [ ] 3. Build three-panel layout structure (AppShell)
  - [ ] 3.1 Create AppShell component with flexbox layout
    - Implement three-panel structure: sidebar, main content, optional AI panel
    - Add responsive behavior for panel sizing
    - Create layout context for managing panel states
    - _Requirements: 23.1, 23.4_
  
  - [ ] 3.2 Implement collapsible left sidebar
    - Create LeftSidebar component with collapse/expand animation
    - Add toggle button with smooth transition (300ms)
    - Store sidebar state in local storage for persistence
    - Implement responsive auto-collapse for mobile (<768px)
    - _Requirements: 23.4, 33.1_
  
  - [ ] 3.3 Create top bar component structure
    - Build TopBar component with flexbox layout
    - Add placeholder sections for search, notifications, profile
    - Implement sticky positioning for scroll behavior
    - Style with minimal, clean aesthetic
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [ ] 4. Checkpoint - Verify layout and design system
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Core Board Functionality (Table View, Groups, Items)

- [ ] 5. Set up Redux Toolkit for state management
  - [ ] 5.1 Install and configure Redux Toolkit
    - Install @reduxjs/toolkit and react-redux
    - Create Redux store with TypeScript configuration
    - Set up root reducer with initial slices
    - Wrap app with Redux Provider
    - _Requirements: State management foundation_
  
  - [ ] 5.2 Create normalized data slices
    - Create boardsSlice with normalized structure (byId, allIds)
    - Create groupsSlice with normalized structure
    - Create itemsSlice with normalized structure
    - Create uiSlice for UI state (activeBoard, drawerOpen, etc.)
    - Define TypeScript types for all state shapes
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 6. Implement mock data and data normalization
  - [ ] 6.1 Create mock data generators
    - Generate sample workspace data
    - Generate sample board with multiple groups
    - Generate sample items with various field types
    - Create utility to normalize nested data structures
    - _Requirements: Development data for UI building_
  
  - [ ] 6.2 Implement data normalization utilities
    - Write normalizeBoardData function
    - Write denormalization selectors with reselect
    - Add TypeScript types for normalized entities
    - _Requirements: 21.1, 21.2, 21.3_


- [ ] 7. Build sidebar navigation components
  - [ ] 7.1 Create workspace switcher dropdown
    - Build WorkspaceSwitcher component with dropdown menu
    - Display workspace name and icon
    - Add workspace list with selection handler
    - Style with minimal design and smooth animations
    - _Requirements: 23.1, 23.2_
  
  - [ ] 7.2 Implement board list with icons
    - Create BoardList component displaying boards
    - Add board type icons (project, CRM, support, HR, finance)
    - Implement board selection and navigation
    - Add hover states and active board highlighting
    - _Requirements: 23.2, 23.3_

- [ ] 8. Create Table view components
  - [ ] 8.1 Build BoardViewManager component
    - Create view type selector (Table, Kanban, Timeline, Calendar)
    - Implement view switching logic
    - Add view state management in Redux
    - Style view selector toolbar with minimal design
    - _Requirements: 18.1, 18.2, 18.4, 18.5_
  
  - [ ] 8.2 Implement TableView component structure
    - Create TableView component with table layout
    - Build column header row with column names and types
    - Add table body container for groups
    - Implement responsive column widths
    - _Requirements: 16.1, 16.5_
  
  - [ ] 8.3 Create Group component with collapse functionality
    - Build Group component as collapsible section
    - Add group header with name and item count
    - Implement collapse/expand animation
    - Add "Add Item" button in group footer
    - Store collapse state in Redux
    - _Requirements: 6.4, 16.1, 16.3, 16.4_
  
  - [ ] 8.4 Build ItemRow component for table display
    - Create ItemRow component displaying item fields as cells
    - Implement cell rendering for different field types
    - Add row hover effects and click handlers
    - Style with clean, minimal aesthetic
    - _Requirements: 16.2, 16.4_

- [ ] 9. Implement basic item and group creation
  - [ ] 9.1 Add "Create Group" functionality
    - Create AddGroup button in board header
    - Build group creation modal/inline form
    - Implement Redux action to add group with position
    - Validate group name (1-100 characters)
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ] 9.2 Add "Create Item" functionality
    - Create AddItem button in group footer
    - Build inline item creation form
    - Implement Redux action to add item with position
    - Set default field values (status, priority, assignee)
    - Validate item name (1-200 characters)
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 37.1, 37.2, 37.3_

- [ ] 10. Checkpoint - Verify core board display
  - Ensure all tests pass, ask the user if questions arise.


## Phase 3: Inline Editing and Item Drawer

- [ ] 11. Implement inline cell editing system
  - [ ] 11.1 Create InlineCellEditor component
    - Build base InlineCellEditor with edit mode toggle
    - Add click-to-edit activation
    - Implement keyboard shortcuts (Enter to save, Escape to cancel)
    - Add loading state during save
    - _Requirements: 8.1, 8.4, 8.5, 32.1, 32.2_
  
  - [ ] 11.2 Build field type editors
    - Create TextEditor for text fields
    - Create StatusEditor with dropdown for status selection
    - Create DateEditor with date picker
    - Create PersonEditor with user selection dropdown
    - Create PriorityEditor with priority options
    - Create TagsEditor with multi-select
    - _Requirements: 8.2, Field type support_
  
  - [ ] 11.3 Implement field validation
    - Create validateFieldValue function for all field types
    - Add inline error display for validation failures
    - Validate text length constraints
    - Validate status against column options
    - Validate date format
    - Validate person field against workspace members
    - Validate priority values (low, medium, high, critical)
    - _Requirements: 8.2, 8.3, 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [ ] 11.4 Add optimistic updates for cell edits
    - Implement optimistic update in Redux reducer
    - Update UI immediately on save
    - Send API request in background (mock for now)
    - Add rollback logic for failed updates
    - Display toast notification on failure
    - _Requirements: 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.5 Write property test for optimistic update rollback
  - **Property 6: Optimistic Update Rollback**
  - **Validates: Requirements 9.4, 9.5**

- [ ] 12. Build Item Drawer component
  - [ ] 12.1 Create ItemDrawer slide-over panel
    - Build ItemDrawer component with slide-in animation
    - Implement backdrop with click-to-close
    - Add close button with Escape key support
    - Make drawer full-screen on mobile (<1024px)
    - _Requirements: 10.1, 10.4, 10.5, 32.4, 33.3_
  
  - [ ] 12.2 Implement drawer tab navigation
    - Create tab bar with Overview, Updates, Files, Activity tabs
    - Add tab switching logic
    - Style tabs with minimal, clean design
    - Highlight active tab
    - _Requirements: 10.2_
  
  - [ ] 12.3 Build Overview tab
    - Display all item fields in editable format
    - Show item name as large heading
    - Display created by, created at, updated at metadata
    - Add field editors for all field types
    - _Requirements: 10.3_
  
  - [ ] 12.4 Create Updates tab structure
    - Build UpdatesList component displaying comments
    - Add UpdateComposer for new comments
    - Display user avatar, name, and timestamp for each update
    - Style with clean, minimal design
    - _Requirements: 11.1, 11.2, 11.4_


- [ ] 13. Implement updates and mentions system
  - [ ] 13.1 Add rich text editor for updates
    - Install and configure @tiptap/react
    - Create RichTextEditor component
    - Add basic formatting (bold, italic, links)
    - Implement @mention functionality with user autocomplete
    - _Requirements: 11.1, 11.3_
  
  - [ ] 13.2 Build mention detection and notification creation
    - Extract mentioned user IDs from update content
    - Create notification entries for mentioned users
    - Add notification badge to top bar
    - _Requirements: 11.3, 12.1, 12.2, 12.5_
  
  - [ ] 13.3 Create activity log system
    - Build ActivityLog component for Activity tab
    - Create activity log entries for field updates
    - Create activity log entries for item creation
    - Create activity log entries for comments
    - Display activity logs in chronological order (newest first)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 13.4 Write property test for mention notification delivery
  - **Property 7: Mention Notification Delivery**
  - **Validates: Requirements 12.1, 12.2, 12.5**

- [ ]* 13.5 Write property test for activity log completeness
  - **Property 8: Activity Log Completeness**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.5**

- [ ] 14. Checkpoint - Verify editing and drawer functionality
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Additional Views and Advanced Features

- [ ] 15. Implement drag-and-drop for item reordering
  - [ ] 15.1 Install and configure react-beautiful-dnd
    - Install react-beautiful-dnd library
    - Set up DragDropContext in TableView
    - Configure Droppable for groups
    - Configure Draggable for items
    - _Requirements: Drag-and-drop foundation_
  
  - [ ] 15.2 Implement item reordering within groups
    - Handle onDragEnd for same-group reordering
    - Calculate new positions for affected items
    - Update Redux state with new positions
    - Implement optimistic UI update
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ] 15.3 Implement item movement between groups
    - Handle onDragEnd for cross-group movement
    - Update item's groupId and position
    - Recalculate positions in source group (close gap)
    - Recalculate positions in target group (make space)
    - Update Redux state with batch changes
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 15.4 Write property test for position uniqueness
  - **Property 2: Unique Positions Within Groups**
  - **Validates: Requirements 7.4, 14.5, 15.5**

- [ ]* 15.5 Write property test for sequential positions
  - **Property 3: Sequential Positions**
  - **Validates: Requirements 6.5, 7.5, 14.2, 15.2, 15.3**


- [ ] 16. Build Kanban view
  - [ ] 16.1 Create KanbanView component structure
    - Build KanbanView component with horizontal column layout
    - Create KanbanColumn component for status columns
    - Add column headers with status labels and colors
    - Implement horizontal scrolling for many columns
    - _Requirements: 17.1, 17.2, 17.5_
  
  - [ ] 16.2 Implement Kanban card display
    - Create KanbanCard component for items
    - Display item name, assignee, due date, priority
    - Add card click handler to open item drawer
    - Style cards with minimal, clean design
    - _Requirements: 17.5_
  
  - [ ] 16.3 Add drag-and-drop for Kanban
    - Configure DragDropContext for Kanban view
    - Set up Droppable for each status column
    - Set up Draggable for item cards
    - Handle onDragEnd to update item status
    - Update Redux state when card moves between columns
    - _Requirements: 17.4_
  
  - [ ] 16.4 Handle items with no status
    - Create "No Status" column for items without status value
    - Display items with empty status field
    - Allow dragging items from "No Status" to status columns
    - _Requirements: 17.3_

- [ ] 17. Implement search functionality
  - [ ] 17.1 Create search bar in top bar
    - Build SearchBar component with input field
    - Add search icon and clear button
    - Implement debounced search (300ms delay)
    - Add keyboard shortcut (Ctrl+K / Cmd+K) to focus search
    - _Requirements: 19.1, 24.1, 32.3_
  
  - [ ] 17.2 Build search logic and results display
    - Create searchItems function to search item names and fields
    - Search across all boards user can view
    - Rank exact matches higher than partial matches
    - Limit results to 50 items
    - Display results with board and group context
    - _Requirements: 19.2, 19.3, 19.4, 19.5_
  
  - [ ] 17.3 Add search result navigation
    - Create SearchResults dropdown component
    - Handle result click to navigate to board and open item drawer
    - Highlight search query in results
    - Close dropdown on selection or Escape key
    - _Requirements: Search UX_

- [ ] 18. Add notifications system
  - [ ] 18.1 Create notification icon and badge
    - Add notification bell icon to top bar
    - Display unread count badge
    - Style badge with primary color
    - _Requirements: 24.2_
  
  - [ ] 18.2 Build notifications dropdown
    - Create NotificationsDropdown component
    - Display recent notifications (mentions, assignments, updates)
    - Show notification type, message, and timestamp
    - Mark notifications as read on view
    - _Requirements: 12.3, 24.3_
  
  - [ ] 18.3 Implement notification click navigation
    - Handle notification click to navigate to item
    - Open item drawer automatically
    - Scroll to relevant update if applicable
    - _Requirements: 12.4_

- [ ] 19. Checkpoint - Verify advanced features
  - Ensure all tests pass, ask the user if questions arise.


## Phase 5: Backend API Integration and State Management

- [ ] 20. Set up Node.js/Express backend
  - [ ] 20.1 Initialize Express server
    - Create /server directory structure
    - Initialize Node.js project with TypeScript
    - Install Express, cors, helmet, morgan
    - Set up basic Express app with middleware
    - Configure CORS for frontend origin
    - _Requirements: Backend foundation_
  
  - [ ] 20.2 Configure MongoDB connection
    - Install mongoose for MongoDB ODM
    - Set up MongoDB connection with connection pooling
    - Create database connection utility
    - Add environment variables for database URL
    - _Requirements: Database foundation_
  
  - [ ] 20.3 Create Mongoose schemas and models
    - Define Workspace schema and model
    - Define Board schema with embedded column definitions
    - Define Group schema with board reference
    - Define Item schema with fields as flexible object
    - Define Update schema with item reference
    - Define User schema with authentication fields
    - Add timestamps and indexes to all schemas
    - _Requirements: 2.1, 3.1, 6.1, 7.1, 11.1, User model_

- [ ] 21. Build REST API endpoints
  - [ ] 21.1 Create workspace endpoints
    - POST /api/workspaces - Create workspace
    - GET /api/workspaces - List user's workspaces
    - GET /api/workspaces/:id - Get workspace details
    - PATCH /api/workspaces/:id - Update workspace
    - POST /api/workspaces/:id/members - Add member
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 21.2 Create board endpoints
    - POST /api/boards - Create board
    - GET /api/boards - List boards in workspace
    - GET /api/boards/:id - Get board with groups and items
    - PATCH /api/boards/:id - Update board
    - DELETE /api/boards/:id - Delete board
    - PATCH /api/boards/:id/columns - Update column definitions
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 39.1, 39.2_
  
  - [ ] 21.3 Create group endpoints
    - POST /api/groups - Create group
    - PATCH /api/groups/:id - Update group (name, collapsed)
    - DELETE /api/groups/:id - Delete group
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ] 21.4 Create item endpoints
    - POST /api/items - Create item
    - GET /api/items/:id - Get item details
    - PATCH /api/items/:id - Update item field
    - DELETE /api/items/:id - Delete item
    - POST /api/items/batch-update - Batch update positions
    - _Requirements: 7.1, 7.2, 8.6, 14.3, 15.4_
  
  - [ ] 21.5 Create update endpoints
    - POST /api/updates - Create update/comment
    - GET /api/updates?itemId=:id - Get updates for item
    - PATCH /api/updates/:id - Edit update
    - DELETE /api/updates/:id - Delete update
    - _Requirements: 11.1, 11.2, 11.4_


- [ ] 22. Integrate frontend with backend APIs
  - [ ] 22.1 Set up Axios API client
    - Install axios and axios-retry
    - Create API client with base URL configuration
    - Add request interceptor for authentication tokens
    - Add response interceptor for error handling
    - Configure retry logic for failed requests
    - _Requirements: API communication foundation_
  
  - [ ] 22.2 Create API service modules
    - Create workspaceApi service with all workspace endpoints
    - Create boardApi service with all board endpoints
    - Create itemApi service with all item endpoints
    - Create updateApi service with all update endpoints
    - Add TypeScript types for all API requests/responses
    - _Requirements: API abstraction layer_
  
  - [ ] 22.3 Implement Redux async thunks
    - Create loadBoard thunk to fetch board data
    - Create createItem thunk with optimistic update
    - Create updateItemField thunk with optimistic update
    - Create reorderItem thunk with batch update
    - Create addUpdate thunk for comments
    - Handle loading, success, and error states in reducers
    - _Requirements: 5.1, 5.2, 8.6, 9.1, 14.3, 15.4_
  
  - [ ] 22.4 Replace mock data with API calls
    - Update BoardPage to use loadBoard thunk
    - Update item creation to use createItem thunk
    - Update cell editing to use updateItemField thunk
    - Update drag-and-drop to use reorderItem thunk
    - Update comment posting to use addUpdate thunk
    - _Requirements: Integration of all features_

- [ ]* 22.5 Write property test for data consistency
  - **Property 1: Data Consistency**
  - **Validates: Requirements 7.1, Board-Group-Item hierarchy**

- [ ] 23. Implement error handling and loading states
  - [ ] 23.1 Add loading indicators
    - Display loading spinner during board load
    - Show skeleton screens for table rows
    - Add loading state to cell editors during save
    - Display loading indicator in search results
    - _Requirements: 34.1, 34.3, 34.4, 34.5_
  
  - [ ] 23.2 Implement error boundaries
    - Create ErrorBoundary component for React errors
    - Add fallback UI for component errors
    - Log errors to console (or error tracking service)
    - _Requirements: Error recovery_
  
  - [ ] 23.3 Add error notifications and recovery
    - Display toast notifications for API errors
    - Show retry button for failed board loads
    - Display inline errors for validation failures
    - Implement rollback for failed optimistic updates
    - _Requirements: 35.1, 35.2, 35.4, 35.5_

- [ ] 24. Checkpoint - Verify backend integration
  - Ensure all tests pass, ask the user if questions arise.


## Phase 6: Authentication, RBAC, and Security

- [ ] 25. Implement authentication system
  - [ ] 25.1 Set up JWT authentication on backend
    - Install jsonwebtoken and bcrypt
    - Create authentication middleware
    - Implement token generation (access + refresh tokens)
    - Configure token expiration (24 hours for access token)
    - Store refresh tokens securely
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 25.2 Create authentication endpoints
    - POST /api/auth/register - User registration
    - POST /api/auth/login - User login
    - POST /api/auth/refresh - Refresh access token
    - POST /api/auth/logout - Logout and invalidate tokens
    - _Requirements: 1.1, 1.4_
  
  - [ ] 25.3 Build login and registration pages
    - Create LoginPage with email/password form
    - Create RegisterPage with user details form
    - Add form validation with react-hook-form and yup
    - Display authentication errors
    - Style with minimal, clean design
    - _Requirements: 1.1_
  
  - [ ] 25.4 Implement frontend authentication flow
    - Create authSlice in Redux for user state
    - Store tokens in HTTP-only cookies
    - Add token refresh logic before expiration
    - Implement automatic logout on token expiration
    - Add protected route wrapper component
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 26. Implement RBAC (Role-Based Access Control)
  - [ ] 26.1 Add role-based middleware on backend
    - Create RBAC middleware to check user roles
    - Implement workspace membership verification
    - Add board permission checking (view, edit, admin)
    - Protect all endpoints with appropriate permission checks
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 31.1, 31.2_
  
  - [ ] 26.2 Implement permission checking functions
    - Create checkBoardPermission function
    - Implement permission hierarchy (admin → edit → view)
    - Create filterBoardsByRole function for sidebar
    - Add workspace membership validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 22.1, 22.2, 22.3_
  
  - [ ] 26.3 Add frontend permission-based UI
    - Filter board list in sidebar by user role
    - Hide/disable edit actions for users without edit permission
    - Hide admin actions (delete board, manage columns) for non-admins
    - Display permission error messages when needed
    - _Requirements: 23.5, 35.3_

- [ ]* 26.4 Write property test for RBAC permission consistency
  - **Property 4: RBAC Permission Consistency**
  - **Validates: Requirements 4.5, 4.6, 22.1, 22.2, 22.3**


- [ ] 27. Implement security measures
  - [ ] 27.1 Add input validation and sanitization
    - Validate all user inputs on backend (length, format, type)
    - Sanitize HTML content in updates using DOMPurify
    - Validate file uploads (type, size, content)
    - Reject inputs with script tags or javascript: protocols
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_
  
  - [ ] 27.2 Implement API rate limiting
    - Install express-rate-limit
    - Add rate limiting for authentication (5 per 15 min)
    - Add rate limiting for general API (100 per min per user)
    - Add rate limiting for search (10 per min per user)
    - Add rate limiting for file uploads (5 per min per user)
    - Return 429 status with retry-after header
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_
  
  - [ ] 27.3 Add workspace data isolation
    - Filter all database queries by workspace membership
    - Verify user belongs to workspace before data access
    - Prevent data leakage between workspaces in API responses
    - Add workspace isolation to search functionality
    - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5_
  
  - [ ] 27.4 Implement audit logging
    - Create AuditLog schema and model
    - Log board creation and deletion
    - Log workspace member invitations and removals
    - Log board permission changes
    - Store user ID, action type, timestamp, and affected resource
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5_

- [ ] 28. Add session management features
  - [ ] 28.1 Implement session expiration handling
    - Detect 401 Unauthorized responses in Axios interceptor
    - Save current work to local storage on session expiration
    - Display session expired modal
    - Restore work after re-login
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_
  
  - [ ] 28.2 Add user profile menu
    - Create ProfileMenu dropdown in top bar
    - Display user name, email, avatar, and role
    - Add logout button
    - Add settings/preferences link (placeholder)
    - _Requirements: 24.4_

- [ ] 29. Checkpoint - Verify authentication and security
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Polish, Optimization, and Testing

- [ ] 30. Implement performance optimizations
  - [ ] 30.1 Add list virtualization for large boards
    - Install react-window
    - Implement virtual scrolling for item lists (>50 items)
    - Calculate dynamic row heights
    - Maintain scroll position during updates
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5_
  
  - [ ] 30.2 Optimize Redux selectors with memoization
    - Install reselect if not already installed
    - Create memoized selectors for derived data
    - Use selectors for filtering and sorting
    - Prevent unnecessary re-renders
    - _Requirements: Performance optimization_
  
  - [ ] 30.3 Implement code splitting and lazy loading
    - Lazy load Kanban view component
    - Lazy load Item Drawer component
    - Split routes with React.lazy and Suspense
    - Add loading fallbacks for lazy components
    - _Requirements: Performance optimization_


- [ ] 31. Add responsive design and accessibility
  - [ ] 31.1 Implement responsive breakpoints
    - Add mobile styles for sidebar (auto-collapse <768px)
    - Adjust column widths for tablet (<1024px)
    - Make item drawer full-screen on mobile
    - Ensure touch-friendly tap targets (44x44px minimum)
    - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5_
  
  - [ ] 31.2 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators for keyboard navigation
    - Test tab order for logical flow
    - Verify keyboard shortcuts work correctly
    - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5_
  
  - [ ] 31.3 Implement accessibility features
    - Add ARIA labels to interactive elements
    - Add ARIA live regions for dynamic content updates
    - Ensure proper heading hierarchy
    - Add alt text to images and icons
    - Test with screen reader (basic validation)
    - _Requirements: Accessibility compliance_

- [ ] 32. Add advanced features
  - [ ] 32.1 Implement bulk operations
    - Add checkbox selection for multiple items
    - Create bulk action toolbar
    - Implement bulk status update
    - Implement bulk assignee update
    - Implement bulk priority update
    - Send batch API request for bulk updates
    - _Requirements: 38.1, 38.2, 38.3, 38.4_
  
  - [ ] 32.2 Add custom column management
    - Create column management modal for admins
    - Allow adding custom columns with name, type, width
    - Allow removing columns with confirmation dialog
    - Update board schema and re-render view
    - Validate at least one text column remains
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5_
  
  - [ ] 32.3 Implement file attachments
    - Add file upload to update composer
    - Validate file type and size (10MB max)
    - Upload files to storage (local or cloud)
    - Display attached files in updates
    - Add file download functionality
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ]* 32.4 Write property test for field value type consistency
  - **Property 5: Field Value Type Consistency**
  - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

- [ ] 33. Polish UI and UX
  - [ ] 33.1 Refine visual design
    - Review and adjust color palette for consistency
    - Ensure Figtree font is used throughout
    - Verify small font size is applied correctly
    - Add subtle shadows and borders for depth
    - Polish animations and transitions (300ms standard)
    - _Requirements: Design theme consistency_
  
  - [ ] 33.2 Add empty states
    - Create empty state for boards with no groups
    - Create empty state for groups with no items
    - Create empty state for items with no updates
    - Add helpful messages and call-to-action buttons
    - _Requirements: UX improvement_
  
  - [ ] 33.3 Implement toast notifications
    - Install react-hot-toast
    - Add success toasts for create/update/delete operations
    - Add error toasts for failed operations
    - Style toasts with minimal design
    - _Requirements: User feedback_


- [ ] 34. Testing and quality assurance
  - [ ]* 34.1 Write unit tests for utility functions
    - Test validateFieldValue for all field types
    - Test normalizeBoardData function
    - Test checkBoardPermission function
    - Test filterBoardsByRole function
    - Test calculateAffectedItems for reordering
    - Aim for 90%+ coverage on utility functions
    - _Requirements: Code quality_
  
  - [ ]* 34.2 Write unit tests for Redux reducers
    - Test all action creators and reducers
    - Test optimistic update and rollback logic
    - Test state normalization
    - Aim for 85%+ coverage on Redux slices
    - _Requirements: State management reliability_
  
  - [ ]* 34.3 Write integration tests for key flows
    - Test board loading flow (API → Redux → UI)
    - Test inline editing with optimistic updates
    - Test item reordering across groups
    - Test notification delivery for mentions
    - Test activity log creation
    - Use MSW for API mocking
    - _Requirements: Feature reliability_
  
  - [ ]* 34.4 Write component tests
    - Test InlineCellEditor with different field types
    - Test ItemDrawer tab switching
    - Test TableView rendering and interactions
    - Test KanbanView drag-and-drop
    - Use React Testing Library
    - Aim for 80%+ coverage on components
    - _Requirements: Component reliability_

- [ ] 35. Final checkpoint and deployment preparation
  - [ ] 35.1 Review and fix any remaining issues
    - Run full test suite and fix failures
    - Check for console errors and warnings
    - Verify all features work end-to-end
    - Test on different browsers (Chrome, Firefox, Safari)
    - Test on different screen sizes
    - _Requirements: Quality assurance_
  
  - [ ] 35.2 Prepare for deployment
    - Set up environment variables for production
    - Configure build scripts for frontend and backend
    - Add production-ready error handling
    - Set up logging for production
    - Create deployment documentation
    - _Requirements: Deployment readiness_
  
  - [ ] 35.3 Final verification
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties
- Unit and integration tests validate specific examples and edge cases
- The phased approach allows for early user feedback and iterative refinement
- Frontend-first development enables rapid prototyping and visual validation
- MERN stack provides full JavaScript ecosystem consistency
- Design theme (Figtree font, small size, minimal aesthetic) should be maintained throughout

## Implementation Guidelines

1. Start each phase by reviewing the requirements and design documents
2. Build components incrementally, testing as you go
3. Use mock data in early phases, replace with API calls in Phase 5
4. Maintain consistent code style and naming conventions
5. Document complex logic and algorithms
6. Commit frequently with descriptive messages
7. Ask for user feedback at checkpoints before proceeding
8. Prioritize core functionality over optional features
9. Keep the design minimal, clean, and beautiful throughout
10. Ensure all code is production-ready with proper error handling
