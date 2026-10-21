import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    FolderKanban, CheckSquare, Users, DollarSign, Handshake, Briefcase,
    FileText, Video, ChevronRight, ChevronDown, Plus, RefreshCw, ArrowUpRight,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { leadsService } from '../../services/leadsService';
import { financeService } from '../../services/financeService';
import { clientsService } from '../../services/clientsService';
import { hrService } from '../../services/hrService';
import { meetingsService } from '../../services/meetingsService';
import { docsService } from '../../services/docsService';
import { formatCurrency } from '../../utils/helpers';
import { DEPARTMENT_MODULES } from '../../utils/constants';
import './Dashboard.css';

const isDone = (s) => s === 'Done' || s === 'Completed';
const MODULE_COLOR = Object.fromEntries(DEPARTMENT_MODULES.map((mod) => [mod.key, mod.color]));
const shortDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const meetingDate = (mt) => (/^\d{4}-\d{2}-\d{2}$/.test(mt.date) ? new Date(`${mt.date}T${mt.time || '00:00'}`) : new Date(mt.date));
const clockTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const CREATE_ACTIONS = {
    projects: { label: 'New project', hint: 'Plan scope, owners and deadlines', icon: FolderKanban, to: '/projects?tab=projects' },
    tasks: { label: 'New task', hint: 'Assign work to someone on your team', icon: CheckSquare, to: '/tasks?tab=all' },
    leads: { label: 'Add lead', hint: 'Capture a new opportunity', icon: Handshake, to: '/leads?tab=pipeline' },
    finance: { label: 'New invoice', hint: 'Bill a client for work delivered', icon: FileText, to: '/finance?tab=invoices' },
    meetings: { label: 'Schedule meeting', hint: 'Book time with a client or the team', icon: Video, to: '/meetings?tab=upcoming' },
    clients: { label: 'Add client', hint: 'Create a new client profile', icon: Briefcase, to: '/clients?tab=all' },
    hr: { label: 'Add employee', hint: 'Add someone to the directory', icon: Users, to: '/hr?tab=directory' },
    docs: { label: 'New document', hint: 'Write a doc or wiki page', icon: FileText, to: '/docs' },
};

const Dashboard = () => {
    const navigate = useNavigate();
    const activeModules = useSelector((state) => state.access.activeModules);
    const currency = useSelector((state) => state.ui.currency) || 'PKR';
    const workspace = localStorage.getItem('dw-workspace-name') || 'Your workspace';

    const has = useCallback(
        (key) => activeModules.includes(key) || (key === 'clients' && activeModules.includes('support')),
        [activeModules]
    );
    const hasTasks = has('tasks') || has('projects');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const createRef = useRef(null);
    const [data, setData] = useState({
        projects: [], tasks: [], leads: [], transactions: [], invoices: [],
        clients: [], employees: [], leaveRequests: [], meetings: [], docs: [],
    });

    const loadAll = useCallback(async () => {
        const none = Promise.resolve([]);
        const jobs = {
            projects: has('projects') ? projectService.getAll() : none,
            tasks: (has('projects') || has('tasks')) ? projectService.getAllTasks() : none,
            leads: has('leads') ? leadsService.getLeads() : none,
            transactions: has('finance') ? financeService.getTransactions() : none,
            invoices: has('finance') ? financeService.getInvoices() : none,
            clients: has('clients') ? clientsService.getClients() : none,
            employees: has('hr') ? hrService.getEmployees() : none,
            leaveRequests: has('hr') ? hrService.getLeaveRequests() : none,
            meetings: has('meetings') ? meetingsService.getMeetings() : none,
            docs: has('docs') ? docsService.getDocuments() : none,
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

    useEffect(() => {
        if (!createOpen) return;
        const onClick = (e) => { if (createRef.current && !createRef.current.contains(e.target)) setCreateOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setCreateOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [createOpen]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const m = useMemo(() => {
        const now = new Date();
        const today = new Date(now.toDateString());

        const projects = data.projects.filter((p) => p.name !== 'General Operations' && p.name !== 'General Operational');
        const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length;
        const completedProjects = projects.filter((p) => p.status === 'Completed').length;
        const atRisk = projects.filter((p) => p.due_date && new Date(p.due_date) < now && p.status !== 'Completed').length;

        const tasks = data.tasks;
        const doneTasks = tasks.filter((t) => isDone(t.status)).length;
        const openTasks = tasks.length - doneTasks;
        const overdue = tasks.filter((t) => t.deadline && new Date(t.deadline) < today && !isDone(t.status)).length;
        const taskSegments = [
            { name: 'Done', value: doneTasks, color: '#10B981' },
            { name: 'In progress', value: tasks.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length, color: '#0055FE' },
            { name: 'Not started', value: tasks.filter((t) => t.status === 'Not Started' || !t.status).length, color: '#A3ACBA' },
            { name: 'Stuck', value: tasks.filter((t) => t.status === 'Stuck').length, color: '#EF4444' },
        ];

        const leads = data.leads;
        const won = leads.filter((l) => l.stage === 'Closed').length;
        const openLeadList = leads.filter((l) => l.stage !== 'Closed');
        const pipelineValue = openLeadList.reduce((a, b) => a + (Number(b.value) || 0), 0);
        const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
        const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed']
            .map((stage) => ({ stage, count: leads.filter((l) => l.stage === stage).length }));
        const maxStage = Math.max(1, ...stages.map((s) => s.count));

        const tx = data.transactions;
        const income = tx.filter((t) => t.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
        const expense = tx.filter((t) => t.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
        const outstanding = data.invoices.filter((i) => i.status !== 'Paid').reduce((a, b) => a + (Number(b.amount) || 0), 0);
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 });
        }
        const idx = Object.fromEntries(months.map((x, i) => [x.key, i]));
        tx.forEach((t) => {
            if (!t.date) return;
            const d = new Date(t.date);
            const i = idx[`${d.getFullYear()}-${d.getMonth()}`];
            if (i === undefined) return;
            if (t.type === 'income') months[i].income += Number(t.amount) || 0;
            else if (t.type === 'expense') months[i].expense += Number(t.amount) || 0;
        });

        const pendingLeave = data.leaveRequests.filter((l) => (l.status || '').toLowerCase() === 'pending').length;
        const upcomingMeetings = data.meetings
            .filter((mt) => mt.date && !['cancelled', 'completed'].includes((mt.status || '').toLowerCase()))
            .map((mt) => ({ ...mt, when: meetingDate(mt) }))
            .filter((mt) => mt.when >= today)
            .sort((a, b) => a.when - b.when);

        const dueSoon = tasks
            .filter((t) => t.deadline && new Date(t.deadline) >= today && !isDone(t.status))
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);

        return {
            projects, activeProjects, completedProjects, atRisk,
            tasks, doneTasks, openTasks, overdue, taskSegments,
            leads, won, openLeads: openLeadList.length, pipelineValue, conversion, stages, maxStage,
            income, expense, net: income - expense, outstanding, months,
            clients: data.clients, employees: data.employees, pendingLeave,
            meetings: data.meetings, upcomingMeetings, docs: data.docs, dueSoon,
        };
    }, [data]);

    const money = (v) => formatCurrency(v || 0, currency);

    const attention = [
        hasTasks && m.overdue > 0 && { n: m.overdue, text: m.overdue === 1 ? 'overdue task' : 'overdue tasks', to: '/tasks?tab=all' },
        has('projects') && m.atRisk > 0 && { n: m.atRisk, text: m.atRisk === 1 ? 'project past its due date' : 'projects past their due date', to: '/projects?tab=projects' },
        has('hr') && m.pendingLeave > 0 && { n: m.pendingLeave, text: m.pendingLeave === 1 ? 'leave request to review' : 'leave requests to review', to: '/hr?tab=directory' },
    ].filter(Boolean);

    const tiles = [
        has('projects') && {
            key: 'projects', label: 'Active projects', value: m.activeProjects, img: '/assets/project/new/1.png', to: '/projects?tab=overview',
            foot: m.atRisk > 0 ? { warn: true, text: `${m.atRisk} past due date` } : { text: `${m.completedProjects} completed` },
        },
        hasTasks && {
            key: 'tasks', label: 'Open tasks', value: m.openTasks, img: '/assets/project/new/2.png', to: '/tasks?tab=all',
            foot: m.overdue > 0 ? { warn: true, text: `${m.overdue} overdue` } : { text: `${m.doneTasks} completed` },
        },
        has('leads') && {
            key: 'leads', label: 'Pipeline value', value: money(m.pipelineValue), img: '/assets/leads/icons/1.png', to: '/leads?tab=pipeline',
            foot: { text: `${m.openLeads} open · ${m.conversion}% won` },
        },
        has('clients') && {
            key: 'clients', label: 'Clients', value: m.clients.length, img: '/assets/stats/2.png', to: '/clients?tab=all',
            foot: { text: m.clients.length === 1 ? 'account' : 'accounts' },
        },
        has('hr') && {
            key: 'hr', label: 'Team members', value: m.employees.length, img: '/assets/stats/2.png', to: '/hr?tab=directory',
            foot: m.pendingLeave > 0 ? { warn: true, text: `${m.pendingLeave} leave pending` } : { text: 'in the directory' },
        },
        has('meetings') && {
            key: 'meetings', label: 'Upcoming meetings', value: m.upcomingMeetings.length, img: '/assets/stats/3.png', to: '/meetings?tab=upcoming',
            foot: { text: m.upcomingMeetings[0] ? `Next on ${shortDate(m.upcomingMeetings[0].when)}` : 'Nothing scheduled' },
        },
    ].filter(Boolean).slice(0, 4);

    const modules = [
        has('projects') && {
            key: 'projects', label: 'Projects', icon: FolderKanban, to: '/projects?tab=overview',
            note: m.atRisk > 0 ? `${m.atRisk} past due date` : 'Everything on schedule', warn: m.atRisk > 0,
            stats: [{ v: m.activeProjects, l: 'Active' }, { v: m.completedProjects, l: 'Completed' }],
        },
        hasTasks && {
            key: 'tasks', label: 'Tasks', icon: CheckSquare, to: '/tasks?tab=all',
            note: m.overdue > 0 ? `${m.overdue} overdue` : 'Nothing overdue', warn: m.overdue > 0,
            stats: [{ v: m.openTasks, l: 'Open' }, { v: m.doneTasks, l: 'Done' }],
        },
        has('leads') && {
            key: 'leads', label: 'Leads', icon: Handshake, to: '/leads?tab=pipeline',
            note: `${m.conversion}% conversion rate`,
            stats: [{ v: m.openLeads, l: 'Open' }, { v: m.won, l: 'Won' }],
        },
        has('finance') && {
            key: 'finance', label: 'Finance', icon: DollarSign, to: '/finance?tab=dashboard',
            note: m.outstanding > 0 ? `${money(m.outstanding)} in unpaid invoices` : 'All invoices settled',
            stats: [{ v: money(m.income), l: 'Income' }, { v: money(m.expense), l: 'Expenses' }],
        },
        has('clients') && {
            key: 'clients', label: 'Clients', icon: Briefcase, to: '/clients?tab=all',
            note: `${m.clients.length} ${m.clients.length === 1 ? 'account' : 'accounts'} on record`,
            stats: [{ v: m.clients.length, l: 'Clients' }, { v: m.projects.filter((p) => p.status !== 'Completed').length, l: 'Live projects' }],
        },
        has('hr') && {
            key: 'hr', label: 'Human Resources', icon: Users, to: '/hr?tab=directory',
            note: m.pendingLeave > 0 ? `${m.pendingLeave} leave requests waiting` : 'No requests waiting', warn: m.pendingLeave > 0,
            stats: [{ v: m.employees.length, l: 'People' }, { v: m.pendingLeave, l: 'Leave pending' }],
        },
        has('meetings') && {
            key: 'meetings', label: 'Meetings', icon: Video, to: '/meetings?tab=upcoming',
            note: m.upcomingMeetings[0] ? `Next: ${m.upcomingMeetings[0].title || 'Meeting'} · ${shortDate(m.upcomingMeetings[0].when)}` : 'Nothing scheduled',
            stats: [{ v: m.upcomingMeetings.length, l: 'Upcoming' }, { v: m.meetings.length, l: 'Total' }],
        },
        has('docs') && {
            key: 'docs', label: 'Documentation', icon: FileText, to: '/docs',
            note: 'Docs, wikis and templates',
            stats: [{ v: m.docs.length, l: 'Documents' }],
        },
    ].filter(Boolean);

    const createItems = ['projects', 'tasks', 'leads', 'finance', 'meetings', 'clients']
        .filter((k) => (k === 'tasks' ? hasTasks : has(k)))
        .map((k) => ({ key: k, ...CREATE_ACTIONS[k] }));

    const taskTotal = m.tasks.length;
    const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    if (loading) {
        return (
            <div className="dsh">
                <div className="dsh-head">
                    <div>
                        <p className="dsh-head__eyebrow">{workspace} · {dateLine}</p>
                        <h1 className="dsh-head__title">Dashboard</h1>
                    </div>
                </div>
                <div className={`dsh-bento ${has('finance') ? 'has-revenue' : ''}`}>
                    {has('finance') && <div className="dsh-card dsh-revenue dsh-skel" />}
                    {[0, 1, 2, 3].map((i) => <div key={i} className="dsh-card dsh-tile dsh-skel" />)}
                </div>
                <div className="dsh-lower">
                    <div className="dsh-card dsh-skel" style={{ minHeight: 360 }} />
                    <div className="dsh-card dsh-skel" style={{ minHeight: 360 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="dsh">
            <header className="dsh-head">
                <div className="dsh-head__text">
                    <p className="dsh-head__eyebrow">{workspace} · {dateLine}</p>
                    <h1 className="dsh-head__title">Dashboard</h1>
                    <p className="dsh-head__status">
                        {attention.length === 0 ? (
                            'Nothing needs your attention right now.'
                        ) : (
                            <>
                                <span className="dsh-head__status-dot" />
                                {attention.map((a, i) => (
                                    <span key={a.text}>
                                        <button className="dsh-head__status-link" onClick={() => navigate(a.to)}>
                                            <strong>{a.n}</strong> {a.text}
                                        </button>
                                        {i < attention.length - 1 && <span className="dsh-head__sep">, </span>}
                                    </span>
                                ))}
                            </>
                        )}
                    </p>
                </div>

                <div className="dsh-head__actions">
                    <button className="dsh-iconbtn" onClick={handleRefresh} disabled={refreshing} title="Refresh data" aria-label="Refresh data">
                        <RefreshCw size={16} className={refreshing ? 'dsh-spin' : ''} />
                    </button>
                    {createItems.length > 0 && (
                        <div className="dsh-create" ref={createRef}>
                            <button className="dsh-create__btn" onClick={() => setCreateOpen((o) => !o)} aria-expanded={createOpen}>
                                <Plus size={16} />
                                <span>Create</span>
                                <ChevronDown size={15} className={`dsh-create__chev ${createOpen ? 'open' : ''}`} />
                            </button>
                            {createOpen && (
                                <div className="dsh-create__menu" role="menu">
                                    {createItems.map((a) => {
                                        const Icon = a.icon;
                                        return (
                                            <button key={a.key} role="menuitem" className="dsh-create__item" onClick={() => { setCreateOpen(false); navigate(a.to); }}>
                                                <span className="dsh-create__icon"><Icon size={16} /></span>
                                                <span className="dsh-create__text">
                                                    <span className="dsh-create__label">{a.label}</span>
                                                    <span className="dsh-create__hint">{a.hint}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <section className={`dsh-bento ${has('finance') ? 'has-revenue' : ''}`}>
                {has('finance') && (
                    <div className="dsh-card dsh-revenue">
                        <div className="dsh-revenue__top">
                            <div>
                                <p className="dsh-label">Net revenue</p>
                                <p className={`dsh-revenue__value ${m.net < 0 ? 'is-neg' : ''}`}>{money(m.net)}</p>
                            </div>
                            <button className="dsh-link" onClick={() => navigate('/finance?tab=dashboard')}>
                                Finance <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <div className="dsh-revenue__split">
                            <span><i className="dsh-sw dsh-sw--in" /> Income <strong>{money(m.income)}</strong></span>
                            <span><i className="dsh-sw dsh-sw--out" /> Expenses <strong>{money(m.expense)}</strong></span>
                        </div>
                        <div className="dsh-revenue__chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={m.months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="dshIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0055FE" stopOpacity={0.22} />
                                            <stop offset="100%" stopColor="#0055FE" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={6} interval={0} padding={{ left: 18, right: 18 }} />
                                    <Tooltip
                                        cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }}
                                        contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', padding: '8px 12px' }}
                                        labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
                                        formatter={(v, n) => [money(v), n === 'income' ? 'Income' : 'Expenses']}
                                    />
                                    <Area isAnimationActive={false} type="monotone" dataKey="expense" stroke="#A3ACBA" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} activeDot={{ r: 3 }} />
                                    <Area isAnimationActive={false} type="monotone" dataKey="income" stroke="#0055FE" strokeWidth={2} fill="url(#dshIncome)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tiles.map((t) => (
                    <button key={t.key} className="dsh-card dsh-tile" onClick={() => navigate(t.to)}>
                        <div className="dsh-tile__top">
                            <p className="dsh-label">{t.label}</p>
                            <img src={t.img} alt="" className="dsh-tile__img" />
                        </div>
                        <p className="dsh-tile__value">{t.value}</p>
                        <p className={`dsh-tile__foot ${t.foot.warn ? 'is-warn' : ''}`}>
                            {t.foot.warn && <span className="dsh-warn-dot" />}
                            {t.foot.text}
                        </p>
                    </button>
                ))}
            </section>

            <section className="dsh-lower">
                <div className="dsh-card dsh-modules">
                    <div className="dsh-card__head">
                        <h2 className="dsh-card__title">Modules</h2>
                        <span className="dsh-card__meta">{modules.length} active</span>
                    </div>
                    <div className="dsh-modlist">
                        {modules.map((row) => {
                            const Icon = row.icon;
                            const add = CREATE_ACTIONS[row.key];
                            return (
                                <div key={row.key} className="dsh-mod">
                                    <button className="dsh-mod__main" onClick={() => navigate(row.to)}>
                                        <span className="dsh-mod__icon" style={{ color: MODULE_COLOR[row.key] }}><Icon size={17} /></span>
                                        <span className="dsh-mod__info">
                                            <span className="dsh-mod__name">{row.label}</span>
                                            <span className={`dsh-mod__note ${row.warn ? 'is-warn' : ''}`}>{row.note}</span>
                                        </span>
                                        <span className="dsh-mod__stats">
                                            {row.stats.map((s) => (
                                                <span key={s.l} className="dsh-mod__stat">
                                                    <span className="dsh-mod__stat-v">{s.v}</span>
                                                    <span className="dsh-mod__stat-l">{s.l}</span>
                                                </span>
                                            ))}
                                        </span>
                                        <ChevronRight size={16} className="dsh-mod__chev" />
                                    </button>
                                    {add && (
                                        <button className="dsh-mod__add" onClick={() => navigate(add.to)} title={add.label} aria-label={add.label}>
                                            <Plus size={15} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="dsh-side">
                    {hasTasks && (
                        <div className="dsh-card">
                            <div className="dsh-card__head">
                                <h2 className="dsh-card__title">Task progress</h2>
                                <span className="dsh-card__meta">{taskTotal} {taskTotal === 1 ? 'task' : 'tasks'}</span>
                            </div>
                            {taskTotal > 0 ? (
                                <>
                                    <div className="dsh-seg" role="img" aria-label="Task status breakdown">
                                        {m.taskSegments.filter((s) => s.value > 0).map((s) => (
                                            <span key={s.name} style={{ flexGrow: s.value, background: s.color }} title={`${s.name}: ${s.value}`} />
                                        ))}
                                    </div>
                                    <ul className="dsh-seg-legend">
                                        {m.taskSegments.map((s) => (
                                            <li key={s.name}>
                                                <i style={{ background: s.color }} />
                                                <span className="dsh-seg-legend__name">{s.name}</span>
                                                <span className="dsh-seg-legend__val">{s.value}</span>
                                                <span className="dsh-seg-legend__pct">{Math.round((s.value / taskTotal) * 100)}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="dsh-empty">No tasks yet. Create one to start tracking progress.</p>
                            )}
                        </div>
                    )}

                    {hasTasks && (
                        <div className="dsh-card">
                            <div className="dsh-card__head">
                                <h2 className="dsh-card__title">Due soon</h2>
                                <button className="dsh-link" onClick={() => navigate('/tasks?tab=all')}>All tasks <ArrowUpRight size={14} /></button>
                            </div>
                            {m.dueSoon.length > 0 ? (
                                <ul className="dsh-due">
                                    {m.dueSoon.map((t) => {
                                        const d = new Date(t.deadline);
                                        const pr = (t.priority || '').toLowerCase();
                                        return (
                                            <li key={t.id}>
                                                <button className="dsh-due__item" onClick={() => navigate('/tasks?tab=all')}>
                                                    <span className="dsh-due__date">
                                                        <span className="dsh-due__mon">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                        <span className="dsh-due__day">{d.getDate()}</span>
                                                    </span>
                                                    <span className="dsh-due__body">
                                                        <span className="dsh-due__title">{t.title}</span>
                                                        <span className="dsh-due__meta">
                                                            {t.project_name || 'Operational'}
                                                            {pr && <span className={`dsh-due__pr dsh-due__pr--${pr}`}> · {t.priority}</span>}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="dsh-empty">No upcoming deadlines.</p>
                            )}
                        </div>
                    )}

                </div>
            </section>

            {(has('leads') || has('meetings')) && (
                <section className={`dsh-row ${has('leads') && has('meetings') ? 'is-split' : ''}`}>
                    {has('leads') && (
                        <div className="dsh-card">
                            <div className="dsh-card__head">
                                <h2 className="dsh-card__title">Pipeline</h2>
                                <button className="dsh-link" onClick={() => navigate('/leads?tab=pipeline')}>
                                    {m.leads.length} {m.leads.length === 1 ? 'lead' : 'leads'} <ArrowUpRight size={14} />
                                </button>
                            </div>
                            {m.leads.length > 0 ? (
                                <ul className="dsh-stages">
                                    {m.stages.map((s) => (
                                        <li key={s.stage}>
                                            <span className="dsh-stages__name">{s.stage}</span>
                                            <span className="dsh-stages__track">
                                                <span style={{ width: `${(s.count / m.maxStage) * 100}%` }} />
                                            </span>
                                            <strong className="dsh-stages__count">{s.count}</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="dsh-empty">No leads in the pipeline yet.</p>
                            )}
                        </div>
                    )}

                    {has('meetings') && (
                        <div className="dsh-card">
                            <div className="dsh-card__head">
                                <h2 className="dsh-card__title">Up next</h2>
                                <button className="dsh-link" onClick={() => navigate('/meetings?tab=calendar')}>Calendar <ArrowUpRight size={14} /></button>
                            </div>
                            {m.upcomingMeetings.length > 0 ? (
                                <ul className="dsh-due">
                                    {m.upcomingMeetings.slice(0, 4).map((mt) => (
                                        <li key={mt.id || `${mt.title}-${mt.date}`}>
                                            <button className="dsh-due__item" onClick={() => navigate('/meetings?tab=upcoming')}>
                                                <span className="dsh-due__date dsh-due__date--meet">
                                                    <span className="dsh-due__mon">{mt.when.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="dsh-due__day">{mt.when.getDate()}</span>
                                                </span>
                                                <span className="dsh-due__body">
                                                    <span className="dsh-due__title">{mt.title || 'Meeting'}</span>
                                                    <span className="dsh-due__meta">
                                                        {[mt.time ? clockTime(mt.when) : null, mt.client_name || mt.type, mt.platform].filter(Boolean).join(' · ')}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="dsh-empty">No meetings scheduled.</p>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Dashboard;
