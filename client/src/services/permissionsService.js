// ==========================================
// GRANULAR ROLE-BASED ACCESS CONTROL (RBAC) SERVICE
// Manages module-level and feature-level permissions
// ==========================================

export const SYSTEM_MODULES = [
    {
        key: 'projects',
        label: 'Project Management',
        description: 'Plan, track, and deliver projects with Kanban and sprint planning.',
        color: '#579BFC',
        features: [
            { key: 'projects.overview', label: 'Overview & Analytics', path: '/projects?tab=overview' },
            { key: 'projects.all', label: 'All Projects Directory', path: '/projects?tab=projects' },
            { key: 'projects.tasks', label: 'Tasks Directory & Delegation', path: '/projects?tab=tasks' },
            { key: 'projects.sprint', label: 'Sprint & Kanban Board', path: '/board/board-1' },
        ]
    },
    {
        key: 'tasks',
        label: 'Task Management',
        description: 'Organization-wide task command center. Assign, monitor, and delegate deliverables to any employee or manager.',
        color: '#0055FE',
        features: [
            { key: 'tasks.all', label: 'All Tasks Directory', path: '/tasks?tab=all' },
            { key: 'tasks.delegated', label: 'Delegation Center', path: '/tasks?tab=delegated' },
            { key: 'tasks.kanban', label: 'Tasks Kanban Board', path: '/tasks?tab=kanban' },
            { key: 'tasks.analytics', label: 'Workload & Analytics', path: '/tasks?tab=analytics' },
        ]
    },
    {
        key: 'hr',
        label: 'Human Resources',
        description: 'Manage workforce, organization chart, recruitment, and payroll.',
        color: '#A25DDC',
        features: [
            { key: 'hr.directory', label: 'Employee Directory', path: '/hr?tab=directory' },
            { key: 'hr.org', label: 'Organization Hierarchy', path: '/hr?tab=org' },
            { key: 'hr.recruitment', label: 'Recruitment & Hiring Pipeline', path: '/hr?tab=recruitment' },
            { key: 'hr.payroll', label: 'Payroll & Compensation', path: '/hr?tab=payroll' },
            { key: 'hr.performance', label: 'Performance Reviews', path: '/hr?tab=performance' },
        ]
    },
    {
        key: 'finance',
        label: 'Finance & Accounting',
        description: 'Track cashflow, ledger transactions, invoices, and expenses.',
        color: '#00C875',
        features: [
            { key: 'finance.dashboard', label: 'Financial Dashboard', path: '/finance?tab=dashboard' },
            { key: 'finance.transactions', label: 'Transactions Ledger', path: '/finance?tab=transactions' },
            { key: 'finance.invoices', label: 'Invoices Management', path: '/finance?tab=invoices' },
            { key: 'finance.expenses', label: 'Expense Requests & Approvals', path: '/finance?tab=expenses' },
        ]
    },
    {
        key: 'leads',
        label: 'CRM & Leads Management',
        description: 'Capture, nurture, and convert sales pipeline leads.',
        color: '#FDAB3D',
        features: [
            { key: 'leads.pipeline', label: 'Leads Pipeline', path: '/leads?tab=pipeline' },
            { key: 'leads.all', label: 'All Leads Directory', path: '/leads?tab=all' },
            { key: 'leads.contacts', label: 'Contacts & Communications', path: '/leads?tab=contacts' },
        ]
    },
    {
        key: 'clients',
        label: 'Client Management',
        description: 'Manage client profiles, active projects, and billing.',
        color: '#E2445C',
        features: [
            { key: 'clients.all', label: 'Client List', path: '/clients?tab=all' },
            { key: 'clients.projects', label: 'Active Projects', path: '/clients?tab=projects' },
            { key: 'clients.billing', label: 'Billing Status', path: '/clients?tab=billing' },
        ]
    },
    {
        key: 'docs',
        label: 'Documentation & Knowledge',
        description: 'Create and organize workspace documentation and templates.',
        color: '#00D2D2',
        features: [
            { key: 'docs.all', label: 'All Documents', path: '/docs' },
            { key: 'docs.templates', label: 'Templates Library', path: '/docs?tab=templates' },
        ]
    }
];

const PERMISSIONS_STORAGE_KEY_PREFIX = 'dw-user-permissions-';

export const permissionsService = {
    // Get all system modules and their sub-features
    getSystemModules() {
        return SYSTEM_MODULES;
    },

    // Get permissions list for a user
    getUserPermissions(userId) {
        if (!userId) return [];
        try {
            const raw = localStorage.getItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${userId}`);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('[RBAC] Error reading permissions for user:', userId, e);
        }
        return [];
    },

    // Save permissions for a user
    saveUserPermissions(userId, permissions = []) {
        if (!userId) return;
        try {
            localStorage.setItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(permissions));
            // Trigger storage event for live reactive update across components
            window.dispatchEvent(new CustomEvent('dwPermissionsUpdated', { detail: { userId, permissions } }));
        } catch (e) {
            console.error('[RBAC] Error saving permissions for user:', userId, e);
        }
    },

    // Check if user has permission for a specific module or feature
    hasPermission(user, permissionKey) {
        if (!user) return false;
        // Admins have unrestricted access to all modules and features
        if (user.role === 'admin') return true;

        const userPerms = this.getUserPermissions(user.id);

        // Check wildcard for module (e.g., 'finance.*' grants 'finance.invoices')
        const [modKey] = permissionKey.split('.');
        if (userPerms.includes(`${modKey}.*`) || userPerms.includes(modKey)) {
            return true;
        }

        // Check exact key match
        if (userPerms.includes(permissionKey)) {
            return true;
        }

        // Backward compatibility: check assignedModule on legacy manager
        if (user.role === 'manager' && user.assignedModule === modKey) {
            return true;
        }

        return false;
    },

    // Get list of modules that user has at least one permission in
    getAccessibleModules(user) {
        if (!user) return [];
        if (user.role === 'admin') return SYSTEM_MODULES;

        const userPerms = this.getUserPermissions(user.id);
        const legacyMod = user.role === 'manager' ? user.assignedModule : null;

        return SYSTEM_MODULES.filter(mod => {
            if (legacyMod && legacyMod === mod.key) return true;
            if (userPerms.includes(mod.key) || userPerms.includes(`${mod.key}.*`)) return true;
            return mod.features.some(f => userPerms.includes(f.key));
        });
    },

    // Get list of sub-features accessible to the user for a module
    getAccessibleFeatures(user, moduleKey) {
        if (!user) return [];
        const mod = SYSTEM_MODULES.find(m => m.key === moduleKey);
        if (!mod) return [];

        if (user.role === 'admin') return mod.features;

        const userPerms = this.getUserPermissions(user.id);
        if (userPerms.includes(moduleKey) || userPerms.includes(`${moduleKey}.*`)) {
            return mod.features;
        }

        // Legacy manager fallback
        if (user.role === 'manager' && user.assignedModule === moduleKey && userPerms.length === 0) {
            return mod.features;
        }

        return mod.features.filter(f => userPerms.includes(f.key));
    }
};
