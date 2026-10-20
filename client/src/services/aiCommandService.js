import { projectService } from './projectService';
import { managerService } from './managerService';
import { clientsService } from './clientsService';
import { financeService } from './financeService';
import { hrService } from './hrService';
import { leadsService } from './leadsService';
import { docsService } from './docsService';
import { meetingsService } from './meetingsService';
import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-4o-mini';
const MAX_TOOL_ITERATIONS = 6;

const USE_EDGE_FUNCTION = !!SUPABASE_URL && !import.meta.env.VITE_AI_DIRECT;

async function callAI(messages, tools) {
    if (USE_EDGE_FUNCTION) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No active session. Please log in again.');

        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, tools }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `AI request failed (${res.status})`);
        }
        return res.json();
    }

    if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API Key is not configured.');

    const body = { model: MODEL, messages, max_tokens: 2000 };
    if (tools?.length) { body.tools = tools; body.tool_choice = 'auto'; }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `AI request failed (${res.status})`);
    }
    return res.json();
}

async function callSendEmail(to, subject, type, data) {
    if (!SUPABASE_URL) return { error: 'Email not configured (no Edge Function)' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: 'No active session' };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, type, data }),
    });
    return res.json();
}

async function callTelegramSend(userId, message) {
    if (!SUPABASE_URL) return { error: 'Telegram not configured (no Edge Function)' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: 'No active session' };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-webhook?action=send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, message }),
    });
    return res.json();
}

// ── Risk levels ──
const RISK = {
    READ: 'read',
    LOW: 'low',
    EXTERNAL: 'external',
    SENSITIVE: 'sensitive',
    DESTRUCTIVE: 'destructive',
};

// ── Tool definitions ──

const READ_TOOLS = [
    {
        name: 'search_employees',
        description: 'Search workspace employees and managers by name, email, or role. Returns id, name, email, role, and assigned module.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search term (name or email). Leave empty to list all.' },
            },
        },
        risk: RISK.READ,
    },
    {
        name: 'get_projects',
        description: 'List all projects with id, name, status, budget, and dates.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'search_tasks',
        description: 'Search tasks across all projects. Can filter by status, assignee name, priority, or project.',
        parameters: {
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Filter by status: Not Started, In Progress, In Review, Done' },
                assignee: { type: 'string', description: 'Filter by assignee name (partial match)' },
                priority: { type: 'string', description: 'Filter: Critical, High, Medium, Low' },
            },
        },
        risk: RISK.READ,
    },
    {
        name: 'get_overdue_tasks',
        description: 'Get tasks past their deadline that are not marked Done.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_leads',
        description: 'List all sales leads with stage, company, value, and contact info.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_clients',
        description: 'List all clients with company, contact, projects, and total revenue.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_contacts',
        description: 'List all CRM contacts with name, email, phone, company.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_finance_transactions',
        description: 'List all financial transactions (income & expenses) with amounts, dates, descriptions.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_invoices',
        description: 'List all invoices with client, amount, status, due date.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_hr_employees',
        description: 'Get HR employee data including departments, salaries, employment dates.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_leave_requests',
        description: 'List all employee leave requests with status, dates, type.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_documents',
        description: 'List all documents and files in the workspace.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_folders',
        description: 'List all document folders in the docs module.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
    {
        name: 'get_meetings',
        description: 'List all scheduled meetings with dates, attendees, platform, and status.',
        parameters: { type: 'object', properties: {} },
        risk: RISK.READ,
    },
];

const WRITE_TOOLS = [
    {
        name: 'create_task',
        description: 'Create a new task and optionally assign it to an employee. Always search employees first to get the correct assignee ID.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Task title (required)' },
                description: { type: 'string', description: 'Task description' },
                status: { type: 'string', enum: ['Not Started', 'In Progress', 'In Review', 'Done'], description: 'Initial status (default: Not Started)' },
                priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'], description: 'Priority level (default: Medium)' },
                assignee_id: { type: 'string', description: 'User UUID to assign to. Use search_employees first.' },
                assignee_name: { type: 'string', description: 'Display name of the assignee' },
                deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format' },
                project_id: { type: 'string', description: 'Project UUID. If omitted, uses General Operations.' },
            },
            required: ['title'],
        },
        risk: RISK.LOW,
        confirmFields: ['title', 'assignee_name', 'priority', 'deadline'],
    },
    {
        name: 'update_task',
        description: 'Update an existing task by its ID. Use search_tasks first to find the task ID.',
        parameters: {
            type: 'object',
            properties: {
                task_id: { type: 'string', description: 'Task UUID (required)' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['Not Started', 'In Progress', 'In Review', 'Done'] },
                priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
                assignee_id: { type: 'string' },
                assignee_name: { type: 'string' },
                deadline: { type: 'string' },
            },
            required: ['task_id'],
        },
        risk: RISK.LOW,
        confirmFields: ['task_id', 'title', 'status', 'assignee_name'],
    },
    {
        name: 'create_project',
        description: 'Create a new project in the workspace.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Project name (required)' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['Planning', 'In Progress', 'On Hold', 'Completed'], description: 'Default: Planning' },
                priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'], description: 'Default: Medium' },
                budget: { type: 'number', description: 'Budget amount in PKR' },
                end_date: { type: 'string', description: 'Due date YYYY-MM-DD' },
            },
            required: ['name'],
        },
        risk: RISK.LOW,
        confirmFields: ['name', 'status', 'budget'],
    },
    {
        name: 'create_lead',
        description: 'Create a new sales lead in the CRM pipeline.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Lead/contact name (required)' },
                company: { type: 'string', description: 'Company name' },
                email: { type: 'string' },
                phone: { type: 'string' },
                stage: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'], description: 'Default: New' },
                priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'], description: 'Default: Medium' },
                value: { type: 'number', description: 'Estimated deal value in PKR' },
            },
            required: ['name'],
        },
        risk: RISK.LOW,
        confirmFields: ['name', 'company', 'stage', 'value'],
    },
    {
        name: 'update_lead',
        description: 'Update an existing lead by its ID. Use get_leads first.',
        parameters: {
            type: 'object',
            properties: {
                lead_id: { type: 'string', description: 'Lead UUID (required)' },
                name: { type: 'string' },
                company: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                stage: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'] },
                value: { type: 'number' },
            },
            required: ['lead_id'],
        },
        risk: RISK.LOW,
        confirmFields: ['lead_id', 'stage', 'value'],
    },
    {
        name: 'create_client',
        description: 'Create a new client record.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Client/company name (required)' },
                company: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                notes: { type: 'string' },
            },
            required: ['name'],
        },
        risk: RISK.LOW,
        confirmFields: ['name', 'company', 'email'],
    },
    {
        name: 'create_contact',
        description: 'Create a new CRM contact.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Contact name (required)' },
                email: { type: 'string' },
                phone: { type: 'string' },
                company: { type: 'string' },
                position: { type: 'string', description: 'Role/position at the company' },
            },
            required: ['name'],
        },
        risk: RISK.LOW,
        confirmFields: ['name', 'email', 'company'],
    },
    {
        name: 'create_document',
        description: 'Create a new document in the docs module. Optionally place it in a folder (category).',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Document title (required)' },
                content: { type: 'string', description: 'Document content / body text (HTML or plain text)' },
                folder: { type: 'string', description: 'Folder name to place the document in (e.g. Strategy, Technical, Design, HR, General). Default: General' },
            },
            required: ['title'],
        },
        risk: RISK.LOW,
        confirmFields: ['title', 'folder'],
    },
    {
        name: 'create_folder',
        description: 'Create a new folder in the docs module to organize documents.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Folder name (required)' },
            },
            required: ['name'],
        },
        risk: RISK.LOW,
        confirmFields: ['name'],
    },
    {
        name: 'schedule_meeting',
        description: 'Schedule a new meeting. Resolves relative dates (e.g. "tomorrow", "next Monday").',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Meeting title (required)' },
                date: { type: 'string', description: 'Date in YYYY-MM-DD format (required)' },
                time: { type: 'string', description: 'Time in HH:MM 24h format (default: 10:00)' },
                duration: { type: 'number', description: 'Duration in minutes (default: 30)' },
                type: { type: 'string', description: 'Meeting type: Client Discovery, Project Review, Sprint Sync, Contract Negotiation, Milestone Check-in, QBR' },
                platform: { type: 'string', description: 'Platform: Google Meet, Zoom, Teams, In-Person' },
                attendees: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } },
                    description: 'List of attendees',
                },
                agenda: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Agenda items',
                },
                notes: { type: 'string' },
            },
            required: ['title', 'date'],
        },
        risk: RISK.LOW,
        confirmFields: ['title', 'date', 'time', 'platform', 'attendees'],
    },
    {
        name: 'create_invoice_draft',
        description: 'Create a draft invoice. Must be reviewed before sending.',
        parameters: {
            type: 'object',
            properties: {
                client_name: { type: 'string', description: 'Client name (required)' },
                amount: { type: 'number', description: 'Invoice total (required)' },
                description: { type: 'string' },
                due_date: { type: 'string', description: 'YYYY-MM-DD' },
                status: { type: 'string', enum: ['Draft', 'Sent', 'Paid', 'Overdue'], description: 'Default: Draft' },
            },
            required: ['client_name', 'amount'],
        },
        risk: RISK.SENSITIVE,
        confirmFields: ['client_name', 'amount', 'due_date', 'status'],
    },
    {
        name: 'create_expense_request',
        description: 'Create a new expense record. Requires confirmation.',
        parameters: {
            type: 'object',
            properties: {
                description: { type: 'string', description: 'Expense description (required)' },
                amount: { type: 'number', description: 'Expense amount (required)' },
                category: { type: 'string', description: 'Category: Office, Travel, Software, Marketing, Salary, Other' },
                date: { type: 'string', description: 'YYYY-MM-DD' },
            },
            required: ['description', 'amount'],
        },
        risk: RISK.SENSITIVE,
        confirmFields: ['description', 'amount', 'category'],
    },
    {
        name: 'send_notification',
        description: 'Send an in-app notification to an employee. Use search_employees first to get the user ID.',
        parameters: {
            type: 'object',
            properties: {
                user_id: { type: 'string', description: 'Recipient user UUID (required)' },
                title: { type: 'string', description: 'Notification title (required)' },
                message: { type: 'string', description: 'Notification body (required)' },
                type: { type: 'string', description: 'Type: task, info, alert, reminder' },
            },
            required: ['user_id', 'title', 'message'],
        },
        risk: RISK.EXTERNAL,
        confirmFields: ['user_id', 'title', 'message'],
    },
    {
        name: 'send_email_notification',
        description: 'Send an email notification to an employee. Use search_employees first to get their email address.',
        parameters: {
            type: 'object',
            properties: {
                to_email: { type: 'string', description: 'Recipient email address (required)' },
                subject: { type: 'string', description: 'Email subject line (required)' },
                email_type: { type: 'string', enum: ['task_assigned', 'meeting_scheduled', 'notification', 'custom'], description: 'Email template type' },
                body: { type: 'string', description: 'Email body text (for notification/custom type)' },
                data: { type: 'object', description: 'Structured data for the email template (task_title, priority, deadline, assigned_by, etc.)' },
            },
            required: ['to_email', 'subject'],
        },
        risk: RISK.EXTERNAL,
        confirmFields: ['to_email', 'subject', 'email_type'],
    },
    {
        name: 'send_telegram_notification',
        description: 'Send a Telegram notification to an employee who has connected their Telegram account. Use search_employees first.',
        parameters: {
            type: 'object',
            properties: {
                user_id: { type: 'string', description: 'Employee user UUID (required). Must have Telegram connected.' },
                title: { type: 'string', description: 'Notification title (required)' },
                message: { type: 'string', description: 'Notification message body (required)' },
            },
            required: ['user_id', 'title', 'message'],
        },
        risk: RISK.EXTERNAL,
        confirmFields: ['user_id', 'title', 'message'],
    },
];

// Build combined OpenRouter-formatted tool list
const ALL_TOOL_DEFS = [...READ_TOOLS, ...WRITE_TOOLS];
const TOOL_MAP = Object.fromEntries(ALL_TOOL_DEFS.map(t => [t.name, t]));

const OPENROUTER_TOOLS = ALL_TOOL_DEFS.map(t => ({
    type: 'function',
    function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
    },
}));

// ── Helpers ──

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TASK_STATUSES = ['Not Started', 'In Progress', 'In Review', 'Done'];
function normalizeStatus(value) {
    if (!value) return null;
    const v = value.toLowerCase().trim();
    if (['to do', 'todo', 'not started', 'notstarted', 'new', 'pending', 'backlog'].includes(v)) return 'Not Started';
    if (['in progress', 'inprogress', 'progress', 'doing', 'active', 'started'].includes(v)) return 'In Progress';
    if (['review', 'in review', 'inreview', 'reviewing', 'qa'].includes(v)) return 'In Review';
    if (['done', 'complete', 'completed', 'finished', 'closed'].includes(v)) return 'Done';
    const exact = TASK_STATUSES.find(s => s.toLowerCase() === v);
    return exact || value;
}

async function resolveUserId(value) {
    if (!value) return null;
    if (UUID_RE.test(value)) return value;
    const users = await managerService.getAllUsers();
    const q = value.toLowerCase();
    const match = users.find(u => u.name?.toLowerCase() === q) ||
                  users.find(u => u.name?.toLowerCase().includes(q));
    return match?.id || null;
}

// ── Tool executors ──

const executeReadTool = async (name, args, user) => {
    switch (name) {
        case 'search_employees': {
            const users = await managerService.getAllUsers();
            const safe = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, module: u.assigned_module }));
            if (args.query) {
                const q = args.query.toLowerCase();
                return safe.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
            }
            return safe;
        }
        case 'get_projects':
            return await projectService.getAll();
        case 'search_tasks': {
            const tasks = await projectService.getAllTasks();
            let filtered = tasks || [];
            if (args.status) filtered = filtered.filter(t => t.status?.toLowerCase() === args.status.toLowerCase());
            if (args.assignee) {
                const q = args.assignee.toLowerCase();
                filtered = filtered.filter(t => t.assignee_name?.toLowerCase().includes(q));
            }
            if (args.priority) filtered = filtered.filter(t => t.priority?.toLowerCase() === args.priority.toLowerCase());
            return filtered;
        }
        case 'get_overdue_tasks': {
            const allTasks = await projectService.getAllTasks();
            const now = new Date().toISOString().split('T')[0];
            return (allTasks || []).filter(t => t.deadline && t.deadline < now && t.status !== 'Done');
        }
        case 'get_leads':
            return await leadsService.getLeads();
        case 'get_clients':
            return await clientsService.getClients();
        case 'get_contacts':
            return await leadsService.getContacts();
        case 'get_finance_transactions':
            return await financeService.getTransactions();
        case 'get_invoices':
            return await financeService.getInvoices();
        case 'get_hr_employees':
            return await hrService.getEmployees();
        case 'get_leave_requests':
            return await hrService.getLeaveRequests();
        case 'get_documents':
            return await docsService.getDocuments();
        case 'get_folders':
            return await docsService.getFolders();
        case 'get_meetings':
            return await meetingsService.getMeetings();
        default:
            return { error: `Unknown read tool: ${name}` };
    }
};

const executeWriteTool = async (name, args) => {
    switch (name) {
        case 'create_task': {
            const payload = {
                title: args.title,
                description: args.description || '',
                status: normalizeStatus(args.status) || 'Not Started',
                priority: args.priority || 'Medium',
                deadline: args.deadline || null,
            };
            const nameHint = args.assignee_name || args.assignee_id || '';
            if (args.assignee_id || args.assignee_name) {
                const lookupValue = args.assignee_id || args.assignee_name;
                const users = await managerService.getAllUsers();
                let match = null;
                if (UUID_RE.test(lookupValue)) {
                    match = users.find(u => u.id === lookupValue);
                }
                if (!match) {
                    const q = nameHint.toLowerCase();
                    match = users.find(u => u.name?.toLowerCase() === q) ||
                            users.find(u => u.name?.toLowerCase().includes(q));
                }
                if (!match) return { success: false, message: `Could not find employee "${nameHint}". Use search_employees first to find the correct person.` };
                payload.assignee_id = match.id;
                payload.assignee_name = match.name;
            }
            if (args.project_id) payload.project_id = args.project_id;
            const result = await projectService.createTask(payload);
            return { success: true, message: `Task "${result.title}" created and assigned to ${payload.assignee_name || 'unassigned'}.`, data: result };
        }
        case 'update_task': {
            const { task_id, ...updates } = args;
            if (updates.status) updates.status = normalizeStatus(updates.status);
            if (updates.assignee_id || updates.assignee_name) {
                const lookupValue = updates.assignee_id || updates.assignee_name;
                const users = await managerService.getAllUsers();
                let match = null;
                if (UUID_RE.test(lookupValue)) {
                    match = users.find(u => u.id === lookupValue);
                }
                if (!match) {
                    const q = (updates.assignee_name || updates.assignee_id || '').toLowerCase();
                    match = users.find(u => u.name?.toLowerCase() === q) ||
                            users.find(u => u.name?.toLowerCase().includes(q));
                }
                if (!match) return { success: false, message: `Could not find employee "${lookupValue}".` };
                updates.assignee_id = match.id;
                updates.assignee_name = match.name;
            }
            const result = await projectService.updateTask(task_id, updates);
            return { success: true, message: `Task updated.`, data: result };
        }
        case 'create_project': {
            const result = await projectService.create({
                name: args.name,
                description: args.description || '',
                status: args.status || 'Planning',
                priority: args.priority || 'Medium',
                amount: args.budget || 0,
                due_date: args.end_date || null,
            });
            return { success: true, message: `Project "${result.name}" created.`, data: result };
        }
        case 'create_lead': {
            const result = await leadsService.createLead({
                name: args.name,
                company: args.company || '',
                contact_person: args.name,
                email: args.email || '',
                phone: args.phone || '',
                stage: args.stage || 'New',
                priority: args.priority || 'Medium',
                value: args.value || 0,
            });
            return { success: true, message: `Lead "${result.name}" created.`, data: result };
        }
        case 'update_lead': {
            const { lead_id, ...updates } = args;
            const result = await leadsService.updateLead(lead_id, updates);
            return { success: true, message: `Lead updated.`, data: result };
        }
        case 'create_client': {
            const result = await clientsService.createClient({
                name: args.name,
                company: args.company || args.name,
                email: args.email || '',
                phone: args.phone || '',
                address: args.address || '',
                notes: args.notes || '',
                status: 'Not Started',
                payment_status: 'Unpaid',
            });
            return { success: true, message: `Client "${result.name}" created.`, data: result };
        }
        case 'create_contact': {
            const result = await leadsService.createContact({
                name: args.name,
                email: args.email || '',
                phone: args.phone || '',
                company: args.company || '',
                role: args.position || '',
            });
            return { success: true, message: `Contact "${result.name}" created.`, data: result };
        }
        case 'create_document': {
            const { data: { session } } = await supabase.auth.getSession();
            const result = await docsService.createDocument({
                title: args.title,
                content: args.content || '',
                category: args.folder || 'General',
                type: 'document',
                owner_id: session?.user?.id || null,
                owner_name: session?.user?.user_metadata?.name || 'Admin',
                shared: false,
                views: 0,
            });
            return { success: true, message: `Document "${result.title}" created in ${args.folder || 'General'}.`, data: result };
        }
        case 'create_folder': {
            const result = await docsService.createFolder(args.name);
            return { success: true, message: `Folder "${args.name}" created.`, data: result };
        }
        case 'schedule_meeting': {
            const result = await meetingsService.createMeeting({
                title: args.title,
                date: args.date,
                time: args.time || '10:00',
                duration: args.duration || 30,
                type: args.type || 'Client Discovery',
                platform: args.platform || 'Google Meet',
                attendees: args.attendees || [],
                agenda: (args.agenda || []).map(item => (typeof item === 'string' ? { text: item } : item)),
                notes: args.notes || '',
            });
            return { success: true, message: `Meeting "${result.title}" scheduled for ${args.date}.`, data: result };
        }
        case 'create_invoice_draft': {
            const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            const dueDate = args.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
            const result = await financeService.createInvoice({
                id: invoiceId,
                client_name: args.client_name,
                amount: args.amount,
                due_date: dueDate,
                status: args.status || 'Draft',
                items: JSON.stringify({
                    items: [{ description: args.description || 'Services rendered', quantity: 1, price: args.amount }],
                    notes: args.description || '',
                }),
            });
            return { success: true, message: `Invoice ${invoiceId} created for ${args.client_name}: Rs. ${args.amount.toLocaleString()}`, data: result };
        }
        case 'create_expense_request': {
            const result = await financeService.createExpense({
                reason: args.description,
                amount: Math.round(args.amount),
                category: args.category || 'Other',
                type: 'company',
                requester_name: 'Company',
                date: args.date || new Date().toISOString().split('T')[0],
                status: 'Pending',
            });
            return { success: true, message: `Expense "${args.description}" recorded: Rs. ${args.amount.toLocaleString()}`, data: result };
        }
        case 'send_notification': {
            let recipientId = args.user_id;
            if (!UUID_RE.test(recipientId)) {
                recipientId = await resolveUserId(recipientId);
                if (!recipientId) return { success: false, message: `Could not find employee "${args.user_id}".` };
            }
            const { data: { session } } = await supabase.auth.getSession();
            const result = await notificationService.create({
                recipient_id: recipientId,
                sender_id: session?.user?.id || null,
                sender_name: session?.user?.user_metadata?.name || 'Admin',
                title: args.title,
                message: args.message,
                type: args.type || 'info',
            });
            return { success: true, message: `In-app notification sent.`, data: result };
        }
        case 'send_email_notification': {
            const result = await callSendEmail(
                args.to_email,
                args.subject,
                args.email_type || 'notification',
                args.data || { title: args.subject, message: args.body || '' },
            );
            if (result.error) return { success: false, message: `Email failed: ${result.error}` };
            return { success: true, message: `Email sent to ${args.to_email}.`, data: result };
        }
        case 'send_telegram_notification': {
            let recipientId = args.user_id;
            if (!UUID_RE.test(recipientId)) {
                recipientId = await resolveUserId(recipientId);
                if (!recipientId) return { success: false, message: `Could not find employee "${args.user_id}".` };
            }
            const msg = `📋 <b>${args.title || 'Notification'}</b>\n\n${args.message || ''}`;
            const result = await callTelegramSend(recipientId, msg);
            if (result.error) return { success: false, message: `Telegram: ${result.error}` };
            return { success: true, message: `Telegram notification sent.`, data: result };
        }
        default:
            return { error: `Unknown write tool: ${name}` };
    }
};

// ── System prompt ──

const buildSystemPrompt = (user) => `You are Jarvis — the DevelopWork AI assistant, a secure workspace automation assistant available only to administrators. When asked your name, you are Jarvis.

Current admin: ${user.name} (${user.email})
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Currency: PKR (Rs.) — always display amounts as "Rs. X" not "$X"
Language: The admin may speak in English, Urdu (Roman script), or mixed. AUTO-DETECT the language and reply in the SAME language:
- If the admin writes in English → reply in English
- If the admin writes in Roman Urdu (e.g. "mujhe sab projects dikhao") → reply in Roman Urdu
- If mixed → reply in the dominant language used
- Always keep tool calls, field names, and data values in English (only your conversational text changes language)

CAPABILITIES:
- Search and summarize any workspace data (projects, tasks, employees, leads, clients, finance, HR, docs, meetings)
- Create tasks and assign them to employees
- Create projects, leads, clients, contacts, documents, and document folders
- Schedule meetings
- Draft invoices and expense records
- Send in-app notifications to employees
- Send email notifications to employees (via Resend)
- Send Telegram notifications to employees who have connected Telegram

RULES:
1. ALWAYS use tools to get real data. Never guess or invent data.
2. When asked to create or assign something to a person, FIRST use search_employees to find their exact UUID (the "id" field). Pass this UUID in assignee_id or user_id fields. NEVER pass a person's name as an ID — always use the UUID from search results.
3. If multiple employees match a name, list all matches and ask the admin to pick one. Never guess.
4. For write operations, confirm the action clearly in your response. Show what will be created/changed.
5. When dates are relative ("tomorrow", "next Monday", "Friday"), resolve them to YYYY-MM-DD format using today's date.
6. Format responses with markdown. Be concise but thorough.
7. NEVER attempt to delete records, modify permissions, change passwords, or access payroll.
8. For financial operations (invoices, expenses), explicitly note they are DRAFTS requiring manual review.
9. When creating a task for someone, also offer to send them a notification (in-app, email, or Telegram).
10. For email notifications, use send_email_notification with the employee's email. Use email_type "task_assigned" for tasks, "meeting_scheduled" for meetings.
11. For Telegram, the employee must have connected their account first. If Telegram fails with "not connected", tell the admin.

EXACT VALUES (use these exactly, never invent variants):
- Task status: "Not Started", "In Progress", "In Review", "Done"
- Task/Lead/Project priority: "Critical", "High", "Medium", "Low"
- Project status: "Planning", "In Progress", "On Hold", "Completed"
- Lead stage: "New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed"
- Invoice status: "Draft", "Sent", "Paid", "Overdue"
- Meeting type: "Client Discovery", "Project Review", "Sprint Sync", "Contract Negotiation", "Milestone Check-in", "QBR"
- Meeting platform: "Google Meet", "Zoom", "Teams", "In-Person"

FORMATTING:
- Use **bold** for names and important values
- Use bullet points for summaries and single records (NOT tables for 1-2 items)
- Use markdown tables ONLY when listing 3+ records — keep columns to 3-4 max (Name, Status, Key Value). Omit UUIDs and long fields from tables.
- When showing a single employee match, use bullet points: **Name:** X, **Email:** Y, **Role:** Z
- Keep responses concise and actionable — no unnecessary explanations
- Never show raw UUIDs to the admin unless specifically asked`;

// ── Main service ──

export const aiCommandService = {
    getToolDefs() {
        return ALL_TOOL_DEFS;
    },

    getToolRisk(toolName) {
        return TOOL_MAP[toolName]?.risk || RISK.READ;
    },

    getToolConfirmFields(toolName) {
        return TOOL_MAP[toolName]?.confirmFields || [];
    },

    requiresConfirmation(toolName) {
        const risk = this.getToolRisk(toolName);
        return risk !== RISK.READ;
    },

    async sendMessage(messages, user, { onToolCall, onConfirmNeeded, confirmedActions = {} } = {}) {
        if (!USE_EDGE_FUNCTION && !OPENROUTER_API_KEY) {
            throw new Error('AI is not configured. Set up the Edge Function or provide an OpenRouter API key.');
        }
        if (user?.role !== 'admin') {
            throw new Error('AI Command Center is restricted to workspace administrators.');
        }

        const systemPrompt = { role: 'system', content: buildSystemPrompt(user) };
        const conversation = [systemPrompt, ...messages];

        let iterations = 0;

        while (iterations < MAX_TOOL_ITERATIONS) {
            iterations++;

            const data = await callAI(conversation, OPENROUTER_TOOLS);
            const message = data.choices?.[0]?.message;
            if (!message) throw new Error('Empty AI response');

            if (!message.tool_calls || message.tool_calls.length === 0) {
                return {
                    message,
                    actions: [],
                    usage: data.usage,
                };
            }

            conversation.push(message);

            const pendingActions = [];

            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                const toolDef = TOOL_MAP[toolName];

                if (!toolDef) {
                    conversation.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: JSON.stringify({ error: `Unknown tool "${toolName}". Use only registered tools.` }),
                    });
                    continue;
                }

                let args = {};
                try {
                    args = JSON.parse(toolCall.function.arguments || '{}');
                } catch {
                    conversation.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: JSON.stringify({ error: 'Invalid tool arguments (malformed JSON).' }),
                    });
                    continue;
                }

                onToolCall?.({ name: toolName, args, risk: toolDef.risk });

                if (toolDef.risk === RISK.READ) {
                    try {
                        const result = await executeReadTool(toolName, args, user);
                        conversation.push({
                            tool_call_id: toolCall.id,
                            role: 'tool',
                            content: JSON.stringify(result),
                        });
                    } catch (err) {
                        conversation.push({
                            tool_call_id: toolCall.id,
                            role: 'tool',
                            content: JSON.stringify({ error: err.message || 'Tool execution failed.' }),
                        });
                    }
                } else {
                    const actionKey = `${toolName}:${JSON.stringify(args)}`;

                    if (confirmedActions[actionKey]) {
                        try {
                            const result = await executeWriteTool(toolName, args);
                            pendingActions.push({ toolName, args, risk: toolDef.risk, status: 'completed', result });
                            conversation.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                content: JSON.stringify(result),
                            });
                        } catch (err) {
                            pendingActions.push({ toolName, args, risk: toolDef.risk, status: 'failed', error: err.message });
                            conversation.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                content: JSON.stringify({ error: err.message || 'Action failed.' }),
                            });
                        }
                    } else {
                        pendingActions.push({
                            toolName,
                            args,
                            risk: toolDef.risk,
                            status: 'awaiting_confirmation',
                            toolCallId: toolCall.id,
                            confirmFields: toolDef.confirmFields || [],
                        });
                        conversation.push({
                            tool_call_id: toolCall.id,
                            role: 'tool',
                            content: JSON.stringify({
                                status: 'awaiting_confirmation',
                                message: 'This action requires admin confirmation before execution. The preview has been shown to the admin.',
                            }),
                        });
                    }
                }
            }

            const hasPending = pendingActions.some(a => a.status === 'awaiting_confirmation');
            if (hasPending) {
                const finalData = await callAI(conversation, null);
                const finalMessage = finalData.choices?.[0]?.message;

                return {
                    message: finalMessage || { role: 'assistant', content: 'Please review and confirm the actions above.' },
                    actions: pendingActions,
                    usage: data.usage,
                };
            }

            if (pendingActions.length > 0 && pendingActions.every(a => a.status === 'completed' || a.status === 'failed')) {
                continue;
            }
        }

        return {
            message: { role: 'assistant', content: 'I reached the maximum processing steps. Please try a simpler request or break it into parts.' },
            actions: [],
        };
    },

    async executeConfirmedAction(toolName, args) {
        return await executeWriteTool(toolName, args);
    },
};
