import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import ToastContainer from '../../common/Toast/Toast';
import CreateProjectModal from '../../modals/CreateProjectModal/CreateProjectModal';
import AddTaskModal from '../../modals/AddTaskModal/AddTaskModal.jsx';
import './AppLayout.css';

const AppLayout = () => {
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className={`app-layout__main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <TopBar />
                <div className="app-layout__content">
                    <Outlet />
                </div>
            </div>
            <ToastContainer />
            <CreateProjectModal />
            <AddTaskModal />
        </div>
    );
};

export default AppLayout;
