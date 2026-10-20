import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { setSidebarOpen } from '../../../store/slices/uiSlice';
import Sidebar from '../Sidebar/Sidebar.jsx';
import TopBar from '../TopBar/TopBar';
import ToastContainer from '../../common/Toast/Toast';
import CreateProjectModal from '../../modals/CreateProjectModal/CreateProjectModal';
import AddTaskModal from '../../modals/AddTaskModal/AddTaskModal.jsx';
import './AppLayout.css';

const AppLayout = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

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
            <CreateProjectModal />
            <AddTaskModal />
        </div>
    );
};

export default AppLayout;
