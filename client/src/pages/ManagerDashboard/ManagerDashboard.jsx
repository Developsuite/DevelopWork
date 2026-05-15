import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

// Import actual module components for 100% feature parity
import ProjectManagement from '../../pages/ProjectManagement/ProjectManagement';
import HR from '../../pages/HR/HR';
import Finance from '../../pages/Finance/Finance';
import Leads from '../../pages/Leads/Leads';
import Clients from '../../pages/Clients/Clients';
import Docs from '../../pages/Docs/Docs';

import './ManagerDashboard.css';

const ManagerDashboard = () => {
    const { moduleKey } = useParams();
    const { user } = useSelector((state) => state.auth);

    // Map module keys to their respective components
    const moduleComponents = {
        projects: <ProjectManagement />,
        hr: <HR />,
        finance: <Finance />,
        leads: <Leads />,
        clients: <Clients />,
        docs: <Docs />,
        support: <div className="pm__empty">Support module coming soon...</div>
    };

    // Determine the module to show (fallback to user's assigned module if moduleKey is missing)
    const activeModule = moduleKey || user?.assignedModule;

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
