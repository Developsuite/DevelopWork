// Mock data for DevelopWork platform

export const mockUser = {
    _id: 'user-1',
    name: 'Abbas Khan',
    email: 'abbas@developwork.com',
    avatar: null,
    role: 'admin',
};

export const mockMembers = [
    { _id: 'user-1', name: 'Abbas Khan', email: 'abbas@developwork.com', role: 'admin', avatar: null },
    { _id: 'user-2', name: 'Sarah Ahmed', email: 'sarah@developwork.com', role: 'manager', avatar: null },
    { _id: 'user-3', name: 'Ali Hassan', email: 'ali@developwork.com', role: 'employee', avatar: null },
    { _id: 'user-4', name: 'Fatima Noor', email: 'fatima@developwork.com', role: 'employee', avatar: null },
    { _id: 'user-5', name: 'Omar Raza', email: 'omar@developwork.com', role: 'manager', avatar: null },
];

export const mockWorkspaces = [
    { _id: 'ws-1', name: 'DevelopWork Inc.', description: 'Main company workspace', memberCount: 5 },
    { _id: 'ws-2', name: 'Client Projects', description: 'External client work', memberCount: 3 },
];

// Teams (like ClickUp Spaces)
export const mockTeams = [
    {
        _id: 'team-1',
        name: 'Engineering',
        color: '#579BFC',
        icon: 'code',
        memberIds: ['user-1', 'user-3', 'user-4'],
    },
    {
        _id: 'team-2',
        name: 'Design',
        color: '#A25DDC',
        icon: 'palette',
        memberIds: ['user-2', 'user-4'],
    },
    {
        _id: 'team-3',
        name: 'Operations',
        color: '#00C875',
        icon: 'settings',
        memberIds: ['user-1', 'user-5'],
    },
];

// Projects nested under teams
export const mockProjects = [
    { _id: 'proj-1', teamId: 'team-1', name: 'Dashboard Redesign', icon: '🎨', color: '#579BFC' },
    { _id: 'proj-2', teamId: 'team-1', name: 'Mobile App', icon: '📱', color: '#FDAB3D' },
    { _id: 'proj-3', teamId: 'team-2', name: 'Brand Identity', icon: '✨', color: '#A25DDC' },
    { _id: 'proj-4', teamId: 'team-3', name: 'Q1 Planning', icon: '📋', color: '#00C875' },
];

export const statusOptions = {
    project: [
        { label: 'Not Started', color: '#6C7A96' },
        { label: 'In Progress', color: '#FDAB3D' },
        { label: 'In Review', color: '#A25DDC' },
        { label: 'Done', color: '#00C875' },
        { label: 'Stuck', color: '#E2445C' },
    ],
    hr: [
        { label: 'Open', color: '#579BFC' },
        { label: 'Screening', color: '#FDAB3D' },
        { label: 'Interview', color: '#A25DDC' },
        { label: 'Offer', color: '#00C875' },
        { label: 'Rejected', color: '#E2445C' },
    ],
    finance: [
        { label: 'Pending', color: '#E09F3E' },
        { label: 'Processing', color: '#FDAB3D' },
        { label: 'Approved', color: '#00C875' },
        { label: 'Rejected', color: '#E2445C' },
        { label: 'Paid', color: '#579BFC' },
    ],
    crm: [
        { label: 'New Lead', color: '#579BFC' },
        { label: 'Contacted', color: '#FDAB3D' },
        { label: 'Qualified', color: '#A25DDC' },
        { label: 'Proposal', color: '#00C875' },
        { label: 'Closed Won', color: '#00C875' },
        { label: 'Closed Lost', color: '#E2445C' },
    ],
    support: [
        { label: 'New', color: '#579BFC' },
        { label: 'In Progress', color: '#FDAB3D' },
        { label: 'Waiting', color: '#A25DDC' },
        { label: 'Resolved', color: '#00C875' },
        { label: 'Closed', color: '#457B9D' },
    ],
};

export const mockBoards = [
    {
        _id: 'board-1',
        name: 'Sprint 24 - Dashboard Redesign',
        type: 'project',
        projectId: 'proj-1',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Task', type: 'text', width: 280 },
            { _id: 'col-2', name: 'Status', type: 'status', width: 140, options: statusOptions.project },
            { _id: 'col-3', name: 'Assignee', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Due Date', type: 'date', width: 130 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
            { _id: 'col-6', name: 'Tags', type: 'tags', width: 160 },
        ],
    },
    {
        _id: 'board-2',
        name: 'Q1 Marketing Campaign',
        type: 'project',
        projectId: 'proj-1',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Task', type: 'text', width: 280 },
            { _id: 'col-2', name: 'Status', type: 'status', width: 140, options: statusOptions.project },
            { _id: 'col-3', name: 'Assignee', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Due Date', type: 'date', width: 130 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
        ],
    },
    {
        _id: 'board-3',
        name: 'Recruitment Pipeline',
        type: 'hr',
        projectId: 'proj-4',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Candidate', type: 'text', width: 240 },
            { _id: 'col-2', name: 'Status', type: 'status', width: 140, options: statusOptions.hr },
            { _id: 'col-3', name: 'Recruiter', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Interview Date', type: 'date', width: 140 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
        ],
    },
    {
        _id: 'board-4',
        name: 'Budget Tracker 2026',
        type: 'finance',
        projectId: 'proj-4',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Expense', type: 'text', width: 260 },
            { _id: 'col-2', name: 'Status', type: 'status', width: 140, options: statusOptions.finance },
            { _id: 'col-3', name: 'Approver', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Due Date', type: 'date', width: 130 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
        ],
    },
    {
        _id: 'board-5',
        name: 'Sales Pipeline',
        type: 'crm',
        projectId: 'proj-3',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Deal', type: 'text', width: 260 },
            { _id: 'col-2', name: 'Stage', type: 'status', width: 140, options: statusOptions.crm },
            { _id: 'col-3', name: 'Sales Rep', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Close Date', type: 'date', width: 130 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
        ],
    },
    {
        _id: 'board-6',
        name: 'App Development',
        type: 'project',
        projectId: 'proj-2',
        workspaceId: 'ws-1',
        columns: [
            { _id: 'col-1', name: 'Task', type: 'text', width: 280 },
            { _id: 'col-2', name: 'Status', type: 'status', width: 140, options: statusOptions.project },
            { _id: 'col-3', name: 'Assignee', type: 'person', width: 140 },
            { _id: 'col-4', name: 'Due Date', type: 'date', width: 130 },
            { _id: 'col-5', name: 'Priority', type: 'priority', width: 120 },
        ],
    },
];

export const mockGroups = [
    { _id: 'grp-1', boardId: 'board-1', name: 'To Do', color: '#579BFC', position: 0, collapsed: false },
    { _id: 'grp-2', boardId: 'board-1', name: 'In Progress', color: '#FDAB3D', position: 1, collapsed: false },
    { _id: 'grp-3', boardId: 'board-1', name: 'Done', color: '#00C875', position: 2, collapsed: false },
];

export const mockItems = [
    {
        _id: 'item-1', groupId: 'grp-1', boardId: 'board-1', position: 0,
        fields: {
            'col-1': 'Design new login page',
            'col-2': 'Not Started',
            'col-3': 'user-2',
            'col-4': '2026-03-10',
            'col-5': 'high',
            'col-6': ['UI', 'Design'],
        },
    },
    {
        _id: 'item-2', groupId: 'grp-1', boardId: 'board-1', position: 1,
        fields: {
            'col-1': 'API integration for user module',
            'col-2': 'Not Started',
            'col-3': 'user-3',
            'col-4': '2026-03-12',
            'col-5': 'medium',
            'col-6': ['Backend'],
        },
    },
    {
        _id: 'item-3', groupId: 'grp-1', boardId: 'board-1', position: 2,
        fields: {
            'col-1': 'Write unit tests for auth service',
            'col-2': 'Not Started',
            'col-3': 'user-4',
            'col-4': '2026-03-15',
            'col-5': 'low',
            'col-6': ['Testing'],
        },
    },
    {
        _id: 'item-4', groupId: 'grp-2', boardId: 'board-1', position: 0,
        fields: {
            'col-1': 'Build dashboard widgets',
            'col-2': 'In Progress',
            'col-3': 'user-1',
            'col-4': '2026-03-08',
            'col-5': 'high',
            'col-6': ['Frontend', 'UI'],
        },
    },
    {
        _id: 'item-5', groupId: 'grp-2', boardId: 'board-1', position: 1,
        fields: {
            'col-1': 'Setup CI/CD pipeline',
            'col-2': 'In Progress',
            'col-3': 'user-5',
            'col-4': '2026-03-06',
            'col-5': 'critical',
            'col-6': ['DevOps'],
        },
    },
    {
        _id: 'item-6', groupId: 'grp-3', boardId: 'board-1', position: 0,
        fields: {
            'col-1': 'Project kickoff meeting',
            'col-2': 'Done',
            'col-3': 'user-1',
            'col-4': '2026-02-28',
            'col-5': 'medium',
            'col-6': ['Meeting'],
        },
    },
    {
        _id: 'item-7', groupId: 'grp-3', boardId: 'board-1', position: 1,
        fields: {
            'col-1': 'Define database schema',
            'col-2': 'Done',
            'col-3': 'user-3',
            'col-4': '2026-03-01',
            'col-5': 'high',
            'col-6': ['Backend', 'Database'],
        },
    },
];

export const mockNotifications = [
    { _id: 'notif-1', type: 'mention', message: 'Sarah mentioned you in "Build dashboard widgets"', read: false, createdAt: '2026-03-03T08:30:00Z' },
    { _id: 'notif-2', type: 'assignment', message: 'You were assigned to "Setup CI/CD pipeline"', read: false, createdAt: '2026-03-02T14:15:00Z' },
    { _id: 'notif-3', type: 'update', message: 'Ali completed "Define database schema"', read: true, createdAt: '2026-03-01T10:00:00Z' },
];

export const mockUpdates = [
    {
        _id: 'update-1', itemId: 'item-4', userId: 'user-2', type: 'comment',
        content: 'Started working on the dashboard widgets. Will have the first draft ready by Friday.',
        createdAt: '2026-03-03T08:30:00Z',
    },
    {
        _id: 'update-2', itemId: 'item-4', userId: 'user-1', type: 'comment',
        content: 'Great! Make sure to follow the new design system we agreed on. @Abbas let me know if you need the Figma link.',
        createdAt: '2026-03-03T09:15:00Z',
    },
    {
        _id: 'update-3', itemId: 'item-5', userId: 'user-5', type: 'system',
        content: 'Status changed from "Not Started" to "In Progress"',
        createdAt: '2026-03-02T14:00:00Z',
    },
];
