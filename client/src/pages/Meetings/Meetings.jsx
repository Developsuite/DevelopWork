import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { addToast } from '../../store/slices/uiSlice';
import { meetingsService } from '../../services/meetingsService';
import { googleCalendarService } from '../../services/googleCalendarService';
import { clientsService } from '../../services/clientsService';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    Video,
    Calendar,
    Clock,
    Users,
    Search,
    Plus,
    Filter,
    CheckCircle2,
    AlertCircle,
    Building2,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    Copy,
    Share2,
    Trash2,
    Pencil,
    FileText,
    ListTodo,
    Sparkles,
    Handshake,
    FolderKanban,
    Phone,
    MapPin,
    CheckSquare,
    Square,
    Check,
    X,
    CalendarDays,
    LayoutGrid,
    List,
    TrendingUp,
    MoreVertical,
    Send,
    CalendarCheck,
    Unplug,
    RefreshCw
} from 'lucide-react';
import './Meetings.css';

const MEETING_TYPES = [
    { label: 'Client Discovery', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Project Review', color: '#0055FE', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Sprint Sync', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'Contract Negotiation', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    { label: 'Milestone Check-in', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { label: 'QBR', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
];

const PLATFORMS = [
    { id: 'Google Meet', label: 'Google Meet', icon: '📹' },
    { id: 'Zoom', label: 'Zoom', icon: '💻' },
    { id: 'Microsoft Teams', label: 'Microsoft Teams', icon: '👥' },
    { id: 'In-Person', label: 'In-Person', icon: '🏢' },
    { id: 'Phone Call', label: 'Phone Call', icon: '📞' },
];

const Meetings = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useSelector((state) => state.auth);

    const activeTab = searchParams.get('tab') || 'upcoming';
    const clientFilterParam = searchParams.get('client') || 'all';

    // State
    const [meetings, setMeetings] = useState([]);
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState(meetingsService.getStats());

    // Filters & View
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedClientFilter, setSelectedClientFilter] = useState(clientFilterParam);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // New action item state inside detail modal
    const [newActionText, setNewActionText] = useState('');
    const [newActionAssignee, setNewActionAssignee] = useState('');
    const [newActionDueDate, setNewActionDueDate] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);
    const [calendarStatus, setCalendarStatus] = useState({ connected: false, loading: true, can_connect: false });
    const [calendarConnecting, setCalendarConnecting] = useState(false);
    const [savingMeeting, setSavingMeeting] = useState(false);

    // Calendar state
    const [currentCalDate, setCurrentCalDate] = useState(new Date());

    // Form data for create/edit
    const [formData, setFormData] = useState({
        title: '',
        type: 'Client Discovery',
        client_id: '',
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        project_name: '',
        status: 'Scheduled',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        duration: 45,
        platform: 'Google Meet',
        meeting_link: '',
        location: 'Online Video Call',
        notes: '',
        agendaItems: [{ id: 'ag-new-1', text: '', timeAllocated: '15m' }],
        attendees: [],
    });

    // Load data
    const loadData = useCallback(async () => {
        try {
            const [meetingList, clientList] = await Promise.all([
                meetingsService.getMeetings(),
                clientsService.getClients().catch(() => [])
            ]);
            setMeetings(meetingList);
            setClients(clientList);
            setStats(meetingsService.getStats());
        } catch (err) {
            console.error('Error loading meetings data:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to load meetings', type: 'error' }));
        }
    }, [dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadCalendarStatus = useCallback(async () => {
        try {
            const status = await googleCalendarService.getStatus();
            setCalendarStatus({ ...status, loading: false });
        } catch (error) {
            console.warn('Google Calendar status unavailable:', error);
            setCalendarStatus({ connected: false, loading: false, can_connect: user?.role === 'admin', error: error.message });
        }
    }, [user?.role]);

    useEffect(() => {
        loadCalendarStatus();
    }, [loadCalendarStatus]);

    useEffect(() => {
        const result = searchParams.get('google_calendar');
        if (!result) return;
        if (result === 'connected') {
            dispatch(addToast({ title: 'Google Calendar connected', message: 'New Google Meet meetings will be added to this workspace calendar.', type: 'success' }));
            loadCalendarStatus();
        } else {
            dispatch(addToast({ title: 'Connection failed', message: 'Google Calendar could not be connected. Please try again.', type: 'error' }));
        }
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.delete('google_calendar');
            return next;
        }, { replace: true });
    }, [searchParams, setSearchParams, dispatch, loadCalendarStatus]);

    const handleConnectCalendar = async () => {
        setCalendarConnecting(true);
        try {
            const result = await googleCalendarService.connect('/meetings');
            window.location.assign(result.auth_url);
        } catch (error) {
            dispatch(addToast({ title: 'Google Calendar', message: error.message || 'Could not start Google connection.', type: 'error' }));
            setCalendarConnecting(false);
        }
    };

    const handleDisconnectCalendar = async () => {
        if (!window.confirm('Disconnect Google Calendar for this workspace? Existing calendar events will remain in Google.')) return;
        try {
            await googleCalendarService.disconnect();
            await loadCalendarStatus();
            dispatch(addToast({ title: 'Google Calendar disconnected', message: 'New meetings will no longer sync until an administrator reconnects.', type: 'info' }));
        } catch (error) {
            dispatch(addToast({ title: 'Disconnect failed', message: error.message, type: 'error' }));
        }
    };

    const handleTabChange = (tab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    // Open create modal with prefilled client if applicable
    const handleOpenCreateModal = useCallback((prefillClientId = null) => {
        setIsEditMode(false);
        const targetClient = clients.find(c => c.id === prefillClientId || c.name === prefillClientId);

        setFormData({
            title: targetClient ? `Sync with ${targetClient.name}` : '',
            type: targetClient ? 'Client Discovery' : 'Sprint Sync',
            client_id: targetClient ? targetClient.id : '',
            client_name: targetClient ? targetClient.name : '',
            client_company: targetClient ? targetClient.company : '',
            client_email: targetClient ? targetClient.email : '',
            client_phone: targetClient ? targetClient.phone : '',
            project_name: targetClient?.projects?.[0]?.name || '',
            status: 'Scheduled',
            date: new Date().toISOString().split('T')[0],
            time: '14:00',
            duration: 45,
            platform: 'Google Meet',
            meeting_link: '',
            location: 'Online Video Call',
            notes: '',
            agendaItems: [
                { id: `ag-${Date.now()}-1`, text: 'Introductions & project scope alignment', timeAllocated: '15m' },
                { id: `ag-${Date.now()}-2`, text: 'Key deliverables review & milestones check', timeAllocated: '20m' },
                { id: `ag-${Date.now()}-3`, text: 'Q&A and agreed next steps', timeAllocated: '10m' },
            ],
            attendees: [
                { name: user?.name || 'Workspace Admin', email: user?.email || 'admin@developwork.com', role: 'Host' },
                ...(targetClient ? [{ name: targetClient.name, email: targetClient.email || '', role: 'Client' }] : [])
            ]
        });
        setIsCreateModalOpen(true);
    }, [clients, user?.email, user?.name]);

    // Handle deep-link parameters (e.g. ?client=cl-1&schedule=true)
    useEffect(() => {
        const clientParam = searchParams.get('client');
        if (clientParam) {
            setSelectedClientFilter(clientParam);
        }
        if (searchParams.get('schedule') === 'true') {
            handleOpenCreateModal(clientParam);
        }
    }, [searchParams, handleOpenCreateModal]);

    const handleOpenEditModal = (meeting, e) => {
        if (e) e.stopPropagation();
        setIsEditMode(true);
        setSelectedMeeting(meeting);
        setFormData({
            title: meeting.title,
            type: meeting.type,
            client_id: meeting.client_id || '',
            client_name: meeting.client_name || '',
            client_company: meeting.client_company || '',
            client_email: meeting.client_email || '',
            client_phone: meeting.client_phone || '',
            project_name: meeting.project_name || '',
            status: meeting.status,
            date: meeting.date,
            time: meeting.time,
            duration: meeting.duration,
            platform: meeting.platform,
            meeting_link: meeting.meeting_link,
            location: meeting.location,
            notes: meeting.notes || '',
            agendaItems: meeting.agenda && meeting.agenda.length > 0 ? meeting.agenda : [{ id: 'ag-1', text: '', timeAllocated: '15m' }],
            attendees: meeting.attendees || []
        });
        setIsCreateModalOpen(true);
    };

    const handleSelectClientInForm = (clientId) => {
        const found = clients.find(c => c.id === clientId);
        if (found) {
            setFormData(prev => ({
                ...prev,
                client_id: found.id,
                client_name: found.name,
                client_company: found.company,
                client_email: found.email || '',
                client_phone: found.phone || '',
                project_name: found.projects?.[0]?.name || prev.project_name,
                attendees: [
                    ...prev.attendees.filter(a => a.role !== 'Client'),
                    { name: found.name, email: found.email || '', role: 'Client' }
                ]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                client_id: '',
                client_name: '',
                client_company: '',
                client_email: '',
                client_phone: '',
                attendees: prev.attendees.filter(a => a.role !== 'Client')
            }));
        }
    };

    const handleSaveMeeting = async () => {
        if (!formData.title.trim()) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter a meeting title', type: 'warning' }));
            return;
        }

        if (formData.platform === 'Google Meet' && !calendarStatus.connected) {
            dispatch(addToast({
                title: 'Connect Google Calendar',
                message: calendarStatus.can_connect ? 'Connect this workspace to Google Calendar before scheduling a Google Meet.' : 'Ask the workspace administrator to connect Google Calendar first.',
                type: 'warning'
            }));
            return;
        }

        const validAgenda = (formData.agendaItems || [])
            .filter(item => item.text && item.text.trim())
            .map((item, idx) => ({
                id: item.id || `ag-${idx}`,
                text: item.text.trim(),
                timeAllocated: item.timeAllocated || '15m',
                completed: item.completed || false
            }));

        const payload = {
            ...formData,
            agenda: validAgenda,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
            sync_google_calendar: formData.platform === 'Google Meet',
        };

        setSavingMeeting(true);
        try {
            let savedMeeting;
            if (isEditMode && selectedMeeting) {
                savedMeeting = await meetingsService.updateMeeting(selectedMeeting.id, payload);
                dispatch(addToast({ title: 'Meeting Updated', message: formData.platform === 'Google Meet' ? 'Meeting and Google Calendar event have been updated.' : 'Meeting details have been saved.', type: 'success' }));
                if (selectedMeeting && selectedMeeting.id === savedMeeting.id) {
                    setSelectedMeeting(savedMeeting);
                }
            } else {
                savedMeeting = await meetingsService.createMeeting(payload);
                dispatch(addToast({
                    title: 'Meeting Scheduled',
                    message: formData.platform === 'Google Meet'
                        ? savedMeeting.meeting_link
                            ? 'Added to Google Calendar and a Google Meet link was created.'
                            : 'Added to Google Calendar. Google is still preparing the Meet link; refresh Meetings shortly.'
                        : 'New meeting scheduled successfully.',
                    type: 'success'
                }));
            }
            await loadData();
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Save meeting error:', err);
            dispatch(addToast({ title: 'Unable to schedule meeting', message: err.message || 'Failed to save meeting', type: 'error' }));
        } finally {
            setSavingMeeting(false);
        }
    };

    const handleDeleteMeeting = async (meetingId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to cancel and delete this meeting?')) return;

        try {
            await meetingsService.deleteMeeting(meetingId);
            dispatch(addToast({ title: 'Meeting Deleted', message: 'Meeting has been removed', type: 'info' }));
            if (selectedMeeting?.id === meetingId) {
                setIsDetailModalOpen(false);
            }
            await loadData();
        } catch (err) {
            console.error('Delete meeting error:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to delete meeting', type: 'error' }));
        }
    };

    const handleOpenDetailModal = (meeting) => {
        setSelectedMeeting(meeting);
        setIsDetailModalOpen(true);
        setNewActionText('');
        setNewActionAssignee('');
        setNewActionDueDate('');
    };

    const handleToggleAgenda = async (agendaId) => {
        if (!selectedMeeting) return;
        try {
            const updated = await meetingsService.toggleAgendaItem(selectedMeeting.id, agendaId);
            setSelectedMeeting(updated);
            await loadData();
        } catch (err) {
            console.error('Error toggling agenda item:', err);
        }
    };

    const handleToggleAction = async (actionId) => {
        if (!selectedMeeting) return;
        try {
            const updated = await meetingsService.toggleActionItem(selectedMeeting.id, actionId);
            setSelectedMeeting(updated);
            await loadData();
        } catch (err) {
            console.error('Error toggling action item:', err);
        }
    };

    const handleAddActionItem = async () => {
        if (!newActionText.trim() || !selectedMeeting) return;
        try {
            const updated = await meetingsService.addActionItem(selectedMeeting.id, {
                text: newActionText.trim(),
                assignee: newActionAssignee.trim() || user?.name || 'Unassigned',
                dueDate: newActionDueDate || new Date().toISOString().split('T')[0],
                priority: 'High'
            });
            setSelectedMeeting(updated);
            setNewActionText('');
            setNewActionAssignee('');
            setNewActionDueDate('');
            await loadData();
            dispatch(addToast({ title: 'Action Item Added', message: 'Follow-up task created', type: 'success' }));
        } catch (err) {
            console.error('Error adding action item:', err);
        }
    };

    const handleCopyMinutes = (meeting) => {
        const text = `
=== MINUTES OF MEETING (MoM) ===
Title: ${meeting.title}
Date & Time: ${meeting.date} at ${meeting.time} (${meeting.duration} mins)
Client: ${meeting.client_name || 'Internal'} ${meeting.client_company ? `(${meeting.client_company})` : ''}
Platform: ${meeting.platform}
Link: ${meeting.meeting_link || 'N/A'}

AGENDA:
${(meeting.agenda || []).map(a => `- [${a.completed ? 'x' : ' '}] ${a.text}`).join('\n')}

NOTES:
${meeting.notes || 'No detailed notes.'}

ACTION ITEMS:
${(meeting.action_items || []).map(act => `- [${act.completed ? 'x' : ' '}] ${act.text} (Assignee: ${act.assignee}, Due: ${act.dueDate})`).join('\n')}
================================
        `.trim();

        navigator.clipboard.writeText(text);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        dispatch(addToast({ title: 'Copied to Clipboard', message: 'Meeting summary and MoM copied', type: 'success' }));
    };

    // Filtered meetings list
    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                m.title?.toLowerCase().includes(q) ||
                m.client_name?.toLowerCase().includes(q) ||
                m.client_company?.toLowerCase().includes(q) ||
                m.project_name?.toLowerCase().includes(q);

            const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
            const matchesType = typeFilter === 'all' || m.type === typeFilter;
            const matchesClient =
                selectedClientFilter === 'all' ||
                m.client_id === selectedClientFilter ||
                m.client_name === selectedClientFilter;

            return matchesSearch && matchesStatus && matchesType && matchesClient;
        });
    }, [meetings, searchQuery, statusFilter, typeFilter, selectedClientFilter]);

    // Format relative time helper
    const getMeetingTimeBadge = (meeting) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        let dayLabel = meeting.date;
        if (meeting.date === todayStr) {
            dayLabel = 'Today';
        } else if (meeting.date === tomorrowStr) {
            dayLabel = 'Tomorrow';
        }

        return `${dayLabel} at ${meeting.time}`;
    };

    // Get color for meeting type
    const getTypeMeta = (type) => {
        return MEETING_TYPES.find(t => t.label === type) || { label: type, color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' };
    };

    return (
        <div className="meetings-page">
            {/* Top Header Banner */}
            <div className="meetings-header">
                <div className="meetings-header__intro">
                    <div className="meetings-header__badge">
                        <Video size={13} color="var(--primary-500)" />
                        <span>Workplace Communication Suite</span>
                    </div>
                    <h1 className="meetings-header__title">Meetings Management</h1>
                    <p className="meetings-header__subtitle">
                        Schedule client consultations, conduct agile reviews, and capture instant MoM with follow-up action items.
                    </p>
                </div>

                <div className="meetings-header__actions">
                    {calendarStatus.connected ? (
                        <button className="google-calendar-button connected" type="button" title={`Connected as ${calendarStatus.google_email}`} onClick={() => handleTabChange('calendar')}>
                            <CalendarCheck size={16} /><span><strong>Google Calendar</strong><small>{calendarStatus.google_email}</small></span>
                        </button>
                    ) : calendarStatus.can_connect ? (
                        <button className="google-calendar-button" type="button" onClick={handleConnectCalendar} disabled={calendarConnecting || calendarStatus.loading}>
                            {calendarConnecting ? <RefreshCw size={16} className="google-calendar-spin" /> : <Calendar size={16} />}
                            <span><strong>{calendarConnecting ? 'Connecting...' : 'Connect Google Calendar'}</strong><small>Auto-create Meet links</small></span>
                        </button>
                    ) : null}
                    <Button
                        variant="secondary"
                        icon={Calendar}
                        onClick={() => handleTabChange('calendar')}
                    >
                        Calendar
                    </Button>
                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => handleOpenCreateModal()}
                        className="meetings-primary-btn"
                    >
                        Schedule Meeting
                    </Button>
                </div>
            </div>

            {calendarStatus.connected && (
                <div className="meetings-calendar-integration">
                    <span className="meetings-calendar-integration__icon"><CalendarCheck size={18} /></span>
                    <div><strong>Calendar sync is active</strong><span>Google Meet events and attendee invitations use {calendarStatus.google_email}.</span></div>
                    {calendarStatus.can_connect && <button type="button" onClick={handleDisconnectCalendar}><Unplug size={14} /> Disconnect</button>}
                </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="meetings-stats-grid">
                <div className="meetings-stat-card">
                    <div className="meetings-stat-card__icon blue">
                        <Video size={22} />
                    </div>
                    <div className="meetings-stat-card__info">
                        <span className="meetings-stat-card__label">Total Scheduled</span>
                        <div className="meetings-stat-card__val">{stats.totalMeetings}</div>
                        <span className="meetings-stat-card__sub">{stats.scheduled} upcoming sessions</span>
                    </div>
                </div>

                <div className="meetings-stat-card">
                    <div className="meetings-stat-card__icon purple">
                        <Handshake size={22} />
                    </div>
                    <div className="meetings-stat-card__info">
                        <span className="meetings-stat-card__label">Client Consultations</span>
                        <div className="meetings-stat-card__val">{stats.clientMeetings}</div>
                        <span className="meetings-stat-card__sub">Linked to active accounts</span>
                    </div>
                </div>

                <div className="meetings-stat-card">
                    <div className="meetings-stat-card__icon amber">
                        <Clock size={22} />
                    </div>
                    <div className="meetings-stat-card__info">
                        <span className="meetings-stat-card__label">Today's Agenda</span>
                        <div className="meetings-stat-card__val">{stats.todayCount}</div>
                        <span className="meetings-stat-card__sub">{stats.todayCount > 0 ? 'Action required today' : 'No calls pending today'}</span>
                    </div>
                </div>

                <div className="meetings-stat-card">
                    <div className="meetings-stat-card__icon green">
                        <ListTodo size={22} />
                    </div>
                    <div className="meetings-stat-card__info">
                        <span className="meetings-stat-card__label">Action Items Pending</span>
                        <div className="meetings-stat-card__val">{stats.pendingActions}</div>
                        <div className="meetings-stat-card__bar">
                            <div
                                className="meetings-stat-card__bar-fill"
                                style={{ width: `${stats.actionCompletionRate}%` }}
                            />
                        </div>
                        <span className="meetings-stat-card__sub">{stats.actionCompletionRate}% deliverables done</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="meetings-tabs-wrapper">
                <div className="meetings-tabs">
                    <button
                        className={`meetings-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => handleTabChange('upcoming')}
                    >
                        <Video size={16} />
                        <span className="meetings-tab-text-full">Upcoming & All Meetings</span>
                        <span className="meetings-tab-text-short">Upcoming</span>
                        <span className="meetings-tab-count">{meetings.length}</span>
                    </button>

                    <button
                        className={`meetings-tab ${activeTab === 'clients' ? 'active' : ''}`}
                        onClick={() => handleTabChange('clients')}
                    >
                        <Handshake size={16} />
                        <span className="meetings-tab-text-full">Client Meetings Hub</span>
                        <span className="meetings-tab-text-short">Client Hub</span>
                        <span className="meetings-tab-count">{clients.length}</span>
                    </button>

                    <button
                        className={`meetings-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                        onClick={() => handleTabChange('calendar')}
                    >
                        <CalendarDays size={16} />
                        <span className="meetings-tab-text-full">Calendar Schedule</span>
                        <span className="meetings-tab-text-short">Calendar</span>
                    </button>

                    <button
                        className={`meetings-tab ${activeTab === 'minutes' ? 'active' : ''}`}
                        onClick={() => handleTabChange('minutes')}
                    >
                        <FileText size={16} />
                        <span className="meetings-tab-text-full">Minutes & Action Items</span>
                        <span className="meetings-tab-text-short">Minutes</span>
                        <span className="meetings-tab-count">{stats.allActionItemsCount}</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: UPCOMING & ALL MEETINGS */}
            {activeTab === 'upcoming' && (
                <div className="meetings-content">
                    {/* Filter & Toolbar */}
                    <div className="meetings-toolbar">
                        <div className="meetings-toolbar__top">
                            <div className="meetings-toolbar__search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by meeting title, client, or project..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* View toggle */}
                            <div className="meetings-view-toggle">
                                <button
                                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="meetings-toolbar__filters">
                            {/* Client selector filter */}
                            <select
                                className="meetings-select meetings-select--client"
                                value={selectedClientFilter}
                                onChange={(e) => setSelectedClientFilter(e.target.value)}
                            >
                                <option value="all">All Clients ({clients.length})</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                                ))}
                            </select>

                            <div className="meetings-toolbar__subfilters">
                                {/* Status filter */}
                                <select
                                    className="meetings-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>

                                {/* Type filter */}
                                <select
                                    className="meetings-select"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    {MEETING_TYPES.map(t => (
                                        <option key={t.label} value={t.label}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Pill if filtered by client */}
                    {selectedClientFilter !== 'all' && (
                        <div className="active-filter-indicator">
                            <span>Filtering meetings for: <strong>{clients.find(c => c.id === selectedClientFilter)?.name || selectedClientFilter}</strong></span>
                            <button onClick={() => setSelectedClientFilter('all')}>
                                Clear Filter <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Meetings List / Grid */}
                    {filteredMeetings.length === 0 ? (
                        <div className="meetings-empty-state">
                            <div className="meetings-empty-state__icon">
                                <Video size={36} />
                            </div>
                            <h3>No meetings found</h3>
                            <p>No scheduled sessions match your current search and filter criteria.</p>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => handleOpenCreateModal(selectedClientFilter !== 'all' ? selectedClientFilter : null)}
                            >
                                Schedule a Meeting
                            </Button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="meetings-cards-grid">
                            {filteredMeetings.map(meeting => {
                                const typeMeta = getTypeMeta(meeting.type);
                                const pendingItems = (meeting.action_items || []).filter(a => !a.completed).length;

                                return (
                                    <div
                                        key={meeting.id}
                                        className="meeting-card"
                                        onClick={() => handleOpenDetailModal(meeting)}
                                    >
                                        <div className="meeting-card__top">
                                            <div className="meeting-card__platform-badge">
                                                <span>{meeting.platform === 'Google Meet' ? '📹 Meet' : meeting.platform === 'Zoom' ? '💻 Zoom' : meeting.platform === 'In-Person' ? '🏢 In-Person' : '👥 Call'}</span>
                                            </div>

                                            <div
                                                className="meeting-card__type-badge"
                                                style={{ color: typeMeta.color, backgroundColor: typeMeta.bg, borderColor: typeMeta.border || typeMeta.color }}
                                            >
                                                {meeting.type}
                                            </div>

                                            <div className="meeting-card__menu">
                                                <button
                                                    onClick={(e) => handleOpenEditModal(meeting, e)}
                                                    className="card-action-btn"
                                                    title="Edit Meeting"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteMeeting(meeting.id, e)}
                                                    className="card-action-btn danger"
                                                    title="Cancel Meeting"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="meeting-card__timing">
                                            <Clock size={14} className="timing-clock" />
                                            <span className="timing-time">{getMeetingTimeBadge(meeting)}</span>
                                            <span className="timing-duration">({meeting.duration} min)</span>
                                        </div>

                                        <h3 className="meeting-card__title">{meeting.title}</h3>

                                        {/* Client & Project Chips */}
                                        <div className="meeting-card__meta-tags">
                                            {meeting.client_name ? (
                                                <div
                                                    className="client-link-pill"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/clients?search=${encodeURIComponent(meeting.client_name)}`);
                                                    }}
                                                    title="View Client Details"
                                                >
                                                    <Avatar name={meeting.client_name} size="xs" />
                                                    <span className="client-name">{meeting.client_name}</span>
                                                    {meeting.client_company && (
                                                        <span className="client-comp">· {meeting.client_company}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="client-link-pill internal">
                                                    <Users size={12} />
                                                    <span>Internal Workspace Team</span>
                                                </div>
                                            )}

                                            {meeting.project_name && (
                                                <div className="project-link-pill">
                                                    <FolderKanban size={12} />
                                                    <span>{meeting.project_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Attendees Avatars */}
                                        <div className="meeting-card__attendees-row">
                                            <div className="attendee-avatars">
                                                {(meeting.attendees || []).slice(0, 4).map((att, i) => (
                                                    <div key={i} className="attendee-avatar-wrap" title={`${att.name} (${att.role || 'Attendee'})`}>
                                                        <Avatar name={att.name} size="xs" />
                                                    </div>
                                                ))}
                                                {(meeting.attendees || []).length > 4 && (
                                                    <div className="attendee-avatar-more">
                                                        +{meeting.attendees.length - 4}
                                                    </div>
                                                )}
                                            </div>

                                            {pendingItems > 0 && (
                                                <div className="action-items-badge" title={`${pendingItems} action items pending`}>
                                                    <ListTodo size={12} />
                                                    <span>{pendingItems} actions</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer with Join Meeting Button */}
                                        <div className="meeting-card__footer" onClick={(e) => e.stopPropagation()}>
                                            {meeting.meeting_link ? (
                                                <a
                                                    href={meeting.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="join-meeting-btn"
                                                >
                                                    <Video size={14} />
                                                    <span>Join Call</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span className="in-person-tag">
                                                    <MapPin size={13} /> {meeting.location || 'In-Person Office'}
                                                </span>
                                            )}

                                            <button
                                                className="view-mom-btn"
                                                onClick={() => handleOpenDetailModal(meeting)}
                                            >
                                                <span>MoM & Agenda</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="meetings-table-wrapper">
                            <table className="meetings-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Subject</th>
                                        <th>Client / Account</th>
                                        <th>Platform</th>
                                        <th>Status</th>
                                        <th>Attendees</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMeetings.map(meeting => (
                                        <tr key={meeting.id} onClick={() => handleOpenDetailModal(meeting)} style={{ cursor: 'pointer' }}>
                                            <td className="m-cell-time">
                                                <div className="table-time-col">
                                                    <span className="date-str">{meeting.date}</span>
                                                    <span className="time-str">{meeting.time} ({meeting.duration}m)</span>
                                                </div>
                                            </td>
                                            <td className="m-cell-subject">
                                                <div className="table-title-col">
                                                    <strong>{meeting.title}</strong>
                                                    <span className="type-tag">{meeting.type}</span>
                                                </div>
                                            </td>
                                            <td className="m-cell-client">
                                                {meeting.client_name ? (
                                                    <div className="table-client-col">
                                                        <Avatar name={meeting.client_name} size="xs" />
                                                        <div>
                                                            <div className="name">{meeting.client_name}</div>
                                                            <div className="company">{meeting.client_company}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Internal</span>
                                                )}
                                            </td>
                                            <td className="m-cell-platform">
                                                <span className="table-platform-pill">{meeting.platform}</span>
                                            </td>
                                            <td className="m-cell-status">
                                                <span className={`status-pill ${meeting.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {meeting.status}
                                                </span>
                                            </td>
                                            <td className="m-cell-attendees">
                                                <div className="attendee-avatars">
                                                    {(meeting.attendees || []).slice(0, 3).map((a, i) => (
                                                        <Avatar key={i} name={a.name} size="xs" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="m-cell-actions" onClick={(e) => e.stopPropagation()}>
                                                <div className="table-action-btns">
                                                    {meeting.meeting_link && (
                                                        <a
                                                            href={meeting.meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="table-link-btn"
                                                            title="Join Video Link"
                                                        >
                                                            <Video size={14} />
                                                        </a>
                                                    )}
                                                    <button
                                                        className="table-icon-btn"
                                                        onClick={(e) => handleOpenEditModal(meeting, e)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="table-icon-btn danger"
                                                        onClick={(e) => handleDeleteMeeting(meeting.id, e)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: CLIENT MEETINGS HUB */}
            {activeTab === 'clients' && (
                <div className="meetings-content">
                    <div className="client-hub-intro">
                        <div>
                            <h2>Client Relationship Consultations</h2>
                            <p>Organize high-touch video calls, milestone reviews, and sales syncs directly linked to your client accounts.</p>
                        </div>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => handleOpenCreateModal()}
                        >
                            Schedule Client Meeting
                        </Button>
                    </div>

                    <div className="client-cards-grid">
                        {clients.map(client => {
                            const clientMeetings = meetings.filter(m => m.client_id === client.id || m.client_name === client.name);
                            const nextMeeting = clientMeetings.find(m => m.status === 'Scheduled');
                            return (
                                <div key={client.id} className="client-hub-card">
                                    <div className="client-hub-card__top">
                                        <div className="client-hub-card__avatar">
                                            <Avatar name={client.name} size="md" />
                                        </div>
                                        <div className="client-hub-card__meta">
                                            <h3 className="client-hub-card__name">{client.name}</h3>
                                            <span className="client-hub-card__company">{client.company}</span>
                                        </div>
                                        <div className="client-hub-card__count">
                                            <span className="count-num">{clientMeetings.length}</span>
                                            <span className="count-label">Sessions</span>
                                        </div>
                                    </div>

                                    <div className="client-hub-card__contact">
                                        {client.email && (
                                            <div className="contact-item">
                                                <Phone size={12} />
                                                <span>{client.phone || client.email}</span>
                                            </div>
                                        )}
                                        {client.address && (
                                            <div className="contact-item">
                                                <MapPin size={12} />
                                                <span>{client.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="client-hub-card__schedule-box">
                                        <div className="schedule-box__header">
                                            <Calendar size={13} />
                                            <span>Next Consultation</span>
                                        </div>
                                        {nextMeeting ? (
                                            <div className="schedule-box__details">
                                                <div className="next-title">{nextMeeting.title}</div>
                                                <div className="next-time">{nextMeeting.date} at {nextMeeting.time} ({nextMeeting.platform})</div>
                                                {nextMeeting.meeting_link && (
                                                    <a
                                                        href={nextMeeting.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="box-join-link"
                                                    >
                                                        Join Room <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="schedule-box__empty">
                                                <span>No upcoming meetings scheduled.</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="client-hub-card__footer">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedClientFilter(client.id);
                                                handleTabChange('upcoming');
                                            }}
                                        >
                                            View {clientMeetings.length} Meetings
                                        </Button>

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon={Plus}
                                            onClick={() => handleOpenCreateModal(client.id)}
                                        >
                                            Book Call
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: CALENDAR VIEW */}
            {activeTab === 'calendar' && (
                <div className="meetings-content">
                    {/* Calendar Month Header */}
                    <div className="calendar-header">
                        <div className="calendar-header__nav">
                            <button
                                className="cal-nav-btn"
                                onClick={() => {
                                    const prev = new Date(currentCalDate);
                                    prev.setMonth(prev.getMonth() - 1);
                                    setCurrentCalDate(prev);
                                }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="cal-month-title">
                                {currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                className="cal-nav-btn"
                                onClick={() => {
                                    const next = new Date(currentCalDate);
                                    next.setMonth(next.getMonth() + 1);
                                    setCurrentCalDate(next);
                                }}
                            >
                                <ChevronRight size={18} />
                            </button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentCalDate(new Date())}
                            >
                                Today
                            </Button>
                        </div>

                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => handleOpenCreateModal()}
                        >
                            Schedule on Calendar
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-month-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="cal-day-header">{day}</div>
                        ))}

                        {(() => {
                            const year = currentCalDate.getFullYear();
                            const month = currentCalDate.getMonth();
                            const firstDayIndex = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const todayStr = new Date().toISOString().split('T')[0];

                            const daysCells = [];

                            // Empty cells before month starts
                            for (let i = 0; i < firstDayIndex; i++) {
                                daysCells.push(<div key={`empty-${i}`} className="cal-day-cell empty" />);
                            }

                            // Month days
                            for (let d = 1; d <= daysInMonth; d++) {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const isToday = dateStr === todayStr;
                                const dayMeetings = meetings.filter(m => m.date === dateStr);

                                daysCells.push(
                                    <div
                                        key={dateStr}
                                        className={`cal-day-cell ${isToday ? 'today' : ''}`}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, date: dateStr }));
                                            handleOpenCreateModal();
                                        }}
                                    >
                                        <div className="cal-day-number">
                                            <span>{d}</span>
                                            {dayMeetings.length > 0 && (
                                                <span className="cal-day-chip-count">{dayMeetings.length}</span>
                                            )}
                                        </div>

                                        <div className="cal-day-events" onClick={(e) => e.stopPropagation()}>
                                            {dayMeetings.slice(0, 3).map(m => {
                                                const typeMeta = getTypeMeta(m.type);
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className="cal-event-pill"
                                                        style={{ borderLeftColor: typeMeta.color }}
                                                        onClick={() => handleOpenDetailModal(m)}
                                                        title={`${m.time} - ${m.title} (${m.client_name || 'Internal'})`}
                                                    >
                                                        <span className="time">{m.time}</span>
                                                        <span className="title">{m.title}</span>
                                                    </div>
                                                );
                                            })}
                                            {dayMeetings.length > 3 && (
                                                <div className="cal-event-more">
                                                    +{dayMeetings.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return daysCells;
                        })()}
                    </div>
                </div>
            )}

            {/* TAB 4: MINUTES & ACTION ITEMS */}
            {activeTab === 'minutes' && (
                <div className="meetings-content">
                    <div className="minutes-overview-header">
                        <div>
                            <h2>Minutes of Meeting & Action Deliverables</h2>
                            <p>Track commitments made across all meetings, assignees, and deadlines to guarantee follow-through.</p>
                        </div>
                    </div>

                    <div className="minutes-action-items-container">
                        <div className="minutes-summary-cards">
                            <div className="min-sum-card">
                                <h3>Total Action Items</h3>
                                <div className="num">{stats.allActionItemsCount}</div>
                            </div>
                            <div className="min-sum-card pending">
                                <h3>Pending Actions</h3>
                                <div className="num">{stats.pendingActions}</div>
                            </div>
                            <div className="min-sum-card done">
                                <h3>Completed Actions</h3>
                                <div className="num">{stats.allActionItemsCount - stats.pendingActions}</div>
                            </div>
                        </div>

                        <div className="action-items-list-wrapper">
                            <h3>Organization-Wide Follow-Up Checklist</h3>
                            <div className="actions-table">
                                {meetings.flatMap(m =>
                                    (m.action_items || []).map(act => ({
                                        ...act,
                                        meetingTitle: m.title,
                                        meetingDate: m.date,
                                        meetingId: m.id,
                                        clientName: m.client_name,
                                        clientCompany: m.client_company
                                    }))
                                ).length === 0 ? (
                                    <div className="empty-actions">No action items recorded yet.</div>
                                ) : (
                                    meetings.flatMap(m =>
                                        (m.action_items || []).map(act => (
                                            <div
                                                key={act.id}
                                                className={`action-item-row ${act.completed ? 'completed' : ''}`}
                                            >
                                                <button
                                                    className="action-check-box"
                                                    onClick={async () => {
                                                        await meetingsService.toggleActionItem(m.id, act.id);
                                                        await loadData();
                                                    }}
                                                >
                                                    {act.completed ? <CheckSquare size={18} className="checked" /> : <Square size={18} />}
                                                </button>

                                                <div className="action-item-main">
                                                    <span className="action-text">{act.text}</span>
                                                    <div className="action-tags">
                                                        <span className="meeting-ref" onClick={() => handleOpenDetailModal(m)}>
                                                            <Video size={11} /> {m.title}
                                                        </span>
                                                        {m.client_name && (
                                                            <span className="client-ref">
                                                                <Handshake size={11} /> {m.client_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="action-assignee-col">
                                                    <Avatar name={act.assignee} size="xs" />
                                                    <span>{act.assignee}</span>
                                                </div>

                                                <div className="action-due-col">
                                                    <Calendar size={13} />
                                                    <span>{act.dueDate}</span>
                                                </div>

                                                <div className={`action-priority-col ${act.priority?.toLowerCase() || 'medium'}`}>
                                                    {act.priority || 'Medium'}
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MEETING MODAL */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={isEditMode ? 'Edit Meeting Details' : 'Schedule New Meeting'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveMeeting} disabled={savingMeeting}>
                            {savingMeeting ? 'Syncing...' : isEditMode ? 'Save Changes' : 'Schedule Meeting'}
                        </Button>
                    </>
                }
            >
                <div className="meeting-form">
                    <div className="form-group">
                        <label className="form-label">Meeting Title / Subject *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Q4 Sprint Planning or Client Demo"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Meeting Type</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {MEETING_TYPES.map(t => (
                                    <option key={t.label} value={t.label}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Link Client Account</label>
                            <select
                                className="form-select"
                                value={formData.client_id}
                                onChange={(e) => handleSelectClientInForm(e.target.value)}
                            >
                                <option value="">Internal Workspace Call (No Client)</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row three-col">
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Start Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Duration</label>
                            <select
                                className="form-select"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={90}>90 minutes</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Platform / Format</label>
                            <select
                                className="form-select"
                                value={formData.platform}
                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                            >
                                {PLATFORMS.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {formData.platform === 'Google Meet' ? (
                        <div className={`google-meet-form-state ${calendarStatus.connected ? 'connected' : ''}`}>
                            <span className="google-meet-form-state__icon">{calendarStatus.connected ? <CalendarCheck size={20} /> : <Unplug size={20} />}</span>
                            <div>
                                <strong>{calendarStatus.connected ? 'Google Meet will be created automatically' : 'Google Calendar is not connected'}</strong>
                                <p>{calendarStatus.connected ? `The event, attendee invitations, and unique Meet link will be created on ${calendarStatus.google_email}.` : 'A workspace administrator must connect Google Calendar to generate a real Meet link.'}</p>
                            </div>
                            {!calendarStatus.connected && calendarStatus.can_connect && <button type="button" onClick={handleConnectCalendar} disabled={calendarConnecting}>{calendarConnecting ? 'Connecting...' : 'Connect'}</button>}
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">Meeting URL / Room Link</label>
                            <div className="url-input-wrap">
                                <input type="url" className="form-input" placeholder="Paste the Zoom or Teams URL" value={formData.meeting_link} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {/* Agenda Builder */}
                    <div className="form-group">
                        <div className="agenda-builder-label">
                            <label className="form-label">Agenda Topics</label>
                            <button
                                type="button"
                                className="add-agenda-btn"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    agendaItems: [...prev.agendaItems, { id: `ag-${Date.now()}`, text: '', timeAllocated: '15m' }]
                                }))}
                            >
                                + Add Topic
                            </button>
                        </div>

                        <div className="agenda-items-builder">
                            {formData.agendaItems.map((item, idx) => (
                                <div key={item.id} className="agenda-builder-row">
                                    <span className="agenda-builder-num">{idx + 1}.</span>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Discussion item..."
                                        value={item.text}
                                        onChange={(e) => {
                                            const updated = [...formData.agendaItems];
                                            updated[idx].text = e.target.value;
                                            setFormData({ ...formData, agendaItems: updated });
                                        }}
                                    />
                                    <input
                                        type="text"
                                        className="form-input time-chip"
                                        style={{ width: '80px' }}
                                        placeholder="15m"
                                        value={item.timeAllocated}
                                        onChange={(e) => {
                                            const updated = [...formData.agendaItems];
                                            updated[idx].timeAllocated = e.target.value;
                                            setFormData({ ...formData, agendaItems: updated });
                                        }}
                                    />
                                    {formData.agendaItems.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-agenda-btn"
                                            onClick={() => {
                                                const updated = formData.agendaItems.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, agendaItems: updated });
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Minutes & Background Notes</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="Add briefing notes, links to specifications, or deliverables..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* MEETING DETAIL & MINUTES MODAL */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={selectedMeeting?.title || 'Meeting Details'}
                footer={
                    <div className="detail-modal-footer">
                        <div className="detail-modal-footer__left">
                            <Button
                                variant="secondary"
                                icon={Copy}
                                onClick={() => handleCopyMinutes(selectedMeeting)}
                            >
                                {copiedLink ? 'Copied MoM!' : 'Copy MoM'}
                            </Button>
                        </div>
                        <div className="detail-modal-footer__right">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDetailModalOpen(false)}
                            >
                                Close
                            </Button>
                            <Button
                                variant="secondary"
                                icon={Pencil}
                                onClick={(e) => handleOpenEditModal(selectedMeeting, e)}
                            >
                                Edit
                            </Button>
                            {selectedMeeting?.meeting_link && (
                                <a
                                    href={selectedMeeting.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="modal-join-btn"
                                >
                                    <Video size={16} />
                                    <span>Join Call</span>
                                </a>
                            )}
                        </div>
                    </div>
                }
            >
                {selectedMeeting && (
                    <div className="meeting-detail-body">
                        {/* Call Banner */}
                        <div className="detail-call-banner">
                            <div className="call-banner-info">
                                <div className="call-timing">
                                    <Clock size={16} />
                                    <span>{getMeetingTimeBadge(selectedMeeting)}</span>
                                    <span className="duration">({selectedMeeting.duration} mins)</span>
                                </div>
                                <div className="call-platform">
                                    <span>Platform: <strong>{selectedMeeting.platform}</strong></span>
                                </div>
                            </div>

                            {selectedMeeting.meeting_link && (
                                <a
                                    href={selectedMeeting.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="banner-join-btn"
                                >
                                    <Video size={16} />
                                    <span>Launch Video Call</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        {/* Linked Client Info Box */}
                        {selectedMeeting.client_name && (
                            <div className="detail-client-banner">
                                <div className="client-banner-header">
                                    <Handshake size={15} />
                                    <span>Linked Client Account</span>
                                </div>
                                <div className="client-banner-content">
                                    <Avatar name={selectedMeeting.client_name} size="md" />
                                    <div className="client-banner-details">
                                        <div className="name">{selectedMeeting.client_name}</div>
                                        <div className="company">{selectedMeeting.client_company}</div>
                                        <div className="contact-sub">
                                            {selectedMeeting.client_email && <span>{selectedMeeting.client_email}</span>}
                                            {selectedMeeting.client_phone && <span> · {selectedMeeting.client_phone}</span>}
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            navigate(`/clients?search=${encodeURIComponent(selectedMeeting.client_name)}`);
                                        }}
                                    >
                                        Client Profile
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Interactive Agenda */}
                        <div className="detail-section">
                            <h4 className="detail-section-title">
                                <ListTodo size={16} />
                                <span>Meeting Agenda</span>
                            </h4>
                            <div className="detail-agenda-list">
                                {(selectedMeeting.agenda || []).map(item => (
                                    <div
                                        key={item.id}
                                        className={`detail-agenda-item ${item.completed ? 'completed' : ''}`}
                                        onClick={() => handleToggleAgenda(item.id)}
                                    >
                                        <button className="agenda-checkbox">
                                            {item.completed ? <CheckCircle2 size={16} className="checked" /> : <Square size={16} />}
                                        </button>
                                        <span className="agenda-text">{item.text}</span>
                                        {item.timeAllocated && (
                                            <span className="agenda-time-pill">{item.timeAllocated}</span>
                                        )}
                                    </div>
                                ))}
                                {(!selectedMeeting.agenda || selectedMeeting.agenda.length === 0) && (
                                    <div className="empty-sub">No agenda items added.</div>
                                )}
                            </div>
                        </div>

                        {/* Minutes of Meeting (MoM) Notes */}
                        <div className="detail-section">
                            <h4 className="detail-section-title">
                                <FileText size={16} />
                                <span>Minutes of Meeting (MoM)</span>
                            </h4>
                            <div className="detail-notes-card">
                                {selectedMeeting.notes ? (
                                    <pre className="notes-content">{selectedMeeting.notes}</pre>
                                ) : (
                                    <div className="empty-sub">No minutes recorded yet. Click Edit to add notes.</div>
                                )}
                            </div>
                        </div>

                        {/* Action Items Deliverables */}
                        <div className="detail-section">
                            <h4 className="detail-section-title">
                                <CheckSquare size={16} />
                                <span>Action Items & Commitments</span>
                            </h4>

                            <div className="detail-actions-list">
                                {(selectedMeeting.action_items || []).map(act => (
                                    <div
                                        key={act.id}
                                        className={`detail-action-card ${act.completed ? 'completed' : ''}`}
                                    >
                                        <button
                                            className="action-checkbox"
                                            onClick={() => handleToggleAction(act.id)}
                                        >
                                            {act.completed ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}
                                        </button>
                                        <div className="action-body">
                                            <span className="action-title">{act.text}</span>
                                            <div className="action-sub">
                                                <span>Assignee: <strong>{act.assignee}</strong></span>
                                                <span>· Due: <strong>{act.dueDate}</strong></span>
                                                <span className={`priority-tag ${act.priority?.toLowerCase() || 'medium'}`}>
                                                    {act.priority || 'Medium'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!selectedMeeting.action_items || selectedMeeting.action_items.length === 0) && (
                                    <div className="empty-sub">No action items assigned for this meeting.</div>
                                )}

                                {/* Add Action Item Form */}
                                <div className="add-action-inline">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add follow-up task..."
                                        value={newActionText}
                                        onChange={(e) => setNewActionText(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '130px' }}
                                        placeholder="Assignee name"
                                        value={newActionAssignee}
                                        onChange={(e) => setNewActionAssignee(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="form-input"
                                        style={{ width: '130px' }}
                                        value={newActionDueDate}
                                        onChange={(e) => setNewActionDueDate(e.target.value)}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleAddActionItem}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Attendees List */}
                        <div className="detail-section">
                            <h4 className="detail-section-title">
                                <Users size={16} />
                                <span>Participants ({selectedMeeting.attendees?.length || 0})</span>
                            </h4>
                            <div className="detail-attendees-list">
                                {(selectedMeeting.attendees || []).map((att, i) => (
                                    <div key={i} className="detail-attendee-chip">
                                        <Avatar name={att.name} size="xs" />
                                        <div className="att-info">
                                            <span className="att-name">{att.name}</span>
                                            <span className="att-role">{att.role || 'Participant'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Meetings;
