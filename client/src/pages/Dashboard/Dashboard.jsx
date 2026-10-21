import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    FolderKanban, CheckSquare, Users, DollarSign, Handshake, Briefcase,
    FileText, Video, ArrowRight, ArrowUpRight, ArrowDownRight, Plus,
    RefreshCw, TrendingUp, CalendarClock, Clock, Target,
    Wallet, CircleDollarSign, Sparkles,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { leadsService } from '../../services/leadsService';
import { financeService } from '../../services/financeService';
import { clientsService } from '../../services/clientsService';
import { hrService } from '../../services/hrService';
import { meetingsService } from '../../services/meetingsService';
import { docsService } from '../../services/docsService';
import { formatCurrency } from '../../utils/helpers';
import './Dashboard.css';

const MODULE_ICON = {
    projects: FolderKanban, tasks: CheckSquare, hr: Users, finance: DollarSign,
    leads: Handshake, clients: Briefcase, docs: FileText, meetings: Video,
};

const isDone = (s) => s === 'Done' || s === 'Completed';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const activeModules = useSelector((state) => state.access.activeModules);
    const currency = useSelector((state) => state.ui.currency) || 'PKR';

    const has = useCallback(
        (key) => activeModules.includes(key) || (key === 'clients' && activeModules.includes('support')),
        [activeModules]
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        projects: [], tasks: [], leads: [], transactions: [], invoices: [],
        clients: [], employees: [], leaveRequests: [], meetings: [], docs: [],
    });

    const loadAll = useCallback(async () => {
        const jobs = {
            projects: has('projects') ? projectService.getAll() : Promise.resolve([]),
            tasks: (has('projects') || has('tasks')) ? projectService.getAllTasks() : Promise.resolve([]),
            leads: has('leads') ? leadsService.getLeads() : Promise.resolve([]),
            transactions: has('finance') ? financeService.getTransactions() : Promise.resolve([]),
            invoices: has('finance') ? financeService.getInvoices() : Promise.resolve([]),
            clients: has('clients') ? clientsService.getClients() : Promise.resolve([]),
            employees: has('hr') ? hrService.getEmployees() : Promise.resolve([]),
            leaveRequests: has('hr') ? hrService.getLeaveRequests() : Promise.resolve([]),
            meetings: has('meetings') ? meetingsService.getMeetings() : Promise.resolve([]),
            docs: has('docs') ? docsService.getDocuments() : Promise.resolve([]),
        };
        const keys = Object.keys(jobs);
        const settled = await Promise.allSettled(keys.map((k) => jobs[k]));
        const next = {};
        settled.forEach((r, i) => { next[keys[i]] = r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []; });
        setData(next);
    }, [has]);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            await loadAll();
            if (alive) setLoading(false);
        })();
        return () => { alive = false; };
    }, [loadAll]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    // ---- Derived metrics ----
    const m = useMemo(() => {
        const now = new Date();

        const projects = (data.projects || []).filter((p) => p.name !== 'General Operations' && p.name !== 'General Operational');
        const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length;
        const completedProjects = projects.filter((p) => p.status === 'Completed').length;
        const atRiskProjects = projects.filter((p) => p.due_date && new Date(p.due_date) < now && p.status !== 'Completed').length;

        const tasks = data.tasks || [];
        const doneTasks = tasks.filter((t) => isDone(t.status)).length;
        const openTasks = tasks.length - doneTasks;
        const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && !isDone(t.status)).length;
        const taskBuckets = [
            { name: 'Done', value: doneTasks, color: '#10B981' },
            { name: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length, color: '#3B82F6' },
            { name: 'Not Started', value: tasks.filter((t) => t.status === 'Not Started' || !t.status).length, color: '#94A3B8' },
            { name: 'Stuck', value: tasks.filter((t) => t.status === 'Stuck').length, color: '#EF4444' },
        ].filter((b) => b.value > 0);

        const leads = data.leads || [];
        const wonLeads = leads.filter((l) => l.stage === 'Closed').length;
        const openLeads = leads.filter((l) => l.stage !== 'Closed').length;
        const pipelineValue = leads.filter((l) => l.stage !== 'Closed').reduce((a, b) => a + (Number(b.value) || 0), 0);
        const conversion = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;
        const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed']
            .map((stage) => ({ stage, count: leads.filter((l) => l.stage === stage).length }));
        const maxStage = Math.max(1, ...leadStages.map((s) => s.count));

        const transactions = data.transactions || [];
        const income = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
        const expense = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
        const net = income - expense;
        const invoices = data.invoices || [];
        const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((a, b) => a + (Number(b.amount) || 0), 0);

        // Revenue trend — last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 });
        }
        const mIndex = Object.fromEntries(months.map((x, i) => [x.key, i]));
        transactions.forEach((t) => {
            if (!t.date) return;
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (key in mIndex) {
                if (t.type === 'income') months[mIndex[key]].income += Number(t.amount) || 0;
                else if (t.type === 'expense') months[mIndex[key]].expense += Number(t.amount) || 0;
            }
        });

        const clients = data.clients || [];
        const employees = data.employees || [];
        const pendingLeave = (data.leaveRequests || []).filter((l) => (l.status || '').toLowerCase() === 'pending').length;

        const meetings = data.meetings || [];
        const upcoming = meetings
            .filter((mt) => mt.date && new Date(mt.date) >= new Date(now.toDateString()))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        const nextMeeting = upcoming[0] || null;

        const docs = data.docs || [];

        const upcomingDeadlines = tasks
            .filter((t) => t.deadline && new Date(t.deadline) >= new Date(now.toDateString()) && !isDone(t.status))
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);

        return {
            projects, activeProjects, completedProjects, atRiskProjects,
            tasks, doneTasks, openTasks, overdueTasks, taskBuckets,
            leads, wonLeads, openLeads, pipelineValue, conversion, leadStages, maxStage,
            income, expense, net, outstanding, revMonths: months,
            clients, employees, pendingLeave,
            meetings, upcoming, nextMeeting, docs, upcomingDeadlines,
        };
    }, [data]);

    const money = (v) => formatCurrency(v || 0, currency);

    // ---- Hero KPIs (prioritized, max 4 from active modules) ----
    const kpiPool = [
        has('projects') && { key: 'proj', label: 'Active Projects', value: m.activeProjects, sub: `${m.completedProjects} completed`, icon: FolderKanban, tone: 'blue' },
        (has('tasks') || has('projects')) && { key: 'task', label: 'Open Tasks', value: m.openTasks, sub: m.overdueTasks > 0 ? `${m.overdueTasks} overdue` : `${m.doneTasks} done`, icon: CheckSquare, tone: m.overdueTasks > 0 ? 'amber' : 'indigo', down: m.overdueTasks > 0 },
        has('leads') && { key: 'lead', label: 'Pipeline Value', value: money(m.pipelineValue), sub: `${m.openLeads} open leads`, icon: Target, tone: 'violet' },
        has('finance') && { key: 'rev', label: 'Net Revenue', value: money(m.net), sub: `${money(m.income)} in`, icon: Wallet, tone: m.net >= 0 ? 'green' : 'red', down: m.net < 0 },
        has('clients') && { key: 'client', label: 'Clients', value: m.clients.length, sub: 'total accounts', icon: Briefcase, tone: 'rose' },
        has('hr') && { key: 'hr', label: 'Team Size', value: m.employees.length, sub: m.pendingLeave > 0 ? `${m.pendingLeave} leave pending` : 'employees', icon: Users, tone: 'violet' },
        has('meetings') && { key: 'meet', label: 'Upcoming Meetings', value: m.upcoming.length, sub: m.nextMeeting ? `next ${new Date(m.nextMeeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'none scheduled', icon: Video, tone: 'indigo' },
    ].filter(Boolean);
    const kpis = kpiPool.slice(0, 4);

    // ---- Quick actions ----
    const actionPool = [
        has('projects') && { label: 'New Project', icon: FolderKanban, to: '/projects?tab=projects' },
        (has('tasks') || has('projects')) && { label: 'New Task', icon: CheckSquare, to: '/tasks?tab=all' },
        has('leads') && { label: 'Add Lead', icon: Handshake, to: '/leads?tab=pipeline' },
        has('finance') && { label: 'New Invoice', icon: FileText, to: '/finance?tab=invoices' },
        has('meetings') && { label: 'Schedule Meeting', icon: Video, to: '/meetings?tab=upcoming' },
        has('clients') && { label: 'Add Client', icon: Briefcase, to: '/clients?tab=all' },
    ].filter(Boolean);

    // ---- Module overview cards ----
    const moduleCards = [
        has('projects') && {
            key: 'projects', label: 'Project Management', to: '/projects?tab=overview',
            stats: [
                { label: 'Active', value: m.activeProjects },
                { label: 'Completed', value: m.completedProjects },
                { label: 'At Risk', value: m.atRiskProjects, danger: m.atRiskProjects > 0 },
            ],
        },
        (has('tasks') || has('projects')) && {
            key: 'tasks', label: 'Task Management', to: '/tasks?tab=all',
            stats: [
                { label: 'Open', value: m.openTasks },
                { label: 'Done', value: m.doneTasks },
                { label: 'Overdue', value: m.overdueTasks, danger: m.overdueTasks > 0 },
            ],
        },
        has('leads') && {
            key: 'leads', label: 'Leads Management', to: '/leads?tab=pipeline',
            stats: [
                { label: 'Open', value: m.openLeads },
                { label: 'Won', value: m.wonLeads },
                { label: 'Conv.', value: `${m.conversion}%` },
            ],
        },
        has('finance') && {
            key: 'finance', label: 'Finance', to: '/finance?tab=dashboard',
            stats: [
                { label: 'Income', value: money(m.income) },
                { label: 'Expense', value: money(m.expense) },
                { label: 'Outstanding', value: money(m.outstanding) },
            ],
        },
        has('clients') && {
            key: 'clients', label: 'Client Management', to: '/clients?tab=all',
            stats: [
                { label: 'Clients', value: m.clients.length },
                { label: 'Active Projects', value: m.projects.filter((p) => p.status !== 'Completed').length },
            ],
        },
        has('hr') && {
            key: 'hr', label: 'Human Resources', to: '/hr?tab=directory',
            stats: [
                { label: 'Employees', value: m.employees.length },
                { label: 'Leave Pending', value: m.pendingLeave, danger: m.pendingLeave > 0 },
            ],
        },
        has('meetings') && {
            key: 'meetings', label: 'Meetings', to: '/meetings?tab=upcoming',
            stats: [
                { label: 'Upcoming', value: m.upcoming.length },
                { label: 'Total', value: m.meetings.length },
            ],
        },
        has('docs') && {
            key: 'docs', label: 'Documentation', to: '/docs',
            stats: [
                { label: 'Documents', value: m.docs.length },
            ],
        },
    ].filter(Boolean);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    })();
    const firstName = (user?.name || 'there').split(' ')[0];
    const toneClass = (t) => `dash-kpi--${t}`;

    if (loading) {
        return (
            <div className="dash">
                <div className="dash__header">
                    <div>
                        <h1 className="dash__title">{greeting}, {firstName}</h1>
                        <p className="dash__subtitle">Loading your workspace overview…</p>
                    </div>
                </div>
                <div className="dash__kpis">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="dash-kpi dash-skeleton" />)}
                </div>
                <div className="dash__charts">
                    <div className="dash-card dash-skeleton" style={{ height: 320 }} />
                    <div className="dash-card dash-skeleton" style={{ height: 320 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="dash">
            {/* Header */}
            <div className="dash__header">
                <div>
                    <div className="dash__badge"><Sparkles size={13} /> Workspace Overview</div>
                    <h1 className="dash__title">{greeting}, {firstName}</h1>
                    <p className="dash__subtitle">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        {' · '}Here's what's happening across your modules.
                    </p>
                </div>
                <button className="dash__refresh" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {/* KPI cards */}
            <div className="dash__kpis">
                {kpis.map((k) => {
                    const Icon = k.icon;
                    return (
                        <div key={k.key} className={`dash-kpi ${toneClass(k.tone)}`}>
                            <div className="dash-kpi__top">
                                <span className="dash-kpi__icon"><Icon size={18} /></span>
                                {k.down ? <ArrowDownRight size={16} className="dash-kpi__trend down" /> : <ArrowUpRight size={16} className="dash-kpi__trend up" />}
                            </div>
                            <div className="dash-kpi__value">{k.value}</div>
                            <div className="dash-kpi__label">{k.label}</div>
                            <div className="dash-kpi__sub">{k.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick actions */}
            {actionPool.length > 0 && (
                <div className="dash-card dash__actions">
                    <div className="dash-card__head">
                        <h3 className="dash-card__title"><Plus size={15} /> Quick Actions</h3>
                    </div>
                    <div className="dash__actions-row">
                        {actionPool.map((a) => {
                            const Icon = a.icon;
                            return (
                                <button key={a.label} className="dash-action" onClick={() => navigate(a.to)}>
                                    <span className="dash-action__icon"><Icon size={16} /></span>
                                    <span>{a.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="dash__charts">
                {has('finance') && (
                    <div className="dash-card">
                        <div className="dash-card__head">
                            <h3 className="dash-card__title"><TrendingUp size={15} /> Revenue Trend</h3>
                            <button className="dash-card__link" onClick={() => navigate('/finance?tab=dashboard')}>Open <ArrowRight size={13} /></button>
                        </div>
                        <div className="dash-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={m.revMonths} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="dashInc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="dashExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={48} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 12, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }} formatter={(v, n) => [money(v), n === 'income' ? 'Income' : 'Expense']} />
                                    <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} fill="url(#dashInc)" />
                                    <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#dashExp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="dash-legend">
                            <span><i style={{ background: 'var(--success)' }} /> Income</span>
                            <span><i style={{ background: 'var(--danger)' }} /> Expense</span>
                        </div>
                    </div>
                )}

                {(has('tasks') || has('projects')) && (
                    <div className="dash-card">
                        <div className="dash-card__head">
                            <h3 className="dash-card__title"><CheckSquare size={15} /> Task Breakdown</h3>
                            <button className="dash-card__link" onClick={() => navigate('/tasks?tab=analytics')}>Open <ArrowRight size={13} /></button>
                        </div>
                        {m.tasks.length > 0 ? (
                            <div className="dash-donut-wrap">
                                <div className="dash-donut">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={m.taskBuckets} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                                                {m.taskBuckets.map((b) => <Cell key={b.name} fill={b.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 12, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="dash-donut__center">
                                        <strong>{m.tasks.length}</strong>
                                        <span>tasks</span>
                                    </div>
                                </div>
                                <div className="dash-donut-legend">
                                    {m.taskBuckets.map((b) => (
                                        <div key={b.name} className="dash-donut-legend__item">
                                            <i style={{ background: b.color }} />
                                            <span>{b.name}</span>
                                            <strong>{b.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="dash-empty"><CheckSquare size={26} /><p>No tasks yet</p></div>
                        )}
                    </div>
                )}
            </div>

            {/* Module overview + side panel */}
            <div className="dash__lower">
                <div className="dash-card dash__modules">
                    <div className="dash-card__head">
                        <h3 className="dash-card__title"><Target size={15} /> Module Overviews</h3>
                    </div>
                    <div className="dash__modules-grid">
                        {moduleCards.map((c) => {
                            const Icon = MODULE_ICON[c.key] || FileText;
                            return (
                                <button key={c.key} className="dash-mod" onClick={() => navigate(c.to)}>
                                    <div className="dash-mod__head">
                                        <span className={`dash-mod__icon dash-mod__icon--${c.key}`}><Icon size={16} /></span>
                                        <span className="dash-mod__name">{c.label}</span>
                                        <ArrowRight size={14} className="dash-mod__arrow" />
                                    </div>
                                    <div className="dash-mod__stats">
                                        {c.stats.map((s) => (
                                            <div key={s.label} className="dash-mod__stat">
                                                <span className={`dash-mod__stat-val ${s.danger ? 'is-danger' : ''}`}>{s.value}</span>
                                                <span className="dash-mod__stat-label">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="dash__side">
                    {/* Leads funnel */}
                    {has('leads') && m.leads.length > 0 && (
                        <div className="dash-card">
                            <div className="dash-card__head">
                                <h3 className="dash-card__title"><Handshake size={15} /> Lead Pipeline</h3>
                                <button className="dash-card__link" onClick={() => navigate('/leads?tab=pipeline')}>Open <ArrowRight size={13} /></button>
                            </div>
                            <div className="dash-funnel">
                                {m.leadStages.map((s) => (
                                    <div key={s.stage} className="dash-funnel__row">
                                        <span className="dash-funnel__label">{s.stage}</span>
                                        <div className="dash-funnel__bar">
                                            <div className="dash-funnel__fill" style={{ width: `${Math.round((s.count / m.maxStage) * 100)}%` }} />
                                        </div>
                                        <span className="dash-funnel__count">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming deadlines */}
                    {(has('tasks') || has('projects')) && (
                        <div className="dash-card">
                            <div className="dash-card__head">
                                <h3 className="dash-card__title"><CalendarClock size={15} /> Upcoming Deadlines</h3>
                            </div>
                            {m.upcomingDeadlines.length > 0 ? (
                                <div className="dash-list">
                                    {m.upcomingDeadlines.map((t) => (
                                        <div key={t.id} className="dash-list__item" onClick={() => navigate('/tasks?tab=all')}>
                                            <span className={`dash-dot dash-dot--${(t.priority || 'medium').toLowerCase()}`} />
                                            <div className="dash-list__body">
                                                <span className="dash-list__title">{t.title}</span>
                                                {t.project_name && <span className="dash-list__meta">{t.project_name}</span>}
                                            </div>
                                            <span className="dash-list__date"><Clock size={11} /> {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="dash-empty"><CalendarClock size={24} /><p>No upcoming deadlines</p></div>
                            )}
                        </div>
                    )}

                    {/* Finance snapshot */}
                    {has('finance') && (
                        <div className="dash-card">
                            <div className="dash-card__head">
                                <h3 className="dash-card__title"><CircleDollarSign size={15} /> Finance Snapshot</h3>
                            </div>
                            <div className="dash-fin">
                                <div className="dash-fin__row"><span><ArrowDownRight size={14} color="var(--success)" /> Income</span><strong>{money(m.income)}</strong></div>
                                <div className="dash-fin__row"><span><ArrowUpRight size={14} color="var(--danger)" /> Expenses</span><strong>{money(m.expense)}</strong></div>
                                <div className="dash-fin__row dash-fin__row--net"><span>Net Balance</span><strong className={m.net >= 0 ? 'pos' : 'neg'}>{money(m.net)}</strong></div>
                                <div className="dash-fin__row"><span>Outstanding Invoices</span><strong>{money(m.outstanding)}</strong></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
