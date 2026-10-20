import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/uiSlice';
import { authService } from '../../services/authService';
import { superAdminService } from '../../services/superAdminService';
import {
    Shield, Plus, RefreshCw, KeyRound, Power, Users, Building2,
    LogOut, Loader2, X, Eye, EyeOff, Copy,
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
        let p = '';
        for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
        return p + '@1';
    };

    const handleCreate = async (e) => {
        e.preventDefault();
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

    const handleReset = async (adminId) => {
        if (!resetPassword || resetPassword.length < 6) {
            dispatch(addToast({ title: 'Validation', message: 'Password must be at least 6 characters.', type: 'warning' }));
            return;
        }
        try {
            await superAdminService.resetPassword(adminId, resetPassword);
            dispatch(addToast({ title: 'Password Reset', message: 'New password set. Share it with the admin.', type: 'success' }));
            setResetId(null);
            setResetPassword('');
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
    };

    const handleToggle = async (ws) => {
        try {
            await superAdminService.toggleWorkspace(ws.id, !ws.disabled);
            dispatch(addToast({ title: ws.disabled ? 'Workspace Enabled' : 'Workspace Disabled', message: `${ws.name} ${ws.disabled ? 'can now log in.' : 'has been suspended.'}`, type: 'success' }));
            await load();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
    };

    const copyCreds = (ws) => {
        navigator.clipboard?.writeText(`Email: ${ws.email}`);
        dispatch(addToast({ title: 'Copied', message: 'Email copied to clipboard.', type: 'info' }));
    };

    return (
        <div className="sa-root">
            <header className="sa-header">
                <div className="sa-header__brand">
                    <span className="sa-header__logo"><Shield size={22} /></span>
                    <div>
                        <h1>Super Admin Console</h1>
                        <p>Provision and manage workspace administrators</p>
                    </div>
                </div>
                <div className="sa-header__right">
                    <span className="sa-header__user">{user?.name || 'Super Admin'}</span>
                    <button className="sa-btn sa-btn--ghost" onClick={() => authService.signOut()}><LogOut size={16} /> Logout</button>
                </div>
            </header>

            <div className="sa-body">
                <div className="sa-stats">
                    <div className="sa-stat"><span className="sa-stat__icon"><Building2 size={18} /></span><div><strong>{workspaces.length}</strong><small>Workspaces</small></div></div>
                    <div className="sa-stat"><span className="sa-stat__icon"><Users size={18} /></span><div><strong>{workspaces.reduce((s, w) => s + (w.member_count || 0), 0)}</strong><small>Total members</small></div></div>
                    <div className="sa-stat"><span className="sa-stat__icon"><Power size={18} /></span><div><strong>{workspaces.filter(w => !w.disabled).length}</strong><small>Active</small></div></div>
                </div>

                <div className="sa-toolbar">
                    <h2>Admin Workspaces</h2>
                    <div className="sa-toolbar__actions">
                        <button className="sa-btn sa-btn--ghost" onClick={load}><RefreshCw size={16} /> Refresh</button>
                        <button className="sa-btn sa-btn--primary" onClick={() => { setForm({ name: '', email: '', password: genPassword() }); setIsCreateOpen(true); }}><Plus size={16} /> Create Workspace</button>
                    </div>
                </div>

                {loading ? (
                    <div className="sa-loading"><Loader2 size={24} className="sa-spin" /> Loading workspaces…</div>
                ) : workspaces.length === 0 ? (
                    <div className="sa-empty">
                        <Building2 size={32} />
                        <strong>No workspaces yet</strong>
                        <p>Create your first admin workspace to get started.</p>
                    </div>
                ) : (
                    <div className="sa-list">
                        {workspaces.map((ws) => (
                            <div key={ws.id} className={`sa-card ${ws.disabled ? 'sa-card--disabled' : ''}`}>
                                <div className="sa-card__main">
                                    <div className="sa-card__avatar">{(ws.name || '?').charAt(0).toUpperCase()}</div>
                                    <div className="sa-card__info">
                                        <strong>{ws.name} {ws.disabled && <span className="sa-badge sa-badge--off">Suspended</span>}</strong>
                                        <span>{ws.email}</span>
                                        <small>{ws.member_count} member{ws.member_count === 1 ? '' : 's'} · created {new Date(ws.created_at).toLocaleDateString()}</small>
                                    </div>
                                </div>
                                <div className="sa-card__actions">
                                    <button className="sa-icon-btn" title="Copy email" onClick={() => copyCreds(ws)}><Copy size={15} /></button>
                                    <button className="sa-icon-btn" title="Reset password" onClick={() => { setResetId(ws.id); setResetPassword(genPassword()); }}><KeyRound size={15} /></button>
                                    <button className={`sa-icon-btn ${ws.disabled ? 'sa-icon-btn--on' : 'sa-icon-btn--off'}`} title={ws.disabled ? 'Enable' : 'Disable'} onClick={() => handleToggle(ws)}><Power size={15} /></button>
                                </div>

                                {resetId === ws.id && (
                                    <div className="sa-reset">
                                        <input type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password" />
                                        <button className="sa-btn sa-btn--primary sa-btn--sm" onClick={() => handleReset(ws.id)}>Set</button>
                                        <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => { setResetId(null); setResetPassword(''); }}>Cancel</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isCreateOpen && (
                <div className="sa-modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-modal__head">
                            <h3>Create Admin Workspace</h3>
                            <button className="sa-icon-btn" onClick={() => setIsCreateOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="sa-form">
                            <label>Workspace / Admin name
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Corp" autoFocus />
                            </label>
                            <label>Admin email
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@acme.com" />
                            </label>
                            <label>Temporary password
                                <div className="sa-pw">
                                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    <button type="button" onClick={() => setForm({ ...form, password: genPassword() })} title="Generate"><RefreshCw size={16} /></button>
                                </div>
                            </label>
                            <p className="sa-hint">The admin logs in with these credentials and manages their own employees and data. Share the email + password with them securely.</p>
                            <div className="sa-form__actions">
                                <button type="button" className="sa-btn sa-btn--ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                                <button type="submit" className="sa-btn sa-btn--primary" disabled={submitting}>
                                    {submitting ? <><Loader2 size={16} className="sa-spin" /> Creating…</> : <><Plus size={16} /> Create Workspace</>}
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
