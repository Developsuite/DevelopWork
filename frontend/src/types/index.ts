// User and Authentication Types
export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  workspaces: string[];
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultView: ViewType;
  notifications: NotificationSettings;
  language: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  mentions: boolean;
  assignments: boolean;
  updates: boolean;
}

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

// Board Types
export type BoardType = 'project' | 'crm' | 'support' | 'hr' | 'finance';
export type ViewType = 'table' | 'kanban' | 'timeline' | 'calendar';

export interface Board {
  id: string;
  name: string;
  description?: string;
  type: BoardType;
  workspaceId: string;
  icon?: string;
  color?: string;
  columns: ColumnDefinition[];
  defaultView: ViewType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: BoardPermissions;
}

export interface BoardPermissions {
  viewerRoles: UserRole[];
  editorRoles: UserRole[];
  adminRoles: UserRole[];
}

// Column Types
export type ColumnType = 'text' | 'status' | 'person' | 'date' | 'priority' | 'tags';

export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  editable: boolean;
  required: boolean;
  options?: ColumnOption[];
  defaultValue?: any;
}

export interface ColumnOption {
  id: string;
  label: string;
  color?: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  boardId: string;
  color?: string;
  position: number;
  collapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Item Types
export interface Item {
  id: string;
  name: string;
  groupId: string;
  boardId: string;
  position: number;
  fields: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignees: string[];
}

export interface ItemFields {
  status?: string;
  assignee?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  [key: string]: any;
}

// Update Types
export interface Update {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  type: 'comment' | 'system';
  createdAt: Date;
  updatedAt: Date;
  mentions: string[];
  attachments: Attachment[];
  reactions: Reaction[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'update' | 'system';
  message: string;
  timestamp: Date;
  read: boolean;
  itemId?: string;
  userId: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  itemId: string;
  userId: string;
  type: 'field_update' | 'item_created' | 'comment' | 'status_change';
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

// UI State Types
export interface UIState {
  sidebarCollapsed: boolean;
  aiPanelVisible: boolean;
  activeBoard: string | null;
  activeBoardView: ViewType;
  itemDrawerOpen: boolean;
  selectedItemId: string | null;
  selectedItems: string[];
  loading: boolean;
  error: string | null;
}

// Search Types
export interface SearchResult {
  itemId: string;
  itemName: string;
  boardId: string;
  boardName: string;
  groupId: string;
  groupName: string;
  matchType: 'exact' | 'partial';
}
