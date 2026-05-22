import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
    LayoutGrid,
    Settings,
    Zap,
} from 'lucide-react';
import Avatar from '../../common/Avatar/Avatar';
import { mockUser } from '../../../utils/mockData';
import { APP_MODULES } from '../../../utils/constants';
import './IconRail.css';

const iconMap = {
    Home,
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
};

const IconRail = ({ activeModule, onModuleChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const handleModuleClick = (mod) => {
        onModuleChange(mod.key);
        if (mod.route) {
            navigate(mod.route);
        }
    };

    // Determine which module is active based on current route
    const getActiveKey = () => {
        const path = location.pathname;
        const match = APP_MODULES.find((m) => m.route && path.startsWith(m.route));
        return match?.key || 'home';
    };

    const currentActive = getActiveKey();

    return (
        <div className="icon-rail">
            {/* Logo */}
            <div className="icon-rail__logo">
                <div className="icon-rail__logo-icon">
                    <Zap size={18} />
                </div>
            </div>

            {/* Module Icons */}
            <nav className="icon-rail__nav">
                {APP_MODULES.map((mod) => {
                    const Icon = iconMap[mod.icon] || Home;
                    const isActive = currentActive === mod.key;
                    return (
                        <button
                            key={mod.key}
                            className={`icon-rail__btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleModuleClick(mod)}
                            title={mod.label}
                            style={{ '--module-color': mod.color }}
                        >
                            <div className="icon-rail__btn-indicator" />
                            <Icon size={20} />
                            <span className="icon-rail__label">{mod.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="icon-rail__bottom">
                <button
                    className="icon-rail__btn"
                    title="More Apps"
                >
                    <LayoutGrid size={20} />
                    <span className="icon-rail__label">More</span>
                </button>
                <button
                    className="icon-rail__btn"
                    title="Settings"
                >
                    <Settings size={20} />
                    <span className="icon-rail__label">Settings</span>
                </button>
                <div className="icon-rail__avatar">
                    <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" />
                </div>
            </div>
        </div>
    );
};

export default IconRail;
