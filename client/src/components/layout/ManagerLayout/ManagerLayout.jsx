import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../../../store/slices/authSlice';
import { DEPARTMENT_MODULES } from '../../../utils/constants';
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
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Award
} from 'lucide-react';
import { toggleTheme } from '../../../store/slices/uiSlice';
import Avatar from '../../common/Avatar/Avatar';
import CreateProjectModal from '../../modals/CreateProjectModal/CreateProjectModal';
import hrIcon from '../../../assets/hr/1.png';
import './ManagerLayout.css';

const moduleIconMap = {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
};

const moduleSubPages = {
    projects: [
        { label: 'Dashboard', path: '/manager/projects?tab=overview', matchTab: 'overview', icon: Home },
        { label: 'Sprint Board', path: '/manager/projects/sprint', icon: BarChart3 },
        { label: 'All Tasks', path: '/manager/projects?tab=tasks', matchTab: 'tasks', icon: ClipboardList },
        { label: 'Timeline', path: '/manager/projects?tab=timeline', matchTab: 'timeline', icon: Calendar },
        { label: 'Milestones', path: '/manager/projects?tab=milestones', matchTab: 'milestones', icon: Target },
        { label: 'Teams', path: '/manager/projects?tab=teams', matchTab: 'teams', icon: UsersRound },
        { label: 'Approvals', path: '/manager/projects?tab=approvals', matchTab: 'approvals', icon: Inbox },
    ],
    hr: [
        { label: 'Dashboard', path: '/manager/hr?tab=directory', matchTab: 'directory', icon: Home },
        { label: 'Org Chart', path: '/manager/hr?tab=org', matchTab: 'org', icon: TrendingUp },
        { label: 'Recruitment', path: '/manager/hr?tab=recruitment', matchTab: 'recruitment', icon: UserCheck },
        { label: 'Payroll', path: '/manager/hr?tab=payroll', matchTab: 'payroll', icon: DollarSign },
        { label: 'Performance', path: '/manager/hr?tab=performance', matchTab: 'performance', icon: Award },
        { label: 'Teams', path: '/manager/hr?tab=teams', matchTab: 'teams', icon: UsersRound },
    ],
    finance: [
        { label: 'Dashboard', path: '/manager/finance?tab=dashboard', matchTab: 'dashboard', icon: Home },
        { label: 'Transactions', path: '/manager/finance?tab=transactions', matchTab: 'transactions', icon: CreditCard },
        { label: 'Invoices', path: '/manager/finance?tab=invoices', matchTab: 'invoices', icon: FileBarChart },
        { label: 'Expenses', path: '/manager/finance?tab=expenses', matchTab: 'expenses', icon: DollarSign },
        { label: 'Teams', path: '/manager/finance?tab=teams', matchTab: 'teams', icon: UsersRound },
    ],
    leads: [
        { label: 'Dashboard', path: '/manager/leads?view=pipeline', matchTab: 'pipeline', icon: Home },
        { label: 'All Leads', path: '/manager/leads?view=leads', matchTab: 'leads', icon: Handshake },
        { label: 'Contacts', path: '/manager/leads?view=contacts', matchTab: 'contacts', icon: Users },
        { label: 'Teams', path: '/manager/leads?view=teams', matchTab: 'teams', icon: UsersRound },
    ],
    support: [
        { label: 'Dashboard', path: '/manager/support?tab=dashboard', matchTab: 'dashboard', icon: Home },
        { label: 'Tickets', path: '/manager/support?tab=tickets', matchTab: 'tickets', icon: Headphones },
        { label: 'KB', path: '/manager/support?tab=kb', matchTab: 'kb', icon: BookOpen },
        { label: 'Teams', path: '/manager/support?tab=teams', matchTab: 'teams', icon: UsersRound },
    ],
    docs: [
        { label: 'Dashboard', path: '/manager/docs?tab=all', matchTab: 'all', icon: Home },
        { label: 'Editor', path: '/manager/docs?tab=editor', matchTab: 'editor', icon: FileText },
        { label: 'Templates', path: '/manager/docs?tab=templates', matchTab: 'templates', icon: Layout },
        { label: 'Teams', path: '/manager/docs?tab=teams', matchTab: 'teams', icon: UsersRound },
    ],
};

const ManagerLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const moduleKey = user?.assignedModule;
    const moduleInfo = DEPARTMENT_MODULES.find((m) => m.key === moduleKey);
    const ModuleIcon = moduleInfo ? (moduleIconMap[moduleInfo.icon] || FileText) : Shield;
    const subPages = moduleKey ? (moduleSubPages[moduleKey] || []) : [];

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
            {/* Manager Sidebar */}
            <aside className={`manager-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="manager-sidebar__header">
                    <button 
                        className="manager-sidebar__toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    {!isCollapsed && (
                        <>
                            <div
                                className="manager-sidebar__module-badge"
                                style={moduleKey === 'projects' ? { background: 'transparent', boxShadow: 'none' } : { background: moduleInfo?.gradient || 'var(--primary-500)' }}
                            >
                                {moduleKey === 'projects' ? (
                                    <img src={hrIcon} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <ModuleIcon size={20} color="#fff" />
                                )}
                            </div>
                            <div className="manager-sidebar__module-info">
                                <div className="manager-sidebar__module-name">
                                    {moduleInfo?.label || 'Module'}
                                </div>
                                <div className="manager-sidebar__module-role">Manager Portal</div>
                            </div>
                        </>
                    )}
                    {isCollapsed && (
                        <div
                            className="manager-sidebar__module-badge mini"
                            style={moduleKey === 'projects' ? { background: 'transparent', boxShadow: 'none' } : { background: moduleInfo?.gradient || 'var(--primary-500)' }}
                        >
                            {moduleKey === 'projects' ? (
                                <img src={hrIcon} alt="Icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : (
                                <ModuleIcon size={18} color="#fff" />
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="manager-sidebar__nav">
                    {!isCollapsed && <div className="manager-sidebar__nav-label">Navigation</div>}
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
                        onClick={() => navigate(`/manager/${moduleKey}/settings`)}
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
                            style={moduleKey === 'projects' ? { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' } : { background: moduleInfo?.gradient }}
                        >
                            {moduleKey === 'projects' ? (
                                <img src={hrIcon} alt="Icon" style={{ width: '14px', height: '14px', objectFit: 'contain', marginRight: '6px' }} />
                            ) : (
                                <ModuleIcon size={14} color="#fff" />
                            )}
                            <span>{moduleInfo?.label}</span>
                        </div>
                        <div className="manager-topbar__user">
                            <Avatar name={user?.name || 'M'} src={user?.avatar} size="xs" />
                            <span>{user?.name?.split(' ')[0]}</span>
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
