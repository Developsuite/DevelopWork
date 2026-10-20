import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../../../store/slices/authSlice';
import { DEPARTMENT_MODULES } from '../../../utils/constants';
import { permissionsService } from '../../../services/permissionsService';
import { supabase } from '../../../lib/supabase';
import {
    Users,
    DollarSign,
    FolderKanban,
    Handshake,
    Headphones,
    FileText,
    BarChart3,
    Calendar,
    Target,
    ClipboardList,
    UserCheck,
    CreditCard,
    FileBarChart,
    Phone,
    MessageCircle,
    BookOpen,
    Upload,
    Layout,
    LogOut,
    ChevronDown,
    Zap,
    Shield,
    Sun,
    Moon,
    UsersRound,
    Home,
    Settings,
    Inbox,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Award,
    CheckSquare,
    Video,
    LayoutGrid,
} from 'lucide-react';
import { toggleTheme } from '../../../store/slices/uiSlice';
import Avatar from '../../common/Avatar/Avatar';
import CreateProjectModal from '../../modals/CreateProjectModal/CreateProjectModal';
import hrIcon from '../../../assets/hr/1.png';
import './ManagerLayout.css';

const moduleIconMap = {
    FolderKanban,
    CheckSquare,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
    Video,
};

const moduleSubPages = {
    projects: [
        { label: 'Overview', path: '/manager/projects?tab=overview', matchTab: 'overview', icon: Home, perm: 'projects.overview' },
        { label: 'Sprint Board', path: '/manager/projects/sprint', icon: BarChart3, perm: 'projects.sprint' },
        { label: 'All Tasks', path: '/manager/projects?tab=tasks', matchTab: 'tasks', icon: ClipboardList, perm: 'projects.tasks' },
        { label: 'All Projects', path: '/manager/projects?tab=projects', matchTab: 'projects', icon: FolderKanban, perm: 'projects.all' },
    ],
    tasks: [
        { label: 'All Tasks', path: '/manager/tasks?tab=all', matchTab: 'all', icon: ClipboardList, perm: 'tasks.all' },
        { label: 'Delegation Center', path: '/manager/tasks?tab=delegated', matchTab: 'delegated', icon: UserCheck, perm: 'tasks.delegated' },
        { label: 'Kanban Board', path: '/manager/tasks?tab=kanban', matchTab: 'kanban', icon: BarChart3, perm: 'tasks.kanban' },
        { label: 'Workload & Analytics', path: '/manager/tasks?tab=analytics', matchTab: 'analytics', icon: TrendingUp, perm: 'tasks.analytics' },
    ],
    hr: [
        { label: 'Directory', path: '/manager/hr?tab=directory', matchTab: 'directory', icon: Home, perm: 'hr.directory' },
        { label: 'Org Chart', path: '/manager/hr?tab=org', matchTab: 'org', icon: TrendingUp, perm: 'hr.org' },
        { label: 'Recruitment', path: '/manager/hr?tab=recruitment', matchTab: 'recruitment', icon: UserCheck, perm: 'hr.recruitment' },
        { label: 'Payroll', path: '/manager/hr?tab=payroll', matchTab: 'payroll', icon: DollarSign, perm: 'hr.payroll' },
        { label: 'Performance', path: '/manager/hr?tab=performance', matchTab: 'performance', icon: Award, perm: 'hr.performance' },
    ],
    finance: [
        { label: 'Dashboard', path: '/manager/finance?tab=dashboard', matchTab: 'dashboard', icon: Home, perm: 'finance.dashboard' },
        { label: 'Transactions', path: '/manager/finance?tab=transactions', matchTab: 'transactions', icon: CreditCard, perm: 'finance.transactions' },
        { label: 'Invoices', path: '/manager/finance?tab=invoices', matchTab: 'invoices', icon: FileBarChart, perm: 'finance.invoices' },
        { label: 'Expenses', path: '/manager/finance?tab=expenses', matchTab: 'expenses', icon: DollarSign, perm: 'finance.expenses' },
    ],
    leads: [
        { label: 'Pipeline', path: '/manager/leads?view=pipeline', matchTab: 'pipeline', icon: Home, perm: 'leads.pipeline' },
        { label: 'All Leads', path: '/manager/leads?view=leads', matchTab: 'leads', icon: Handshake, perm: 'leads.all' },
        { label: 'Contacts', path: '/manager/leads?view=contacts', matchTab: 'contacts', icon: Users, perm: 'leads.contacts' },
    ],
    clients: [
        { label: 'Client List', path: '/manager/clients?tab=all', matchTab: 'all', icon: Users, perm: 'clients.all' },
        { label: 'Active Projects', path: '/manager/clients?tab=projects', matchTab: 'projects', icon: FolderKanban, perm: 'clients.projects' },
        { label: 'Billing', path: '/manager/clients?tab=billing', matchTab: 'billing', icon: DollarSign, perm: 'clients.billing' },
    ],
    meetings: [
        { label: 'Upcoming Schedule', path: '/manager/meetings?tab=upcoming', matchTab: 'upcoming', icon: Calendar, perm: 'meetings.upcoming' },
        { label: 'Client Meetings', path: '/manager/meetings?tab=clients', matchTab: 'clients', icon: Handshake, perm: 'meetings.clients' },
        { label: 'Calendar View', path: '/manager/meetings?tab=calendar', matchTab: 'calendar', icon: LayoutGrid, perm: 'meetings.calendar' },
        { label: 'Minutes & Actions', path: '/manager/meetings?tab=minutes', matchTab: 'minutes', icon: FileText, perm: 'meetings.minutes' },
    ],
    docs: [
        { label: 'All Documents', path: '/manager/docs', matchTab: 'all', icon: Home, perm: 'docs.all' },
        { label: 'Templates', path: '/manager/docs?tab=templates', matchTab: 'templates', icon: Layout, perm: 'docs.templates' },
    ],
};

const ManagerLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Close the mobile drawer whenever the route changes
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname, location.search]);

    // Live sync permissions state
    const [permittedModules, setPermittedModules] = useState(() => permissionsService.getAccessibleModules(user));

    useEffect(() => {
        let isMounted = true;
        const updatePerms = async () => {
            if (!user) return;
            if (isMounted) setPermittedModules(permissionsService.getAccessibleModules(user));
            if (user.id) {
                try {
                    await permissionsService.fetchUserPermissions(user.id);
                    if (isMounted) setPermittedModules(permissionsService.getAccessibleModules(user));
                } catch (e) {
                    console.warn('[ManagerLayout] Permissions fetch warning:', e);
                }
            }
        };

        updatePerms();
        window.addEventListener('dwPermissionsUpdated', updatePerms);
        window.addEventListener('focus', updatePerms);

        let channel = null;
        if (user?.id) {
            try {
                channel = supabase
                    .channel(`manager-layout-perms-${user.id}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
                        updatePerms();
                    })
                    .subscribe();
            } catch (err) {}
        }

        return () => {
            isMounted = false;
            window.removeEventListener('dwPermissionsUpdated', updatePerms);
            window.removeEventListener('focus', updatePerms);
            if (channel) supabase.removeChannel(channel);
        };
    }, [user]);

    // Extract module from path: /manager/:moduleKey/...
    const pathParts = location.pathname.split('/');
    const urlModule = pathParts[2];

    const accessibleKeys = permittedModules.map(m => m.key);
    
    // Choose active module safely
    let currentModuleKey = urlModule;
    if (!currentModuleKey || currentModuleKey.startsWith('[') || !DEPARTMENT_MODULES.some(m => m.key === currentModuleKey)) {
        currentModuleKey = accessibleKeys[0] || 'projects';
    }

    // Auto-correct malformed URLs (e.g. /manager/["leads",...] -> /manager/leads)
    useEffect(() => {
        if (urlModule && (urlModule.startsWith('[') || !DEPARTMENT_MODULES.some(m => m.key === urlModule))) {
            navigate(`/manager/${currentModuleKey}`, { replace: true });
        }
    }, [urlModule, currentModuleKey, navigate]);

    const moduleInfo = DEPARTMENT_MODULES.find((m) => m.key === currentModuleKey);
    const ModuleIcon = moduleInfo ? (moduleIconMap[moduleInfo.icon] || FileText) : Shield;

    // Filter subPages by granular permissions
    const rawSubPages = moduleSubPages[currentModuleKey] || [];
    let subPages = rawSubPages.filter(sub => {
        if (!sub.perm) return true;
        return permissionsService.hasPermission(user, sub.perm);
    });

    // Fallback: If subPages is empty but user has features, extract them dynamically
    if (subPages.length === 0) {
        const accessibleFeatures = permissionsService.getAccessibleFeatures(user, currentModuleKey);
        subPages = accessibleFeatures.map(feat => {
            let tabParam = '';
            if (feat.path.includes('?')) {
                tabParam = feat.path.split('?')[1];
            }
            return {
                label: feat.label,
                path: `/manager/${currentModuleKey}${tabParam ? `?${tabParam}` : ''}`,
                matchTab: tabParam ? tabParam.split('=')[1] : null,
                icon: FolderKanban
            };
        });
    }

    // Auto-direct to the first permitted subpage tab if on base module URL
    useEffect(() => {
        if (subPages.length > 0 && !location.search && subPages[0].path.includes('?')) {
            const firstTab = subPages[0].path.split('?')[1];
            navigate(`/manager/${currentModuleKey}?${firstTab}`, { replace: true });
        }
    }, [currentModuleKey, subPages, location.search, navigate]);

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to log out?')) return;
        try {
            await dispatch(signOutUser()).unwrap();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div className="manager-layout">
            {/* Mobile drawer backdrop */}
            <div
                className={`manager-layout__overlay ${mobileNavOpen ? 'show' : ''}`}
                onClick={() => setMobileNavOpen(false)}
            />

            {/* Manager Sidebar */}
            <aside className={`manager-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'open' : ''}`}>
                <div className="manager-sidebar__header">
                    <button
                        className="manager-sidebar__toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <button
                        className="manager-sidebar__close"
                        onClick={() => setMobileNavOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                    {!isCollapsed && (
                        <>
                            <div
                                className="manager-sidebar__module-badge"
                                style={currentModuleKey === 'projects' ? { background: 'transparent', boxShadow: 'none' } : { background: moduleInfo?.gradient || 'var(--primary-500)' }}
                            >
                                {currentModuleKey === 'projects' ? (
                                    <img src={hrIcon} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <ModuleIcon size={20} color="#fff" />
                                )}
                            </div>
                            <div className="manager-sidebar__module-info">
                                <div className="manager-sidebar__module-name">
                                    {moduleInfo?.label || 'Management Portal'}
                                </div>
                                <div className="manager-sidebar__module-role">Manager Portal</div>
                            </div>
                        </>
                    )}
                    {isCollapsed && (
                        <div
                            className="manager-sidebar__module-badge mini"
                            style={currentModuleKey === 'projects' ? { background: 'transparent', boxShadow: 'none' } : { background: moduleInfo?.gradient || 'var(--primary-500)' }}
                        >
                            {currentModuleKey === 'projects' ? (
                                <img src={hrIcon} alt="Icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : (
                                <ModuleIcon size={18} color="#fff" />
                            )}
                        </div>
                    )}
                </div>

                {/* Multiple Permitted Modules Switcher */}
                {!isCollapsed && permittedModules.length > 1 && (
                    <div className="manager-module-switcher">
                        <div className="manager-module-switcher__label">
                            Permitted Modules ({permittedModules.length})
                        </div>
                        <div className="manager-module-switcher__list">
                            {permittedModules.map((mod) => {
                                const isCurrent = mod.key === currentModuleKey;
                                const ModIcon = moduleIconMap[mod.icon] || FolderKanban;
                                return (
                                    <button
                                        key={mod.key}
                                        className={`manager-module-switcher__btn ${isCurrent ? 'active' : ''}`}
                                        onClick={() => navigate(`/manager/${mod.key}`)}
                                        title={`Switch to ${mod.label}`}
                                    >
                                        <span className="manager-module-dot" style={{ background: mod.color }} />
                                        <ModIcon size={13} />
                                        <span>{mod.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Navigation Links for Active Module */}
                <nav className="manager-sidebar__nav">
                    {!isCollapsed && (
                        <div className="manager-sidebar__nav-label">
                            {moduleInfo?.label || 'Features'} Menu
                        </div>
                    )}
                    {subPages.map((sub) => {
                        const SubIcon = sub.icon;
                        const searchParams = new URLSearchParams(location.search);
                        const currentTab = searchParams.get('tab') || searchParams.get('view');
                        const isActive = sub.matchTab 
                            ? (currentTab === sub.matchTab || (sub.matchTab === 'overview' && !currentTab) || (sub.matchTab === 'directory' && !currentTab) || (sub.matchTab === 'dashboard' && !currentTab) || (sub.matchTab === 'pipeline' && !currentTab) || (sub.matchTab === 'all' && !currentTab))
                            : location.pathname === sub.path;
                            
                        return (
                            <button
                                key={sub.label}
                                title={isCollapsed ? sub.label : ''}
                                className={`manager-sidebar__nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                                onClick={() => navigate(sub.path)}
                                style={isActive ? { '--active-color': moduleInfo?.color } : {}}
                            >
                                <SubIcon size={16} />
                                {!isCollapsed && <span>{sub.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Footer */}
                <footer className="manager-sidebar__footer">
                    <button
                        className={`manager-sidebar__nav-item ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={() => dispatch(toggleTheme())}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <button
                        className={`manager-sidebar__nav-item manager-sidebar__logout ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={handleLogout}
                    >
                        <LogOut size={16} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                    <div 
                        className={`manager-sidebar__user ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={() => navigate(`/manager/${currentModuleKey}/settings`)}
                        style={{ cursor: 'pointer' }}
                        title="View Profile Settings"
                    >
                        <Avatar name={user?.name || 'M'} src={user?.avatar} size={isCollapsed ? "xs" : "sm"} />
                        {!isCollapsed && (
                            <div className="manager-sidebar__user-info">
                                <div className="manager-sidebar__user-name">{user?.name}</div>
                                <div className="manager-sidebar__user-email">{user?.email}</div>
                            </div>
                        )}
                    </div>
                </footer>
            </aside>

            {/* Main Content */}
            <main className={`manager-layout__main ${isCollapsed ? 'expanded' : ''} ${location.pathname.includes('/sprint') ? 'sprint-mode' : ''}`}>
                {/* Top Bar */}
                <header className="manager-topbar">
                    <div className="manager-topbar__left">
                        <button
                            className="manager-topbar__menu-btn"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="manager-topbar__breadcrumb">
                            <span className="manager-topbar__breadcrumb-module" style={{ color: moduleInfo?.color }}>
                                {moduleInfo?.label}
                            </span>
                            <span className="manager-topbar__breadcrumb-sep">/</span>
                            <span className="manager-topbar__breadcrumb-page">
                                {subPages.find((s) => s.path === location.pathname)?.label || 'Dashboard'}
                            </span>
                        </div>
                    </div>
                    <div className="manager-topbar__right">
                        <div
                            className="manager-topbar__module-pill"
                            style={currentModuleKey === 'projects' ? { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' } : { background: moduleInfo?.gradient }}
                        >
                            {currentModuleKey === 'projects' ? (
                                <img src={hrIcon} alt="Icon" style={{ width: '14px', height: '14px', objectFit: 'contain', marginRight: '6px' }} />
                            ) : (
                                <ModuleIcon size={14} color="#fff" />
                            )}
                            <span>{moduleInfo?.label}</span>
                        </div>
                        <div className="manager-topbar__user">
                            <Avatar name={user?.name || 'M'} src={user?.avatar} size="xs" />
                            <span>{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="manager-layout__content">
                    <Outlet />
                </div>
            </main>

            {/* Modals */}
            <CreateProjectModal />
        </div>
    );
};

export default ManagerLayout;
