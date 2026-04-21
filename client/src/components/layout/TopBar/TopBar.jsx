import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../../store/slices/uiSlice';
import Avatar from '../../common/Avatar/Avatar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';
import { mockUser, mockBoards, mockNotifications } from '../../../utils/mockData';
import {
    Menu,
    Search,
    Bell,
    Settings,
    ChevronRight,
} from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    // Build breadcrumb from path
    const getBreadcrumb = () => {
        const path = location.pathname;
        const parts = [];

        if (path.startsWith('/board/')) {
            const boardId = path.split('/')[2];
            const board = mockBoards.find((b) => b._id === boardId);
            parts.push({ label: 'Projects', path: '/projects' });
            if (board) {
                parts.push({ label: board.name, path: path, current: true });
            }
        } else if (path === '/modules') {
            parts.push({ label: 'Module Hub', path: '/modules', current: true });
        } else if (path === '/projects') {
            parts.push({ label: 'Project Management', path: '/projects', current: true });
        } else if (path === '/hr') {
            parts.push({ label: 'Human Resources', path: '/hr', current: true });
        } else if (path === '/finance') {
            parts.push({ label: 'Finance', path: '/finance', current: true });
        } else if (path === '/leads') {
            parts.push({ label: 'Leads Management', path: '/leads', current: true });
        } else if (path === '/support') {
            parts.push({ label: 'Customer Support', path: '/support', current: true });
        } else if (path === '/docs') {
            parts.push({ label: 'Documentation', path: '/docs', current: true });
        }

        return parts;
    };

    const breadcrumb = getBreadcrumb();

    return (
        <header className={`topbar glass-topbar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
            <div className="topbar__left">
                <button
                    className="topbar__menu-btn"
                    onClick={() => dispatch(toggleSidebar())}
                    title="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>

                {/* Breadcrumb */}
                <nav className="topbar__breadcrumb">
                    {breadcrumb.map((item, index) => (
                        <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {index > 0 && (
                                <ChevronRight size={12} className="topbar__breadcrumb-sep" />
                            )}
                            <button
                                className={`topbar__breadcrumb-item ${item.current ? 'current' : ''}`}
                                onClick={() => !item.current && navigate(item.path)}
                            >
                                {item.label}
                            </button>
                        </span>
                    ))}
                </nav>
            </div>

            {/* Search */}
            <div className="topbar__search">
                <Search size={15} className="topbar__search-icon" />
                <input
                    type="text"
                    className="topbar__search-input"
                    placeholder="Search tasks, boards..."
                    id="global-search"
                />
                <span className="topbar__search-shortcut">⌘K</span>
            </div>

            {/* Right Actions */}
            <div className="topbar__right">
                <ThemeToggle />
                <button className="topbar__icon-btn" title="Notifications" id="notifications-btn">
                    <Bell size={19} />
                    {unreadCount > 0 && (
                        <span className="topbar__badge">{unreadCount}</span>
                    )}
                </button>
                <button className="topbar__icon-btn" title="Settings" id="settings-btn">
                    <Settings size={19} />
                </button>
                <button className="topbar__profile" id="profile-btn">
                    <Avatar name={mockUser.name} size="sm" />
                    <span className="topbar__profile-name">{mockUser.name}</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;
