import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser, updateUser } from '../../../store/slices/authSlice';
import { toggleTheme } from '../../../store/slices/uiSlice';
import Avatar from '../../common/Avatar/Avatar';
import {
    Home,
    CheckSquare,
    Coffee,
    Settings,
    LogOut,
    Sun,
    Moon,
    Briefcase,
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    FileText,
    ExternalLink,
    Video,
    Menu,
    X
} from 'lucide-react';
import { permissionsService } from '../../../services/permissionsService';
import { supabase } from '../../../lib/supabase';
import MobileBottomNav from '../MobileBottomNav/MobileBottomNav';
import './EmployeeLayout.css';

const navItems = [
    { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
    { label: 'Settings', path: '/employee/settings', icon: Settings },
];

const modIconMap = {
    projects: FolderKanban,
    tasks: CheckSquare,
    hr: Users,
    finance: DollarSign,
    leads: Handshake,
    clients: Users,
    docs: FileText,
    meetings: Video
};

const EmployeeLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);

    const [wsName, setWsName] = useState(() => localStorage.getItem('dw-workspace-name') || 'DevelopWork');
    const [permittedModules, setPermittedModules] = useState(() => permissionsService.getAccessibleModules(user));
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Close the mobile drawer whenever the route changes
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        let isMounted = true;
        const handleWsUpdate = () => {
            if (isMounted) setWsName(localStorage.getItem('dw-workspace-name') || 'DevelopWork');
        };
        const handlePermsUpdate = async () => {
            if (!user) return;
            if (isMounted) {
                setPermittedModules(permissionsService.getAccessibleModules(user));
            }
            if (!user.id) return;
            try {
                // Pull the authoritative profile row and push its permissions AND
                // assigned_module into Redux. Without this, a laptop that logged in
                // before permissions were granted keeps a stale user object even
                // after fetchUserPermissions updates localStorage, so the sidebar
                // never recovers.
                const { data } = await supabase
                    .from('profiles')
                    .select('permissions, assigned_module')
                    .eq('id', user.id)
                    .maybeSingle();
                if (!isMounted || !data) return;
                const nextPerms = Array.isArray(data.permissions) ? data.permissions : [];
                const nextAssigned = data.assigned_module ?? null;
                const permsChanged = JSON.stringify(user.permissions || []) !== JSON.stringify(nextPerms);
                const assignedChanged = (user.assignedModule ?? null) !== nextAssigned;
                if (permsChanged || assignedChanged) {
                    dispatch(updateUser({ permissions: nextPerms, assignedModule: nextAssigned }));
                }
                const effectiveUser = { ...user, permissions: nextPerms, assignedModule: nextAssigned };
                setPermittedModules(permissionsService.getAccessibleModules(effectiveUser));
                // Always mirror the DB value into the local cache — including when it's
                // empty. Skipping an empty-permissions write used to leave the stale
                // cache behind, which the UI then merged back in on the next render,
                // bringing a revoked module back to life on that device.
                permissionsService.saveUserPermissionsLocally(user.id, nextPerms, user.email);
            } catch (e) {
                console.warn('[EmployeeLayout] Permissions sync warning:', e);
            }
        };

        handlePermsUpdate();
        window.addEventListener('workspaceUpdate', handleWsUpdate);
        window.addEventListener('dwPermissionsUpdated', handlePermsUpdate);
        window.addEventListener('focus', handlePermsUpdate);

        // Realtime sync for sidebar modules
        let channel = null;
        if (user?.id) {
            try {
                channel = supabase
                    .channel(`emp-layout-perms-${user.id}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                        (payload) => {
                            if (payload.new) {
                                permissionsService.fetchUserPermissions(user.id).then(() => {
                                    if (isMounted) {
                                        setPermittedModules(permissionsService.getAccessibleModules({
                                            ...user,
                                            assignedModule: payload.new.assigned_module,
                                            permissions: payload.new.permissions
                                        }));
                                    }
                                });
                            }
                        }
                    )
                    .subscribe();
            } catch (err) {
                console.warn('[EmployeeLayout] Realtime subscription warning:', err);
            }
        }

        return () => {
            isMounted = false;
            window.removeEventListener('workspaceUpdate', handleWsUpdate);
            window.removeEventListener('dwPermissionsUpdated', handlePermsUpdate);
            window.removeEventListener('focus', handlePermsUpdate);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [user]);

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to log out?')) return;
        try {
            await dispatch(signOutUser()).unwrap();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const currentNav = navItems.find((n) => n.path === location.pathname) || navItems[0];
    const mobileModuleLabels = {
        projects: 'Projects',
        tasks: 'Tasks',
        hr: 'HR',
        finance: 'Finance',
        leads: 'Leads',
        clients: 'Clients',
        docs: 'Docs',
        meetings: 'Meetings',
    };
    const moduleShortcuts = permittedModules.slice(0, 2).map((mod) => ({
        label: mobileModuleLabels[mod.key] || mod.label,
        path: `/${mod.key}`,
        icon: modIconMap[mod.key] || FolderKanban,
    }));
    const myTasksShortcut = {
        label: 'My Tasks',
        icon: CheckSquare,
        isActive: () => false,
        onClick: () => {
            navigate('/employee/dashboard');
            window.setTimeout(() => {
                document.querySelector('.cockpit-tasks-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        },
    };
    const mobileItems = moduleShortcuts.length >= 2
        ? moduleShortcuts
        : moduleShortcuts.length === 1
            ? [moduleShortcuts[0], myTasksShortcut]
            : [
                myTasksShortcut,
                { label: 'Workspaces', icon: Briefcase, isActive: () => false, onClick: () => setMobileNavOpen(true) },
            ];

    return (
        <div className="employee-layout">
            {/* Mobile drawer backdrop */}
            <div
                className={`employee-layout__overlay ${mobileNavOpen ? 'show' : ''}`}
                onClick={() => setMobileNavOpen(false)}
            />

            {/* Employee Sidebar */}
            <aside className={`employee-sidebar ${mobileNavOpen ? 'open' : ''}`}>
                <div className="employee-sidebar__header">
                    <div className="employee-sidebar__logo">
                        <img src="/images/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div className="employee-sidebar__brand">
                        <div className="employee-sidebar__brand-name">{wsName}</div>
                        <div className="employee-sidebar__brand-role">Employee Portal</div>
                    </div>
                    <button
                        className="employee-sidebar__close"
                        onClick={() => setMobileNavOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="employee-sidebar__nav">
                    <div className="employee-sidebar__nav-label">Menu</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/employee/dashboard');
                        
                        return (
                            <button
                                key={item.label}
                                className={`employee-sidebar__nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* RBAC Permitted Modules Navigation */}
                {permittedModules.length > 0 && (
                    <nav className="employee-sidebar__nav" style={{ marginTop: '16px' }}>
                        <div className="employee-sidebar__nav-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
                            <span>Permitted Workspaces</span>
                            <span style={{ fontSize: '10px', background: 'rgba(87, 155, 252, 0.15)', color: 'var(--primary-400)', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                                {permittedModules.length}
                            </span>
                        </div>
                        {permittedModules.map((mod) => {
                            const ModIcon = modIconMap[mod.key] || FolderKanban;
                            const modRoute = `/${mod.key}`;
                            return (
                                <button
                                    key={mod.key}
                                    className="employee-sidebar__nav-item"
                                    onClick={() => navigate(modRoute)}
                                    title={`Open ${mod.label}`}
                                    style={{ justifyContent: 'space-between' }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                        <ModIcon size={16} color={mod.color} style={{ flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.label}</span>
                                    </span>
                                    <ExternalLink size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                                </button>
                            );
                        })}
                    </nav>
                )}

                <div style={{ flex: 1 }} />

                <div className="employee-sidebar__footer">
                    <button
                        className="employee-sidebar__nav-item"
                        onClick={() => dispatch(toggleTheme())}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button
                        className="employee-sidebar__nav-item employee-sidebar__logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                    <div 
                        className="employee-sidebar__user" 
                        onClick={() => navigate('/employee/settings')}
                        style={{ cursor: 'pointer' }}
                        title="View Profile Settings"
                    >
                        <Avatar name={user?.name || 'Employee'} src={user?.avatar} size="sm" />
                        <div className="employee-sidebar__user-info">
                            <div className="employee-sidebar__user-name">{user?.name}</div>
                            <div className="employee-sidebar__user-dept">{user?.department || 'Staff'}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="employee-layout__main">
                <header className="employee-topbar">
                    <div className="employee-topbar__left">
                        <button
                            className="employee-topbar__menu-btn"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="employee-topbar__breadcrumb">
                            <span className="employee-topbar__breadcrumb-root">Portal</span>
                            <span className="employee-topbar__breadcrumb-sep">/</span>
                            <span className="employee-topbar__breadcrumb-page">
                                {currentNav.label}
                            </span>
                        </div>
                    </div>
                    <div className="employee-topbar__right">
                        {user?.department && (
                            <div className="employee-topbar__dept-pill">
                                <span>{user.department}</span>
                            </div>
                        )}
                        <div className="employee-topbar__user">
                            <Avatar name={user?.name || 'E'} src={user?.avatar} size="xs" />
                            <span>{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                        </div>
                    </div>
                </header>

                <div className="employee-layout__content">
                    <Outlet />
                </div>
            </div>
            <MobileBottomNav
                items={mobileItems}
                homeItem={{ label: 'Home', path: '/employee/dashboard', icon: Home, end: true }}
                settingsItem={{ label: 'Settings', path: '/employee/settings', icon: Settings }}
                onMore={() => setMobileNavOpen(true)}
            />
        </div>
    );
};

export default EmployeeLayout;
