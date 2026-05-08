import { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import { mockUser } from '../../utils/mockData';
import {
    User,
    Building2,
    Shield,
    Bell,
    Globe,
    CreditCard,
    LayoutGrid,
    Check,
    Mail,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const theme = useSelector((state) => state.ui.theme);

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'workspace', label: 'Workspace', icon: Building2 },
        { id: 'modules', label: 'Modules', icon: LayoutGrid },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Manage your account and workspace preferences</p>
            </div>

            <div className="settings-container">
                {/* Sidebar */}
                <aside className="settings-nav glass-card">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <main className="settings-content glass-card">
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Public Profile</h2>
                            
                            <div className="profile-upload">
                                <Avatar name={mockUser.name} size="xl" />
                                <div className="profile-upload-info">
                                    <Button variant="ghost" size="sm">Change Avatar</Button>
                                    <p className="field-hint">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>Full Name</label>
                                    <input type="text" defaultValue={mockUser.name} />
                                </div>
                                <div className="settings-field">
                                    <label>Email Address</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} />
                                        <input type="email" defaultValue={mockUser.email} />
                                    </div>
                                </div>
                                <div className="settings-field">
                                    <label>Job Title</label>
                                    <input type="text" defaultValue="Product Lead" />
                                </div>
                                <div className="settings-field">
                                    <label>Location</label>
                                    <div className="input-with-icon">
                                        <Globe size={16} />
                                        <input type="text" defaultValue="Pakistan" />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-field full-width">
                                <label>Bio</label>
                                <textarea placeholder="Tell us about yourself..." defaultValue="Building the future of work management." />
                            </div>

                            <div className="settings-actions">
                                <Button variant="primary">Save Changes</Button>
                                <Button variant="ghost">Cancel</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Workspace Configuration</h2>
                            
                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>Workspace Name</label>
                                    <input type="text" defaultValue="DevelopWork" />
                                </div>
                                <div className="settings-field">
                                    <label>Workspace URL</label>
                                    <div className="input-group">
                                        <span className="input-prefix">developwork.com/</span>
                                        <input type="text" defaultValue="main" />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-field">
                                <label>Language</label>
                                <select defaultValue="en">
                                    <option value="en">English (US)</option>
                                    <option value="uk">English (UK)</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                </select>
                            </div>

                            <div className="settings-divider" />

                            <h3 className="settings-subsection-title">Appearance</h3>
                            <div className="theme-selector">
                                <div className={`theme-option ${theme === 'light' ? 'selected' : ''}`}>
                                    <div className="theme-preview light" />
                                    <span>Light</span>
                                </div>
                                <div className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}>
                                    <div className="theme-preview dark" />
                                    <span>Dark</span>
                                </div>
                                <div className={`theme-option ${theme === 'glass' ? 'selected' : ''}`}>
                                    <div className="theme-preview glass" />
                                    <span>Glass</span>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <Button variant="primary">Update Workspace</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Security & Password</h2>
                            
                            <div className="settings-field full-width">
                                <label>Current Password</label>
                                <div className="input-with-action">
                                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                                    <button onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>New Password</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                                <div className="settings-field">
                                    <label>Confirm New Password</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="settings-divider" />

                            <h3 className="settings-subsection-title">Two-Factor Authentication</h3>
                            <div className="tfa-box">
                                <div className="tfa-info">
                                    <p className="tfa-status">2FA is currently <span className="disabled">disabled</span></p>
                                    <p className="field-hint">Add an extra layer of security to your account.</p>
                                </div>
                                <Button variant="outline">Enable 2FA</Button>
                            </div>

                            <div className="settings-actions">
                                <Button variant="primary">Update Security</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'modules' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Manage Modules</h2>
                            <p className="settings-section-hint">Enable or disable modules for your workspace.</p>
                            
                            <div className="module-settings-list">
                                {[
                                    { name: 'Project Management', enabled: true, icon: LayoutGrid },
                                    { name: 'Human Resources', enabled: true, icon: User },
                                    { name: 'Finance', enabled: true, icon: CreditCard },
                                    { name: 'CRM & Leads', enabled: false, icon: Globe },
                                    { name: 'Customer Support', enabled: true, icon: Bell },
                                ].map((mod) => (
                                    <div key={mod.name} className="module-setting-item">
                                        <div className="module-setting-info">
                                            <div className="module-setting-icon">
                                                <mod.icon size={18} />
                                            </div>
                                            <span>{mod.name}</span>
                                        </div>
                                        <div className={`module-toggle ${mod.enabled ? 'active' : ''}`}>
                                            <div className="toggle-thumb" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'notifications' || activeTab === 'billing') && (
                        <div className="empty-settings">
                            <p>This setting section is coming soon.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Settings;
