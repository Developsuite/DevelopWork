import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'dw-meetings-data';

// Helper to generate dynamic dates around today
const getRelativeDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
};

const INITIAL_MEETINGS = [
    {
        id: 'mtg-101',
        title: 'Fleet Booking Engine Architecture & Milestone 2 Review',
        client_id: 'cl-1',
        client_name: 'Saqib ali mehar',
        client_company: 'New Ali Lajpal Rent a car',
        client_email: 'saqib@lajpalrentacar.com',
        client_phone: '+92 300 1234567',
        project_id: 'proj-1',
        project_name: 'Car Rental Booking Platform',
        type: 'Project Review',
        status: 'Scheduled',
        date: getRelativeDate(1),
        time: '14:00',
        duration: 45,
        platform: 'Google Meet',
        meeting_link: 'https://meet.google.com/xyt-qopz-mka',
        location: 'Online Video Call',
        host: { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Workspace Admin' },
        attendees: [
            { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Host', status: 'Accepted' },
            { name: 'Saqib ali mehar', email: 'saqib@lajpalrentacar.com', role: 'Client Stakeholder', status: 'Accepted' },
            { name: 'Sarah Ahmed', email: 'sarah@developwork.com', role: 'Tech Lead', status: 'Accepted' }
        ],
        agenda: [
            { id: 'ag-1', text: 'Review live GPS vehicle tracking API latency & real-time map sync', completed: true, timeAllocated: '15m' },
            { id: 'ag-2', text: 'Payment gateway multi-currency settlement options (PKR & USD)', completed: false, timeAllocated: '15m' },
            { id: 'ag-3', text: 'Staging deployment sign-off & customer app launch date', completed: false, timeAllocated: '15m' }
        ],
        notes: `### Key Discussion Points
- Reviewed initial stress tests on vehicle reservation queries; query response times consistently under 120ms.
- Saqib requested automated SMS & WhatsApp notification alerts to clients upon driver dispatch.
- Agreed to execute a live pilot run in Lahore branch next Tuesday before nationwide rollout.`,
        action_items: [
            { id: 'act-1', text: 'Configure payment webhook listeners for automated SMS receipts', assignee: 'Sarah Ahmed', dueDate: getRelativeDate(4), completed: false, priority: 'High' },
            { id: 'act-2', text: 'Send updated vehicle fleet inventory CSV template to Saqib', assignee: 'Abbas Afzal', dueDate: getRelativeDate(2), completed: true, priority: 'Medium' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mtg-102',
        title: 'Warehouse Sync & European Logistics Integration Check-in',
        client_id: 'cl-2',
        client_name: 'Mudassir portugal',
        client_company: 'Tudostock',
        client_email: 'mudassir@tudostock.pt',
        client_phone: '+351 912 345 678',
        project_id: 'proj-2',
        project_name: 'Tudostock Inventory Automation',
        type: 'Client Discovery',
        status: 'Scheduled',
        date: getRelativeDate(2),
        time: '16:30',
        duration: 60,
        platform: 'Zoom',
        meeting_link: 'https://zoom.us/j/9842187391',
        location: 'Zoom Conference',
        host: { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Product Manager' },
        attendees: [
            { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Host', status: 'Accepted' },
            { name: 'Mudassir portugal', email: 'mudassir@tudostock.pt', role: 'Client Executive', status: 'Accepted' },
            { name: 'Omar Raza', email: 'omar@developwork.com', role: 'Systems Engineer', status: 'Accepted' }
        ],
        agenda: [
            { id: 'ag-4', text: 'Cross-border SKU barcode scanning speed & warehouse scanner hardware', completed: false, timeAllocated: '20m' },
            { id: 'ag-5', text: 'Automated invoice generation for EU tax regulations (VAT compliance)', completed: false, timeAllocated: '20m' },
            { id: 'ag-6', text: 'Data sync frequency between Lisbon warehouse & online storefront', completed: false, timeAllocated: '20m' }
        ],
        notes: `### Meeting Objectives
- Client needs automated stock deficit alerts sent to suppliers when quantity drops below threshold.
- Explore multi-warehouse routing rules for orders within the Iberian peninsula.`,
        action_items: [
            { id: 'act-3', text: 'Prepare REST API documentation for Tudostock ERP integration', assignee: 'Omar Raza', dueDate: getRelativeDate(5), completed: false, priority: 'High' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mtg-103',
        title: 'Commercial Construction Site Procurement & Budget Sync',
        client_id: 'cl-3',
        client_name: 'Faryad Hussain',
        client_company: 'RHA builders',
        client_email: 'faryad@rhabuilders.com',
        client_phone: '+92 321 9876543',
        project_id: 'proj-3',
        project_name: 'RHA Commercial Construction Portal',
        type: 'Contract Negotiation',
        status: 'Completed',
        date: getRelativeDate(-1),
        time: '11:00',
        duration: 60,
        platform: 'In-Person',
        meeting_link: '',
        location: 'Shahalmi Furniture Market Site Office, Lahore',
        host: { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Workspace Admin' },
        attendees: [
            { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Host', status: 'Accepted' },
            { name: 'Faryad Hussain', email: 'faryad@rhabuilders.com', role: 'Managing Partner', status: 'Accepted' }
        ],
        agenda: [
            { id: 'ag-7', text: 'Review Phase 1 bill of materials & contractor approvals', completed: true, timeAllocated: '30m' },
            { id: 'ag-8', text: 'Mobile inspection checklist app demo for site supervisors', completed: true, timeAllocated: '30m' }
        ],
        notes: `### Minutes of Meeting (Signed Off)
- Faryad thoroughly tested and approved the mobile inspection checklist prototype.
- Finalized Phase 1 milestone deliverables with zero outstanding defect objections.
- Added special request for offline mode caching so supervisors can fill inspection forms without internet coverage on remote construction sites.`,
        action_items: [
            { id: 'act-4', text: 'Implement IndexedDB offline sync for site inspection forms', assignee: 'Sarah Ahmed', dueDate: getRelativeDate(7), completed: false, priority: 'High' },
            { id: 'act-5', text: 'Dispatch signed milestone completion report to accounts department', assignee: 'Abbas Afzal', dueDate: getRelativeDate(1), completed: true, priority: 'High' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mtg-104',
        title: 'DevelopWork Core Platform Sprint Review & Architecture Scrum',
        client_id: null,
        client_name: 'Internal Operations',
        client_company: 'DevelopWork Core Team',
        client_email: 'team@developwork.com',
        client_phone: '',
        project_id: 'proj-core',
        project_name: 'Platform Core Sprint',
        type: 'Sprint Sync',
        status: 'Scheduled',
        date: getRelativeDate(0),
        time: '17:00',
        duration: 30,
        platform: 'Google Meet',
        meeting_link: 'https://meet.google.com/core-sync-dw',
        location: 'Online Conference Room A',
        host: { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Lead Architect' },
        attendees: [
            { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Host', status: 'Accepted' },
            { name: 'Sarah Ahmed', email: 'sarah@developwork.com', role: 'Tech Lead', status: 'Accepted' },
            { name: 'Omar Raza', email: 'omar@developwork.com', role: 'HR & Ops', status: 'Accepted' }
        ],
        agenda: [
            { id: 'ag-9', text: 'Sprint velocity check & blocker removal across microservices', completed: false, timeAllocated: '15m' },
            { id: 'ag-10', text: 'Review customer feedback on Module Hub & client meeting linkage', completed: false, timeAllocated: '15m' }
        ],
        notes: `Regular weekly engineering and design alignment scrum.`,
        action_items: [
            { id: 'act-6', text: 'Finalize meeting minutes export feature to PDF & clipboard', assignee: 'Sarah Ahmed', dueDate: getRelativeDate(3), completed: false, priority: 'Low' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const meetingsService = {
    // Read local cache
    getLocalMeetings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MEETINGS));
                return INITIAL_MEETINGS;
            }
            return JSON.parse(raw);
        } catch (e) {
            console.error('[MeetingsService] Error reading localStorage:', e);
            return INITIAL_MEETINGS;
        }
    },

    // Save local cache
    saveLocalMeetings(meetings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
            window.dispatchEvent(new CustomEvent('dwMeetingsUpdated', { detail: meetings }));
        } catch (e) {
            console.error('[MeetingsService] Error saving localStorage:', e);
        }
    },

    // Get all meetings with optional filters
    async getMeetings(filters = {}) {
        let meetings = this.getLocalMeetings();

        // Optional Supabase query if table exists
        try {
            const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: true });
            if (!error && data && data.length > 0) {
                // If Supabase has data, sync it into local cache
                meetings = data;
                this.saveLocalMeetings(meetings);
            }
        } catch {
            // Supabase table may not exist yet, local cache serves as fallback
        }

        // Apply filters
        return meetings.filter(m => {
            if (filters.clientId && m.client_id !== filters.clientId) {
                return false;
            }
            if (filters.status && filters.status !== 'all' && m.status !== filters.status) {
                return false;
            }
            if (filters.type && filters.type !== 'all' && m.type !== filters.type) {
                return false;
            }
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const matchTitle = m.title?.toLowerCase().includes(q);
                const matchClient = m.client_name?.toLowerCase().includes(q) || m.client_company?.toLowerCase().includes(q);
                const matchProject = m.project_name?.toLowerCase().includes(q);
                if (!matchTitle && !matchClient && !matchProject) return false;
            }
            return true;
        });
    },

    async getMeetingById(id) {
        const meetings = this.getLocalMeetings();
        return meetings.find(m => m.id === id) || null;
    },

    async createMeeting(meetingData) {
        const newMeeting = {
            id: `mtg-${Date.now()}`,
            title: meetingData.title || 'Untitled Meeting',
            client_id: meetingData.client_id || null,
            client_name: meetingData.client_name || '',
            client_company: meetingData.client_company || '',
            client_email: meetingData.client_email || '',
            client_phone: meetingData.client_phone || '',
            project_id: meetingData.project_id || null,
            project_name: meetingData.project_name || '',
            type: meetingData.type || 'Client Discovery',
            status: meetingData.status || 'Scheduled',
            date: meetingData.date || getRelativeDate(0),
            time: meetingData.time || '10:00',
            duration: Number(meetingData.duration) || 30,
            platform: meetingData.platform || 'Google Meet',
            meeting_link: meetingData.meeting_link || `https://meet.google.com/dw-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
            location: meetingData.location || (meetingData.platform === 'In-Person' ? 'Headquarters' : 'Online Video Call'),
            host: meetingData.host || { name: 'Abbas Afzal', email: 'abbas@developwork.com', role: 'Host' },
            attendees: meetingData.attendees || [],
            agenda: meetingData.agenda || [],
            notes: meetingData.notes || '',
            action_items: meetingData.action_items || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Try Supabase insert
        try {
            const { data, error } = await supabase.from('meetings').insert(newMeeting).select().single();
            if (!error && data) {
                const local = this.getLocalMeetings();
                this.saveLocalMeetings([data, ...local]);
                return data;
            }
        } catch {
            // fallback
        }

        const local = this.getLocalMeetings();
        const updated = [newMeeting, ...local];
        this.saveLocalMeetings(updated);
        return newMeeting;
    },

    async updateMeeting(id, updates) {
        // Try Supabase update
        try {
            const { data, error } = await supabase.from('meetings').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', id).select().single();
            if (!error && data) {
                const local = this.getLocalMeetings();
                this.saveLocalMeetings(local.map(m => m.id === id ? data : m));
                return data;
            }
        } catch {
            // fallback
        }

        const local = this.getLocalMeetings();
        const updated = local.map(m => {
            if (m.id === id) {
                return {
                    ...m,
                    ...updates,
                    updated_at: new Date().toISOString()
                };
            }
            return m;
        });
        this.saveLocalMeetings(updated);
        return updated.find(m => m.id === id);
    },

    async deleteMeeting(id) {
        try {
            await supabase.from('meetings').delete().eq('id', id);
        } catch {
            // ignore
        }

        const local = this.getLocalMeetings();
        const filtered = local.filter(m => m.id !== id);
        this.saveLocalMeetings(filtered);
        return true;
    },

    async toggleAgendaItem(meetingId, agendaId) {
        const meeting = await this.getMeetingById(meetingId);
        if (!meeting) return null;

        const updatedAgenda = (meeting.agenda || []).map(item => {
            if (item.id === agendaId) {
                return { ...item, completed: !item.completed };
            }
            return item;
        });

        return await this.updateMeeting(meetingId, { agenda: updatedAgenda });
    },

    async toggleActionItem(meetingId, actionItemId) {
        const meeting = await this.getMeetingById(meetingId);
        if (!meeting) return null;

        const updatedActions = (meeting.action_items || []).map(act => {
            if (act.id === actionItemId) {
                return { ...act, completed: !act.completed };
            }
            return act;
        });

        return await this.updateMeeting(meetingId, { action_items: updatedActions });
    },

    async addActionItem(meetingId, actionItem) {
        const meeting = await this.getMeetingById(meetingId);
        if (!meeting) return null;

        const newItem = {
            id: `act-${Date.now()}`,
            text: actionItem.text,
            assignee: actionItem.assignee || 'Unassigned',
            dueDate: actionItem.dueDate || getRelativeDate(3),
            completed: false,
            priority: actionItem.priority || 'Medium',
        };

        const updatedActions = [...(meeting.action_items || []), newItem];
        return await this.updateMeeting(meetingId, { action_items: updatedActions });
    },

    async getMeetingsByClient(clientId) {
        const all = this.getLocalMeetings();
        return all.filter(m => m.client_id === clientId || m.client_name === clientId);
    },

    getStats() {
        const meetings = this.getLocalMeetings();
        const todayStr = getRelativeDate(0);

        const totalMeetings = meetings.length;
        const clientMeetings = meetings.filter(m => m.client_id || m.client_name).length;
        const todayMeetings = meetings.filter(m => m.date === todayStr);
        const scheduled = meetings.filter(m => m.status === 'Scheduled').length;
        const completed = meetings.filter(m => m.status === 'Completed').length;

        // All action items across meetings
        const allActionItems = meetings.flatMap(m => m.action_items || []);
        const pendingActions = allActionItems.filter(a => !a.completed).length;
        const completedActions = allActionItems.filter(a => a.completed).length;
        const actionCompletionRate = allActionItems.length > 0 
            ? Math.round((completedActions / allActionItems.length) * 100) 
            : 100;

        return {
            totalMeetings,
            clientMeetings,
            todayCount: todayMeetings.length,
            scheduled,
            completed,
            pendingActions,
            actionCompletionRate,
            allActionItemsCount: allActionItems.length
        };
    }
};
