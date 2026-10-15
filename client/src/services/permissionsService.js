import { supabase } from '../lib/supabase';

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

    // Extract raw permission keys from any string or data representation
    parsePermissionsData(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    console.warn('[RBAC] Error parsing permissions JSON string:', e);
                }
            }
            if (trimmed.includes(',')) {
                return trimmed.split(',').map(s => s.trim()).filter(Boolean);
            }
            // Single module key (e.g. 'leads')
            const mod = SYSTEM_MODULES.find(m => m.key === trimmed);
            if (mod) {
                return [mod.key, `${mod.key}.*`, ...mod.features.map(f => f.key)];
            }
            return [trimmed];
        }
        return [];
    },

    // Get permissions list for a user (accepts user object or userId string)
    getUserPermissions(userOrId) {
        if (!userOrId) return [];
        const userId = typeof userOrId === 'object' ? (userOrId.id || userOrId._id) : userOrId;
        const userObj = typeof userOrId === 'object' ? userOrId : null;

        let permissions = [];

        // 1. Direct permissions property on user object
        if (userObj?.permissions) {
            const parsed = this.parsePermissionsData(userObj.permissions);
            if (parsed.length > 0) permissions.push(...parsed);
        }

        // 2. assignedModule / assigned_module on user object
        const assignedMod = userObj?.assignedModule || userObj?.assigned_module;
        if (assignedMod) {
            const parsed = this.parsePermissionsData(assignedMod);
            if (parsed.length > 0) permissions.push(...parsed);
        }

        // 3. LocalStorage by userId
        if (userId) {
            try {
                const raw = localStorage.getItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${userId}`);
                if (raw) {
                    const parsed = this.parsePermissionsData(JSON.parse(raw));
                    if (parsed.length > 0) permissions.push(...parsed);
                }
            } catch (e) {
                console.error('[RBAC] Error reading permissions for user:', userId, e);
            }
        }

        // 4. LocalStorage by user email if available
        if (userObj?.email) {
            try {
                const raw = localStorage.getItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${userObj.email}`);
                if (raw) {
                    const parsed = this.parsePermissionsData(JSON.parse(raw));
                    if (parsed.length > 0) permissions.push(...parsed);
                }
            } catch (e) {}
        }

        return Array.from(new Set(permissions));
    },

    // Save permissions locally
    saveUserPermissionsLocally(userId, permissions = [], email = null) {
        if (!userId) return;
        try {
            localStorage.setItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(permissions));
            if (email) {
                localStorage.setItem(`${PERMISSIONS_STORAGE_KEY_PREFIX}${email}`, JSON.stringify(permissions));
            }
            window.dispatchEvent(new CustomEvent('dwPermissionsUpdated', { detail: { userId, permissions } }));
        } catch (e) {
            console.error('[RBAC] Error saving permissions locally:', e);
        }
    },

    // Save permissions for a user (persists to Supabase profiles & caches locally)
    async saveUserPermissions(userId, permissions = [], targetUser = null, newRole = null) {
        if (!userId) return;

        // 1. Save locally immediately for fast optimistic UI response
        const email = targetUser?.email || null;
        this.saveUserPermissionsLocally(userId, permissions, email);

        // 2. Persist to Supabase profiles table
        try {
            const serializedPerms = permissions.length > 0 ? JSON.stringify(permissions) : null;
            
            const updatePayload = {
                assigned_module: serializedPerms,
                permissions: permissions,
                updated_at: new Date().toISOString()
            };
            if (newRole) {
                updatePayload.role = newRole;
            }

            const fallbackPayload = {
                assigned_module: serializedPerms,
                updated_at: new Date().toISOString()
            };
            if (newRole) {
                fallbackPayload.role = newRole;
            }
            
            // Try updating assigned_module and permissions (if column exists)
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update(updatePayload)
                    .eq('id', userId);
                
                if (error) {
                    // Fallback to assigned_module only
                    const { error: fallbackError } = await supabase
                        .from('profiles')
                        .update(fallbackPayload)
                        .eq('id', userId);
                    if (fallbackError) {
                        console.error('[RBAC] Failed to save permissions to Supabase profiles (fallback):', fallbackError);
                    }
                }
            } catch (innerErr) {
                console.warn('[RBAC] Standard profile update threw, trying assigned_module fallback:', innerErr);
                await supabase
                    .from('profiles')
                    .update(fallbackPayload)
                    .eq('id', userId);
            }
        } catch (err) {
            console.error('[RBAC] Error saving permissions to database:', err);
        }
    },

    // Fetch latest user permissions directly from Supabase
    async fetchUserPermissions(userId) {
        if (!userId) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, assigned_module, permissions')
                .eq('id', userId)
                .single();
            if (error || !data) return this.getUserPermissions(userId);

            let perms = [];
            if (data.permissions && Array.isArray(data.permissions)) {
                perms = data.permissions;
            } else if (data.assigned_module) {
                perms = this.parsePermissionsData(data.assigned_module);
            }

            if (perms.length > 0) {
                this.saveUserPermissionsLocally(userId, perms, data.email);
            }
            return perms;
        } catch (err) {
            console.warn('[RBAC] Error fetching user permissions from Supabase:', err);
            return this.getUserPermissions(userId);
        }
    },

    // Check if user has permission for a specific module or feature
    hasPermission(user, permissionKey) {
        if (!user) return false;
        // Admins have unrestricted access to all modules and features
        if (user.role === 'admin') return true;

        const userPerms = this.getUserPermissions(user);

        // Check wildcard for module (e.g., 'finance.*' grants 'finance.invoices')
        const [modKey] = permissionKey.split('.');
        if (userPerms.includes(`${modKey}.*`) || userPerms.includes(modKey)) {
            return true;
        }

        // Check exact key match
        if (userPerms.includes(permissionKey)) {
            return true;
        }

        // Module matching on assignedModule
        const assignedMod = user.assignedModule || user.assigned_module;
        if (assignedMod && (assignedMod === modKey || (typeof assignedMod === 'string' && assignedMod.includes(modKey)))) {
            return true;
        }

        return false;
    },

    // Get list of modules that user has at least one permission in
    getAccessibleModules(user) {
        if (!user) return [];
        if (user.role === 'admin') return SYSTEM_MODULES;

        const userPerms = this.getUserPermissions(user);
        const assignedMod = user.assignedModule || user.assigned_module;

        return SYSTEM_MODULES.filter(mod => {
            // Check direct assigned module
            if (assignedMod) {
                if (assignedMod === mod.key) return true;
                if (typeof assignedMod === 'string' && assignedMod.includes(mod.key)) return true;
            }
            // Check permissions array
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

        const userPerms = this.getUserPermissions(user);
        if (userPerms.includes(moduleKey) || userPerms.includes(`${moduleKey}.*`)) {
            return mod.features;
        }

        // Check if assigned module directly matches moduleKey
        const assignedMod = user.assignedModule || user.assigned_module;
        if (assignedMod === moduleKey && userPerms.length === 0) {
            return mod.features;
        }

        const filtered = mod.features.filter(f => userPerms.includes(f.key));
        return filtered.length > 0 ? filtered : mod.features;
    }
};
