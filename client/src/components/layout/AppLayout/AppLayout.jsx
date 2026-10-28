import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { setSidebarOpen } from '../../../store/slices/uiSlice';
import { Home, FolderKanban, CheckSquare, Settings } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar.jsx';
import TopBar from '../TopBar/TopBar';
import MobileBottomNav from '../MobileBottomNav/MobileBottomNav';
import ToastContainer from '../../common/Toast/Toast';
import CreateProjectModal from '../../modals/CreateProjectModal/CreateProjectModal';
import AddTaskModal from '../../modals/AddTaskModal/AddTaskModal.jsx';
import './AppLayout.css';

const AppLayout = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
    const adminMobileItems = [
        { label: 'Projects', path: '/projects', icon: FolderKanban, isActive: ({ pathname }) => pathname === '/projects' || pathname.startsWith('/board/') },
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    ];

    // On mobile the sidebar is an overlay drawer — auto-close it after navigating
    // so the destination page isn't hidden behind the menu.
    useEffect(() => {
        if (window.innerWidth <= 768) {
            dispatch(setSidebarOpen(false));
        }
    }, [location.pathname, dispatch]);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className={`app-layout__main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <TopBar />
                <div className="app-layout__content">
                    <Outlet />
                </div>
            </div>
            <MobileBottomNav
                items={adminMobileItems}
                homeItem={{ label: 'Home', path: '/modules', icon: Home, end: true }}
                settingsItem={{ label: 'Settings', path: '/settings', icon: Settings }}
                onMore={() => dispatch(setSidebarOpen(true))}
            />
            <CreateProjectModal />
            <AddTaskModal />
        </div>
    );
};

export default AppLayout;
