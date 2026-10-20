import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/uiSlice';
import { authService } from '../../services/authService';
import { superAdminService } from '../../services/superAdminService';
import {
    Shield, Plus, RefreshCw, KeyRound, Power, Users, Building2,
    LogOut, Loader2, X, Eye, EyeOff, Copy, LayoutDashboard,
    Search, ShieldCheck, ChevronRight, UserRoundCog, CircleCheck,
} from 'lucide-react';
import './SuperAdmin.css';

const SuperAdmin = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetId, setResetId] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetSubmittingId, setResetSubmittingId] = useState(null);
    const [membersWorkspace, setMembersWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberResetId, setMemberResetId] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superAdminService.listWorkspaces();
            setWorkspaces(res.workspaces || []);
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { load(); }, [load]);

    const genPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) password += chars[Math.floor(Math.random() * chars.length)];
        return `${password}@1`;
    };

    const openCreateWorkspace = () => {
        setForm({ name: '', email: '', password: genPassword() });
        setShowPassword(false);
        setIsCreateOpen(true);
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!form.name || !form.email || !form.password) {
            dispatch(addToast({ title: 'Validation', message: 'All fields are required.', type: 'warning' }));
            return;
        }
        setSubmitting(true);
        try {
            await superAdminService.createWorkspace(form);
            dispatch(addToast({ title: 'Workspace Created', message: `${form.name} is ready. Share the credentials with the admin.`, type: 'success' }));
            setIsCreateOpen(false);
            setForm({ name: '', email: '', password: '' });
            await load();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = async (target, closeMemberReset = false) => {
        if (!resetPassword || resetPassword.length < 8) {
            dispatch(addToast({ title: 'Validation', message: 'Password must be at least 8 characters.', type: 'warning' }));
            return;
        }
        if (!/[A-Za-z]/.test(resetPassword) || !/\d/.test(resetPassword)) {
            dispatch(addToast({ title: 'Validation', message: 'Password must include at least one letter and one number.', type: 'warning' }));
            return;
        }
        setResetSubmittingId(target.id);
        try {
            await superAdminService.resetPassword(target.id, resetPassword);
            dispatch(addToast({
                title: 'Password Updated',
                message: `${target.name || target.email}'s password was changed by the Super Admin.`,
                type: 'success',
            }));
            if (closeMemberReset) setMemberResetId(null);
            else setResetId(null);
            setResetPassword('');
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        } finally {
            setResetSubmittingId(null);
        }
    };

    const openWorkspaceMembers = async (workspace) => {
        setMembersWorkspace(workspace);
        setMembers([]);
        setMemberResetId(null);
        setResetId(null);
        setResetPassword('');
        setMembersLoading(true);
        try {
            const response = await superAdminService.listWorkspaceMembers(workspace.id);
            setMembers(response.members || []);
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
            setMembersWorkspace(null);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleToggle = async (workspace) => {
        try {
            await superAdminService.toggleWorkspace(workspace.id, !workspace.disabled);
            dispatch(addToast({
                title: workspace.disabled ? 'Workspace Enabled' : 'Workspace Disabled',
                message: `${workspace.name} ${workspace.disabled ? 'can now log in.' : 'has been suspended.'}`,
                type: 'success',
            }));
            await load();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
    };

    const copyCreds = (workspace) => {
        navigator.clipboard?.writeText(`Email: ${workspace.email}`);
        dispatch(addToast({ title: 'Copied', message: 'Email copied to clipboard.', type: 'info' }));
    };

    const filteredWorkspaces = workspaces.filter((workspace) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return workspace.name?.toLowerCase().includes(query) || workspace.email?.toLowerCase().includes(query);
    });

    const activeCount = workspaces.filter((workspace) => !workspace.disabled).length;
    const suspendedCount = workspaces.length - activeCount;
    const memberCount = workspaces.reduce((sum, workspace) => sum + (workspace.member_count || 0), 0);

    const renderWorkspaceList = (items) => {
        if (loading) {
            return <div className="sa-loading"><Loader2 size={22} className="sa-spin" /> Loading workspaces...</div>;
        }

        if (items.length === 0) {
            return (
                <div className="sa-empty">
                    <span className="sa-empty__icon"><Building2 size={24} /></span>
                    <strong>{searchQuery ? 'No matching workspaces' : 'No workspaces yet'}</strong>
                    <p>{searchQuery ? 'Try another name or administrator email.' : 'Create your first admin workspace to get started.'}</p>
                    {!searchQuery && <button className="sa-btn sa-btn--primary" onClick={openCreateWorkspace}><Plus size={16} /> Create workspace</button>}
                </div>
            );
        }

        return (
            <div className="sa-list">
                {items.map((workspace) => (
                    <article key={workspace.id} className={`sa-card ${workspace.disabled ? 'sa-card--disabled' : ''}`}>
                        <div className="sa-card__main">
                            <div className="sa-card__avatar">{(workspace.name || '?').charAt(0).toUpperCase()}</div>
                            <div className="sa-card__info">
                                <div className="sa-card__title-row">
                                    <strong>{workspace.name}</strong>
                                    <span className={`sa-status ${workspace.disabled ? 'sa-status--off' : 'sa-status--active'}`}>
                                        <i /> {workspace.disabled ? 'Suspended' : 'Active'}
                                    </span>
                                </div>
                                <span>{workspace.email}</span>
                                <small>{workspace.member_count} member{workspace.member_count === 1 ? '' : 's'} <b>·</b> Created {new Date(workspace.created_at).toLocaleDateString()}</small>
                            </div>
                        </div>
                        <div className="sa-card__actions" aria-label={`Actions for ${workspace.name}`}>
                            <button className="sa-icon-btn sa-icon-btn--copy" title="Copy administrator email" aria-label="Copy administrator email" onClick={() => copyCreds(workspace)}><Copy size={15} /></button>
                            <button className="sa-icon-btn" title="Manage workspace members" aria-label="Manage workspace members" onClick={() => openWorkspaceMembers(workspace)}><Users size={15} /></button>
                            <button className="sa-icon-btn sa-icon-btn--key" title="Set administrator password" aria-label="Set administrator password" onClick={() => { setResetId(workspace.id); setResetPassword(genPassword()); }}><KeyRound size={15} /></button>
                            <button className={`sa-icon-btn ${workspace.disabled ? 'sa-icon-btn--on' : 'sa-icon-btn--off'}`} title={workspace.disabled ? 'Enable workspace' : 'Suspend workspace'} aria-label={workspace.disabled ? 'Enable workspace' : 'Suspend workspace'} onClick={() => handleToggle(workspace)}><Power size={15} /></button>
                        </div>

                        {resetId === workspace.id && (
                            <div className="sa-reset">
                                <div className="sa-reset__copy"><KeyRound size={16} /><div><strong>Set an emergency password</strong><span>The workspace admin should change it after signing in.</span></div></div>
                                <input type="text" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="New password" autoComplete="new-password" />
                                <button className="sa-btn sa-btn--primary sa-btn--sm" disabled={resetSubmittingId === workspace.id} onClick={() => handleReset(workspace)}>
                                    {resetSubmittingId === workspace.id ? <><Loader2 size={14} className="sa-spin" /> Updating...</> : 'Update'}
                                </button>
                                <button className="sa-btn sa-btn--ghost sa-btn--sm" disabled={resetSubmittingId === workspace.id} onClick={() => { setResetId(null); setResetPassword(''); }}>Cancel</button>
                            </div>
                        )}
                    </article>
                ))}
            </div>
        );
    };

    const viewTitle = activeView === 'overview' ? 'Workspace overview' : activeView === 'workspaces' ? 'Admin workspaces' : 'Security & access';
    const viewSubtitle = activeView === 'overview'
        ? 'Monitor your platform and manage workspace administrators.'
        : activeView === 'workspaces'
            ? 'Provision, search, and control customer workspaces.'
            : 'Review how privileged workspace access is protected.';

    return (
        <div className="sa-root">
            <aside className="sa-sidebar">
                <div className="sa-sidebar__brand">
                    <span className="sa-sidebar__logo"><Shield size={20} /></span>
                    <div><strong>DevelopWork</strong><span>Control center</span></div>
                </div>

                <nav className="sa-nav" aria-label="Super admin navigation">
                    <span className="sa-nav__label">Console</span>
                    <button className={activeView === 'overview' ? 'active' : ''} onClick={() => setActiveView('overview')}>
                        <LayoutDashboard size={18} /><span>Overview</span><ChevronRight size={14} className="sa-nav__arrow" />
                    </button>
                    <button className={activeView === 'workspaces' ? 'active' : ''} onClick={() => setActiveView('workspaces')}>
                        <Building2 size={18} /><span>Workspaces</span><span className="sa-nav__count">{workspaces.length}</span>
                    </button>
                    <button className={activeView === 'security' ? 'active' : ''} onClick={() => setActiveView('security')}>
                        <ShieldCheck size={18} /><span>Security & access</span><ChevronRight size={14} className="sa-nav__arrow" />
                    </button>
                </nav>

                <div className="sa-sidebar__footer">
                    <div className="sa-admin-profile">
                        <span className="sa-admin-profile__avatar"><UserRoundCog size={18} /></span>
                        <div><strong>{user?.name || 'Super Admin'}</strong><span>Super administrator</span></div>
                    </div>
                    <button className="sa-sidebar__logout" onClick={() => authService.signOut()} title="Log out" aria-label="Log out"><LogOut size={17} /></button>
                </div>
            </aside>

            <main className="sa-main">
                <header className="sa-topbar">
                    <div>
                        <div className="sa-breadcrumb">Super admin <ChevronRight size={13} /> <span>{viewTitle}</span></div>
                        <h1>{viewTitle}</h1>
                        <p>{viewSubtitle}</p>
                    </div>
                    {activeView !== 'security' && <button className="sa-btn sa-btn--primary" onClick={openCreateWorkspace}><Plus size={16} /> Create workspace</button>}
                </header>

                <div className="sa-body">
                    {activeView === 'overview' && (
                        <>
                            <section className="sa-stats" aria-label="Platform statistics">
                                <div className="sa-stat"><span className="sa-stat__icon sa-stat__icon--blue"><Building2 size={19} /></span><div><small>Workspaces</small><strong>{workspaces.length}</strong><span>Provisioned accounts</span></div></div>
                                <div className="sa-stat"><span className="sa-stat__icon sa-stat__icon--violet"><Users size={19} /></span><div><small>Total members</small><strong>{memberCount}</strong><span>Across all workspaces</span></div></div>
                                <div className="sa-stat"><span className="sa-stat__icon sa-stat__icon--green"><CircleCheck size={19} /></span><div><small>Active workspaces</small><strong>{activeCount}</strong><span>{suspendedCount} suspended</span></div></div>
                            </section>

                            <section className="sa-overview-grid">
                                <div className="sa-panel">
                                    <div className="sa-panel__head"><div><h2>Workspace status</h2><p>Current account availability</p></div></div>
                                    <div className="sa-health-row"><span><i className="active" /> Active</span><strong>{activeCount}</strong></div>
                                    <div className="sa-health-row"><span><i className="suspended" /> Suspended</span><strong>{suspendedCount}</strong></div>
                                    <div className="sa-health-row"><span><i className="members" /> Members</span><strong>{memberCount}</strong></div>
                                </div>
                                <div className="sa-panel sa-quick-panel">
                                    <div className="sa-panel__head"><div><h2>Quick actions</h2><p>Common administration tasks</p></div></div>
                                    <button onClick={openCreateWorkspace}><span><Plus size={17} /></span><div><strong>Create workspace</strong><small>Provision a new administrator</small></div><ChevronRight size={15} /></button>
                                    <button onClick={() => { setActiveView('workspaces'); setSearchQuery(''); }}><span><Search size={17} /></span><div><strong>Find workspace</strong><small>Search by name or email</small></div><ChevronRight size={15} /></button>
                                </div>
                            </section>

                            <section className="sa-section">
                                <div className="sa-section__head"><div><h2>Recent workspaces</h2><p>Newest administrator accounts</p></div><button onClick={() => setActiveView('workspaces')}>View all <ChevronRight size={14} /></button></div>
                                {renderWorkspaceList(workspaces.slice(0, 3))}
                            </section>
                        </>
                    )}

                    {activeView === 'workspaces' && (
                        <section className="sa-section">
                            <div className="sa-workspace-toolbar">
                                <div className="sa-search"><Search size={16} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search workspaces or admin email..." aria-label="Search workspaces" />{searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}</div>
                                <button className="sa-btn sa-btn--ghost" onClick={load}><RefreshCw size={15} /> Refresh</button>
                            </div>
                            <div className="sa-results-meta"><span>{filteredWorkspaces.length} workspace{filteredWorkspaces.length === 1 ? '' : 's'}</span><span>{activeCount} active</span></div>
                            {renderWorkspaceList(filteredWorkspaces)}
                        </section>
                    )}

                    {activeView === 'security' && (
                        <section className="sa-security-grid">
                            <article className="sa-security-card"><span className="sa-security-card__icon blue"><ShieldCheck size={20} /></span><div><h2>Super-admin boundary</h2><p>Only authenticated super administrators can provision workspaces or set emergency credentials for workspace members.</p></div><span className="sa-security-card__status"><CircleCheck size={14} /> Enforced</span></article>
                            <article className="sa-security-card"><span className="sa-security-card__icon violet"><Building2 size={20} /></span><div><h2>Workspace isolation</h2><p>Each administrator owns an isolated tenant containing their members and operational data.</p></div><span className="sa-security-card__status"><CircleCheck size={14} /> Enabled</span></article>
                            <article className="sa-security-card"><span className="sa-security-card__icon amber"><KeyRound size={20} /></span><div><h2>Credential recovery</h2><p>Users can recover their own account by email. The Super Admin can also set an emergency password for any workspace member.</p></div><button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => setActiveView('workspaces')}>Manage workspaces</button></article>
                        </section>
                    )}
                </div>
            </main>

            {membersWorkspace && (
                <div className="sa-modal-overlay" onClick={() => { setMembersWorkspace(null); setMemberResetId(null); setResetPassword(''); }}>
                    <div className="sa-modal sa-modal--wide" onClick={(event) => event.stopPropagation()}>
                        <div className="sa-modal__head">
                            <div>
                                <span className="sa-modal__eyebrow">Workspace access</span>
                                <h3>{membersWorkspace.name} members</h3>
                            </div>
                            <button className="sa-icon-btn" onClick={() => { setMembersWorkspace(null); setMemberResetId(null); setResetPassword(''); }} aria-label="Close"><X size={18} /></button>
                        </div>

                        {membersLoading ? (
                            <div className="sa-loading"><Loader2 size={20} className="sa-spin" /> Loading members...</div>
                        ) : members.length === 0 ? (
                            <div className="sa-empty"><Users size={24} /><strong>No members found</strong></div>
                        ) : (
                            <div className="sa-member-list">
                                {members.map((member) => (
                                    <div key={member.id} className="sa-member-row">
                                        <div className="sa-member-row__summary">
                                            <span className="sa-member-row__avatar">{(member.name || member.email || '?').charAt(0).toUpperCase()}</span>
                                            <div>
                                                <strong>{member.name || 'Unnamed member'}</strong>
                                                <span>{member.email}</span>
                                            </div>
                                            <span className={`sa-member-role sa-member-role--${member.role}`}>{member.role === 'admin' ? 'Workspace admin' : member.role}</span>
                                            <button
                                                className="sa-icon-btn sa-icon-btn--key"
                                                title={`Set password for ${member.name || member.email}`}
                                                aria-label={`Set password for ${member.name || member.email}`}
                                                onClick={() => { setMemberResetId(member.id); setResetPassword(genPassword()); }}
                                            >
                                                <KeyRound size={15} />
                                            </button>
                                        </div>

                                        {memberResetId === member.id && (
                                            <div className="sa-member-reset">
                                                <div>
                                                    <strong>Set emergency password</strong>
                                                    <span>The member should change this password after signing in.</span>
                                                </div>
                                                <input type="text" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="new-password" aria-label={`New password for ${member.name || member.email}`} />
                                                <button className="sa-btn sa-btn--primary sa-btn--sm" disabled={resetSubmittingId === member.id} onClick={() => handleReset(member, true)}>
                                                    {resetSubmittingId === member.id ? <><Loader2 size={14} className="sa-spin" /> Updating...</> : 'Update'}
                                                </button>
                                                <button className="sa-btn sa-btn--ghost sa-btn--sm" disabled={resetSubmittingId === member.id} onClick={() => { setMemberResetId(null); setResetPassword(''); }}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCreateOpen && (
                <div className="sa-modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="sa-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="sa-modal__head">
                            <div><span className="sa-modal__eyebrow">New account</span><h3>Create Admin Workspace</h3></div>
                            <button className="sa-icon-btn" onClick={() => setIsCreateOpen(false)} aria-label="Close"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="sa-form">
                            <label>Workspace / Admin name
                                <input type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Acme Corp" autoFocus />
                            </label>
                            <label>Admin email
                                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@acme.com" />
                            </label>
                            <label>Temporary password
                                <div className="sa-pw">
                                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    <button type="button" onClick={() => setForm({ ...form, password: genPassword() })} title="Generate password" aria-label="Generate password"><RefreshCw size={16} /></button>
                                </div>
                            </label>
                            <p className="sa-hint">The administrator will use these credentials to manage their own members and workspace data. Share them through a secure channel.</p>
                            <div className="sa-form__actions">
                                <button type="button" className="sa-btn sa-btn--ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                                <button type="submit" className="sa-btn sa-btn--primary" disabled={submitting}>
                                    {submitting ? <><Loader2 size={16} className="sa-spin" /> Creating...</> : <><Plus size={16} /> Create Workspace</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdmin;
