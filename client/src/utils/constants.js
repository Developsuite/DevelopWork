// Constants for DevelopWork

export const BOARD_TYPES = {
    project: { label: 'Project Management', icon: 'LayoutDashboard', color: '#579BFC' },
    hr: { label: 'Human Resources', icon: 'Users', color: '#A25DDC' },
    finance: { label: 'Finance', icon: 'DollarSign', color: '#00C875' },
    crm: { label: 'CRM', icon: 'Handshake', color: '#FDAB3D' },
    support: { label: 'Support', icon: 'Headphones', color: '#E2445C' },
};

// Department modules for the Module Hub
export const DEPARTMENT_MODULES = [
    {
        key: 'projects',
        label: 'Project Management',
        description: 'Plan, track, and deliver projects on time with Kanban boards, timelines, and sprint planning.',
        icon: 'FolderKanban',
        color: '#579BFC',
        gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)',
        route: '/projects',
        memberCount: 24,
    },
    {
        key: 'hr',
        label: 'Human Resources',
        description: 'Manage your workforce, recruitment pipeline, onboarding, and employee records.',
        icon: 'Users',
        color: '#A25DDC',
        gradient: 'linear-gradient(135deg, #A25DDC, #8B5CF6)',
        route: '/hr',
        memberCount: 8,
    },
    {
        key: 'finance',
        label: 'Finance',
        description: 'Track revenue, expenses, budgets, invoices, and financial reports in one place.',
        icon: 'DollarSign',
        color: '#00C875',
        gradient: 'linear-gradient(135deg, #00C875, #10B981)',
        route: '/finance',
        memberCount: 5,
    },
    {
        key: 'leads',
        label: 'Leads Management',
        description: 'Capture, nurture, and convert leads with CRM pipeline tracking and analytics.',
        icon: 'Handshake',
        color: '#FDAB3D',
        gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)',
        route: '/leads',
        memberCount: 12,
    },
    {
        key: 'support',
        label: 'Customer Support',
        description: 'Handle support tickets, SLA tracking, and customer satisfaction in real-time.',
        icon: 'Headphones',
        color: '#E2445C',
        gradient: 'linear-gradient(135deg, #E2445C, #EF4444)',
        route: '/support',
        memberCount: 10,
    },
    {
        key: 'docs',
        label: 'Documentation',
        description: 'Create, collaborate, and share documents, wikis, and knowledge base articles.',
        icon: 'FileText',
        color: '#0EA5E9',
        gradient: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
        route: '/docs',
        memberCount: 18,
    },
];

// App modules for the icon rail
export const APP_MODULES = [
    { key: 'home', label: 'Home', icon: 'Home', color: '#579BFC', route: '/modules' },
    { key: 'projects', label: 'Projects', icon: 'FolderKanban', color: '#579BFC', route: '/projects' },
    { key: 'hr', label: 'HR', icon: 'Users', color: '#A25DDC', route: '/hr' },
    { key: 'finance', label: 'Finance', icon: 'DollarSign', color: '#00C875', route: '/finance' },
    { key: 'leads', label: 'Leads', icon: 'Handshake', color: '#FDAB3D', route: '/leads' },
    { key: 'support', label: 'Support', icon: 'Headphones', color: '#E2445C', route: '/support' },
    { key: 'docs', label: 'Docs', icon: 'FileText', color: '#0EA5E9', route: '/docs' },
];

export const PRIORITY_OPTIONS = [
    { value: 'critical', label: 'Critical', color: '#E2445C' },
    { value: 'high', label: 'High', color: '#FDAB3D' },
    { value: 'medium', label: 'Medium', color: '#579BFC' },
    { value: 'low', label: 'Low', color: '#7C8DB5' },
];

export const VIEW_TYPES = {
    table: { label: 'Table', icon: 'Table2' },
    kanban: { label: 'Kanban', icon: 'Columns3' },
    timeline: { label: 'Timeline', icon: 'GanttChart' },
    calendar: { label: 'Calendar', icon: 'Calendar' },
};

export const ROLES = {
    admin: { label: 'Admin', color: '#E2445C' },
    manager: { label: 'Manager', color: '#FDAB3D' },
    employee: { label: 'Employee', color: '#579BFC' },
};

export const COLUMN_TYPES = ['text', 'status', 'person', 'date', 'priority', 'tags'];
