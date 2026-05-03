import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../../store/slices/authSlice';
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
} from 'lucide-react';
import { toggleTheme } from '../../../store/slices/uiSlice';
import Avatar from '../../common/Avatar/Avatar';
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
        { label: 'Dashboard', path: '/manager/projects', icon: Home },
        { label: 'Sprint Board', path: '/manager/projects/sprint', icon: BarChart3 },
        { label: 'All Tasks', path: '/manager/projects/tasks', icon: ClipboardList },
        { label: 'Timeline', path: '/manager/projects/timeline', icon: Calendar },
        { label: 'Milestones', path: '/manager/projects/milestones', icon: Target },
        { label: 'Teams', path: '/manager/projects/teams', icon: UsersRound },
    ],
    hr: [
        { label: 'Dashboard', path: '/manager/hr', icon: Home },
        { label: 'Employees', path: '/manager/hr/employees', icon: Users },
        { label: 'Recruitment', path: '/manager/hr/recruitment', icon: UserCheck },
        { label: 'Attendance', path: '/manager/hr/attendance', icon: Calendar },
        { label: 'Teams', path: '/manager/hr/teams', icon: UsersRound },
    ],
    finance: [
        { label: 'Dashboard', path: '/manager/finance', icon: Home },
        { label: 'Invoices', path: '/manager/finance/invoices', icon: CreditCard },
        { label: 'Reports', path: '/manager/finance/reports', icon: FileBarChart },
        { label: 'Budgets', path: '/manager/finance/budgets', icon: DollarSign },
        { label: 'Teams', path: '/manager/finance/teams', icon: UsersRound },
    ],
    leads: [
        { label: 'Dashboard', path: '/manager/leads', icon: Home },
        { label: 'Pipeline', path: '/manager/leads/pipeline', icon: BarChart3 },
        { label: 'All Leads', path: '/manager/leads/all', icon: Handshake },
        { label: 'Contacts', path: '/manager/leads/contacts', icon: Phone },
        { label: 'Teams', path: '/manager/leads/teams', icon: UsersRound },
    ],
    support: [
        { label: 'Dashboard', path: '/manager/support', icon: Home },
        { label: 'Tickets', path: '/manager/support/tickets', icon: MessageCircle },
        { label: 'All Tickets', path: '/manager/support/all', icon: Headphones },
        { label: 'Knowledge Base', path: '/manager/support/kb', icon: BookOpen },
        { label: 'Teams', path: '/manager/support/teams', icon: UsersRound },
    ],
    docs: [
        { label: 'Dashboard', path: '/manager/docs', icon: Home },
        { label: 'All Documents', path: '/manager/docs/all', icon: FileText },
        { label: 'Templates', path: '/manager/docs/templates', icon: Layout },
        { label: 'Uploads', path: '/manager/docs/uploads', icon: Upload },
        { label: 'Teams', path: '/manager/docs/teams', icon: UsersRound },
    ],
};

const ManagerLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);

    const moduleKey = user?.assignedModule;
    const moduleInfo = DEPARTMENT_MODULES.find((m) => m.key === moduleKey);
    const ModuleIcon = moduleInfo ? (moduleIconMap[moduleInfo.icon] || FileText) : Shield;
    const subPages = moduleKey ? (moduleSubPages[moduleKey] || []) : [];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="manager-layout">
            {/* Manager Sidebar */}
            <aside className="manager-sidebar">
                {/* Sidebar Header — Module branding */}
                <div className="manager-sidebar__header">
                    <div
                        className="manager-sidebar__module-badge"
                        style={{ background: moduleInfo?.gradient || 'var(--primary-500)' }}
                    >
                        <ModuleIcon size={20} color="#fff" />
                    </div>
                    <div className="manager-sidebar__module-info">
                        <div className="manager-sidebar__module-name">
                            {moduleInfo?.label || 'Module'}
                        </div>
                        <div className="manager-sidebar__module-role">Manager Portal</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="manager-sidebar__nav">
                    <div className="manager-sidebar__nav-label">Navigation</div>
                    {subPages.map((sub) => {
                        const SubIcon = sub.icon;
                        const isActive = location.pathname === sub.path;
                        return (
                            <button
                                key={sub.label}
                                className={`manager-sidebar__nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(sub.path)}
                                style={isActive ? { '--active-color': moduleInfo?.color } : {}}
                            >
                                <SubIcon size={16} />
                                <span>{sub.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Footer */}
                <div className="manager-sidebar__footer">
                    <button
                        className="manager-sidebar__nav-item"
                        onClick={() => dispatch(toggleTheme())}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button
                        className="manager-sidebar__nav-item manager-sidebar__logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                    <div className="manager-sidebar__user">
                        <Avatar name={user?.name || 'M'} size="sm" />
                        <div className="manager-sidebar__user-info">
                            <div className="manager-sidebar__user-name">{user?.name}</div>
                            <div className="manager-sidebar__user-email">{user?.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="manager-layout__main">
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
                            style={{ background: moduleInfo?.gradient }}
                        >
                            <ModuleIcon size={14} color="#fff" />
                            <span>{moduleInfo?.label}</span>
                        </div>
                        <div className="manager-topbar__user">
                            <Avatar name={user?.name || 'M'} size="xs" />
                            <span>{user?.name?.split(' ')[0]}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="manager-layout__content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ManagerLayout;
