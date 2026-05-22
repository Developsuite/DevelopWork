import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../../../store/slices/authSlice';
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
    Briefcase
} from 'lucide-react';
import './EmployeeLayout.css';

const navItems = [
    { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
    { label: 'Settings', path: '/employee/settings', icon: Settings },
];

const EmployeeLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);

    const [wsName, setWsName] = useState(() => localStorage.getItem('dw-workspace-name') || 'DevelopWork');

    useEffect(() => {
        const handleWsUpdate = () => {
            setWsName(localStorage.getItem('dw-workspace-name') || 'DevelopWork');
        };
        window.addEventListener('workspaceUpdate', handleWsUpdate);
        return () => window.removeEventListener('workspaceUpdate', handleWsUpdate);
    }, []);

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

    return (
        <div className="employee-layout">
            {/* Employee Sidebar */}
            <aside className="employee-sidebar">
                <div className="employee-sidebar__header">
                    <div className="employee-sidebar__logo">
                        <img src="/images/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div className="employee-sidebar__brand">
                        <div className="employee-sidebar__brand-name">{wsName}</div>
                        <div className="employee-sidebar__brand-role">Employee Portal</div>
                    </div>
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
                        <div className="employee-topbar__breadcrumb">
                            <span className="employee-topbar__breadcrumb-root">Portal</span>
                            <span className="employee-topbar__breadcrumb-sep">/</span>
                            <span className="employee-topbar__breadcrumb-page">
                                {currentNav.label}
                            </span>
                        </div>
                    </div>
                    <div className="employee-topbar__right">
                        <div className="employee-topbar__dept-pill">
                            <Briefcase size={14} />
                            <span>{user?.department || 'Employee'}</span>
                        </div>
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
        </div>
    );
};

export default EmployeeLayout;
