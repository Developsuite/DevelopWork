import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../../store/slices/uiSlice';
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    prependNotification,
} from '../../../store/slices/notificationsSlice';
import { notificationService } from '../../../services/notificationService';
import Avatar from '../../common/Avatar/Avatar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';
import { mockBoards } from '../../../utils/mockData';
import {
    Menu,
    Search,
    Bell,
    Settings,
    ChevronRight,
    CheckCheck,
    Trash2,
    CheckCircle2,
} from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
    const { user } = useSelector((state) => state.auth);
    const { items: notifications } = useSelector((state) => state.notifications);

    const [dropOpen, setDropOpen] = useState(false);
    const dropRef = useRef(null);
    const channelRef = useRef(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Fetch notifications and set up realtime on mount
    useEffect(() => {
        if (!user?.id) return;
        dispatch(fetchNotifications(user.id));

        channelRef.current = notificationService.subscribeToUser(user.id, (newNotif) => {
            dispatch(prependNotification(newNotif));
        });

        return () => {
            notificationService.unsubscribe(channelRef.current);
        };
    }, [user?.id, dispatch]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setDropOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleBellClick = () => setDropOpen((prev) => !prev);

    const handleMarkRead = (id) => dispatch(markNotificationRead(id));

    const handleMarkAllRead = () => {
        if (user?.id) dispatch(markAllNotificationsRead(user.id));
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        dispatch(deleteNotification(id));
    };

    const getBreadcrumb = () => {
        const path = location.pathname;
        const parts = [];
        if (path.startsWith('/board/')) {
            const boardId = path.split('/')[2];
            const board = mockBoards.find((b) => b._id === boardId);
            parts.push({ label: 'Projects', path: '/projects' });
            if (board) parts.push({ label: board.name, path, current: true });
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
        } else if (path === '/meetings') {
            parts.push({ label: 'Meetings Management', path: '/meetings', current: true });
        } else if (path === '/settings') {
            parts.push({ label: 'Settings', path: '/settings', current: true });
        }
        return parts;
    };

    const breadcrumb = getBreadcrumb();

    const timeAgo = (dateStr) => {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

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

                <nav className="topbar__breadcrumb">
                    {breadcrumb.map((item, index) => (
                        <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {index > 0 && <ChevronRight size={12} className="topbar__breadcrumb-sep" />}
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

            <div className="topbar__right">
                <ThemeToggle />

                {/* Notification Bell */}
                <div className="topbar__notif-wrap" ref={dropRef}>
                    <button
                        className={`topbar__icon-btn ${dropOpen ? 'active' : ''}`}
                        title="Notifications"
                        onClick={handleBellClick}
                    >
                        <Bell size={19} />
                        {unreadCount > 0 && (
                            <span className="topbar__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </button>

                    {dropOpen && (
                        <div className="notif-dropdown">
                            <div className="notif-dropdown__header">
                                <span className="notif-dropdown__title">Notifications</span>
                                {unreadCount > 0 && (
                                    <button className="notif-dropdown__mark-all" onClick={handleMarkAllRead}>
                                        <CheckCheck size={13} />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notif-dropdown__list">
                                {notifications.length === 0 ? (
                                    <div className="notif-dropdown__empty">
                                        <Bell size={28} strokeWidth={1.5} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
                                            onClick={() => !n.read && handleMarkRead(n.id)}
                                        >
                                            <div className="notif-item__icon">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div className="notif-item__body">
                                                <p className="notif-item__title">{n.title}</p>
                                                <p className="notif-item__message">{n.message}</p>
                                                <span className="notif-item__time">{timeAgo(n.created_at)}</span>
                                            </div>
                                            <button
                                                className="notif-item__delete"
                                                onClick={(e) => handleDelete(e, n.id)}
                                                title="Dismiss"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button className="topbar__icon-btn" title="Settings" id="settings-btn" onClick={() => navigate('/settings')}>
                    <Settings size={19} />
                </button>
                <button className="topbar__profile" id="profile-btn" onClick={() => navigate('/settings')}>
                    <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" />
                    <span className="topbar__profile-name">{user?.name || 'User'}</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;
