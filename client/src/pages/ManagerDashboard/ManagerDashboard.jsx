import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';

// Import actual module components for 100% feature parity
import ProjectManagement from '../../pages/ProjectManagement/ProjectManagement';
import TaskManagement from '../../pages/TaskManagement/TaskManagement';
import HR from '../../pages/HR/HR';
import Finance from '../../pages/Finance/Finance';
import Leads from '../../pages/Leads/Leads';
import Clients from '../../pages/Clients/Clients';
import Docs from '../../pages/Docs/Docs';

import './ManagerDashboard.css';

const ManagerDashboard = () => {
    const { moduleKey: paramKey } = useParams();
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Map module keys to their respective components
    const moduleComponents = {
        projects: <ProjectManagement />,
        tasks: <TaskManagement />,
        hr: <HR />,
        finance: <Finance />,
        leads: <Leads />,
        clients: <Clients />,
        docs: <Docs />,
        support: <div className="pm__empty">Support module coming soon...</div>
    };

    const accessibleModules = permissionsService.getAccessibleModules(user);
    const defaultModule = accessibleModules[0]?.key || 'projects';

    // Safely extract clean module key
    let activeModule = paramKey;
    if (!activeModule || activeModule.startsWith('[') || !moduleComponents[activeModule]) {
        activeModule = defaultModule;
    }

    // Auto-correct malformed URLs (e.g. /manager/["leads",...] -> /manager/leads)
    useEffect(() => {
        if (paramKey && (paramKey.startsWith('[') || !moduleComponents[paramKey])) {
            navigate(`/manager/${defaultModule}`, { replace: true });
        }
    }, [paramKey, defaultModule, navigate]);

    return (
        <div className="manager-portal-content" style={{ height: '100%' }}>
            {moduleComponents[activeModule] || (
                <div className="pm__empty" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    padding: '80px',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    <ShieldCheck size={64} strokeWidth={1} style={{ marginBottom: '24px', opacity: 0.2 }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Manager Access Portal
                    </h2>
                    <p style={{ maxWidth: '400px', lineHeight: 1.6 }}>
                        Please select a module from the sidebar to access management tools, team reports, and department operations.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
