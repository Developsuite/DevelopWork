import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast, setTheme } from '../../store/slices/uiSlice';
import { toggleModule } from '../../store/slices/accessSlice';
import { updateUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import { mockUser } from '../../utils/mockData';
import { authService } from '../../services/authService';
import { managerService } from '../../services/managerService';
import { DEPARTMENT_MODULES } from '../../utils/constants';
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
    Users,
    UserPlus,
    Pencil,
    Trash2,
    Copy,
    ShieldCheck,
    KeyRound,
    FileText,
} from 'lucide-react';
import './Settings.css';

const moduleIconMap = {
    projects: LayoutGrid,
    hr: User,
    finance: CreditCard,
    leads: Globe,
    clients: Users,
    docs: FileText,
};

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);
    const activeModules = useSelector((state) => state.access.activeModules);
    const dispatch = useDispatch();

    const handleToggleModule = (moduleKey) => {
        dispatch(toggleModule(moduleKey));
    };

    const handleUpdateSecurity = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            dispatch(addToast({ title: 'Validation Error', message: 'All password fields are required.', type: 'error' }));
            return;
        }

        if (newPassword !== confirmPassword) {
            dispatch(addToast({ title: 'Validation Error', message: 'New passwords do not match.', type: 'error' }));
            return;
        }

        if (newPassword.length < 6) {
            dispatch(addToast({ title: 'Validation Error', message: 'Password must be at least 6 characters.', type: 'error' }));
            return;
        }

        setSecurityLoading(true);
        try {
            if (!user?.email) {
                throw new Error('User email not found. Please log in again.');
            }

            // Attempt login to verify current password
            await authService.signInWithEmail(user.email, currentPassword);

            // Update the password
            await authService.updatePassword(newPassword);

            dispatch(addToast({ title: 'Success', message: 'Password updated successfully.', type: 'success' }));
            
            // Clear fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Password update failed:', err);
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to update password.', type: 'error' }));
        } finally {
            setSecurityLoading(false);
        }
    };

    // Workspace state
    const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('dw-workspace-name') || 'DevelopWork');
    const [workspaceUrl, setWorkspaceUrl] = useState(() => localStorage.getItem('dw-workspace-url') || 'main');
    const [workspaceLanguage, setWorkspaceLanguage] = useState(() => localStorage.getItem('dw-workspace-lang') || 'en');
    const [selectedTheme, setSelectedTheme] = useState(theme || 'light');

    // Keep selectedTheme synchronized if theme state changes externally
    useEffect(() => {
        if (theme) {
            setSelectedTheme(theme);
        }
    }, [theme]);

    const handleSelectTheme = (newTheme) => {
        setSelectedTheme(newTheme);
        dispatch(setTheme(newTheme)); // Instant visual preview
    };

    const handleUpdateWorkspace = () => {
        try {
            localStorage.setItem('dw-workspace-name', workspaceName);
            localStorage.setItem('dw-workspace-url', workspaceUrl);
            localStorage.setItem('dw-workspace-lang', workspaceLanguage);
            dispatch(setTheme(selectedTheme));
            
            // Dispatch event to sync other components (like Sidebar)
            window.dispatchEvent(new Event('workspaceUpdate'));
            
            dispatch(addToast({ title: 'Success', message: 'Workspace settings updated successfully.', type: 'success' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: 'Failed to update workspace settings.', type: 'error' }));
        }
    };

    // Manager management state
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isInviteEmployeeModalOpen, setIsInviteEmployeeModalOpen] = useState(false);
    const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState(null);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: 'Manager@123', assignedModule: 'projects' });
    const [inviteEmployeeForm, setInviteEmployeeForm] = useState({ name: '', email: '', password: 'Employee@123' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(null);

    // Profile state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        jobTitle: user?.jobTitle || 'Product Lead',
        location: user?.location || 'Pakistan',
        bio: user?.bio || 'Building the future of work management.',
        avatar: user?.avatar || null
    });
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                jobTitle: user.jobTitle || 'Product Lead',
                location: user.location || 'Pakistan',
                bio: user.bio || 'Building the future of work management.',
                avatar: user.avatar || null
            }));
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 800 * 1024) {
            dispatch(addToast({ title: 'Validation Error', message: 'Image size must be less than 800KB.', type: 'error' }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setProfileForm(prev => ({
                ...prev,
                avatar: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setProfileLoading(true);
        const userId = user._id || user.id;
        try {
            // Attempt to update all profile fields on Supabase.
            // Fallback gracefully to updating only name/location/avatar if bio/job_title columns are not in DB.
            let updatedData;
            const updates = {
                name: profileForm.name,
                location: profileForm.location,
                avatar_url: profileForm.avatar,
            };

            try {
                updatedData = await authService.updateProfile(userId, {
                    ...updates,
                    job_title: profileForm.jobTitle,
                    bio: profileForm.bio,
                });
            } catch (dbErr) {
                console.warn('DB columns job_title/bio might be missing, falling back:', dbErr);
                
                // Save missing columns locally
                localStorage.setItem(`dw-profile-job-title-${userId}`, profileForm.jobTitle);
                localStorage.setItem(`dw-profile-bio-${userId}`, profileForm.bio);
                
                updatedData = await authService.updateProfile(userId, updates);
                
                updatedData = {
                    ...updatedData,
                    job_title: profileForm.jobTitle,
                    bio: profileForm.bio,
                };
            }

            // Sync updated profile to Redux user store
            dispatch(updateUser({
                name: updatedData.name,
                location: updatedData.location,
                avatar: updatedData.avatar_url || profileForm.avatar,
                jobTitle: updatedData.job_title || profileForm.jobTitle,
                bio: updatedData.bio || profileForm.bio,
            }));

            dispatch(addToast({ title: 'Success', message: 'Profile updated successfully.', type: 'success' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to update profile.', type: 'error' }));
        } finally {
            setProfileLoading(false);
        }
    };

    const loadData = async () => {
        try {
            const [mgrData, empData] = await Promise.all([
                managerService.getManagers(),
                managerService.getEmployees()
            ]);
            setManagers(mgrData);
            setEmployees(empData);
        } catch (err) {
            console.error('Failed to load team data:', err);
        }
    };

    useEffect(() => { if (activeTab === 'team') loadData(); }, [activeTab]);

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'workspace', label: 'Workspace', icon: Building2, adminOnly: true },
        { id: 'team', label: 'Team & Managers', icon: Users, adminOnly: true },
        { id: 'modules', label: 'Modules', icon: LayoutGrid, adminOnly: true },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard, adminOnly: true },
    ].filter(tab => !tab.adminOnly || user?.role === 'admin');

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
                                <Avatar name={profileForm.name} src={profileForm.avatar} size="xl" />
                                <div className="profile-upload-info">
                                    <input 
                                        type="file" 
                                        id="avatar-file-input" 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                        onChange={handleAvatarChange} 
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => document.getElementById('avatar-file-input').click()}
                                    >
                                        Change Avatar
                                    </Button>
                                    <p className="field-hint">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.name} 
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Email Address</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} />
                                        <input 
                                            type="email" 
                                            value={profileForm.email} 
                                            readOnly 
                                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                                <div className="settings-field">
                                    <label>Job Title</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.jobTitle} 
                                        onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Location</label>
                                    <div className="input-with-icon">
                                        <Globe size={16} />
                                        <input 
                                            type="text" 
                                            value={profileForm.location} 
                                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-field full-width">
                                <label>Bio</label>
                                <textarea 
                                    placeholder="Tell us about yourself..." 
                                    value={profileForm.bio} 
                                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                />
                            </div>

                            <div className="settings-actions">
                                <Button 
                                    variant="primary" 
                                    onClick={handleUpdateProfile}
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button variant="ghost" onClick={() => setProfileForm({
                                    name: user?.name || '',
                                    email: user?.email || '',
                                    jobTitle: user?.jobTitle || 'Product Lead',
                                    location: user?.location || 'Pakistan',
                                    bio: user?.bio || 'Building the future of work management.'
                                })}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Workspace Configuration</h2>
                            
                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>Workspace Name</label>
                                    <input 
                                        type="text" 
                                        value={workspaceName} 
                                        onChange={(e) => setWorkspaceName(e.target.value)} 
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Workspace URL</label>
                                    <div className="input-group">
                                        <span className="input-prefix">developwork.com/</span>
                                        <input 
                                            type="text" 
                                            value={workspaceUrl} 
                                            onChange={(e) => setWorkspaceUrl(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-field">
                                <label>Language</label>
                                <select 
                                    value={workspaceLanguage} 
                                    onChange={(e) => setWorkspaceLanguage(e.target.value)}
                                >
                                    <option value="en">English (US)</option>
                                    <option value="uk">English (UK)</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                </select>
                            </div>

                            <div className="settings-divider" />

                            <h3 className="settings-subsection-title">Appearance</h3>
                            <div className="theme-selector">
                                <div 
                                    className={`theme-option ${selectedTheme === 'light' ? 'selected' : ''}`}
                                    onClick={() => handleSelectTheme('light')}
                                >
                                    <div className="theme-preview light" />
                                    <span>Light</span>
                                </div>
                                <div 
                                    className={`theme-option ${selectedTheme === 'dark' ? 'selected' : ''}`}
                                    onClick={() => handleSelectTheme('dark')}
                                >
                                    <div className="theme-preview dark" />
                                    <span>Dark</span>
                                </div>
                                <div 
                                    className={`theme-option ${selectedTheme === 'glass' ? 'selected' : ''}`}
                                    onClick={() => handleSelectTheme('glass')}
                                >
                                    <div className="theme-preview glass" />
                                    <span>Glass</span>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <Button variant="primary" onClick={handleUpdateWorkspace}>Update Workspace</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Security & Password</h2>
                            
                            <div className="settings-field full-width">
                                <label>Current Password</label>
                                <div className="input-with-action">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="••••••••" 
                                        value={currentPassword} 
                                        onChange={(e) => setCurrentPassword(e.target.value)} 
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <div className="settings-field">
                                    <label>New Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                    />
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
                                <Button variant="primary" onClick={handleUpdateSecurity} disabled={securityLoading}>
                                    {securityLoading ? 'Updating...' : 'Update Security'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'modules' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Manage Modules</h2>
                            <p className="settings-section-hint">Enable or disable modules for your workspace.</p>
                            
                            <div className="module-settings-list">
                                {DEPARTMENT_MODULES.map((mod) => {
                                    const isEnabled = activeModules.includes(mod.key);
                                    const IconComponent = moduleIconMap[mod.key] || LayoutGrid;
                                    return (
                                        <div key={mod.key} className="module-setting-item">
                                            <div className="module-setting-info">
                                                <div className="module-setting-icon" style={{ color: mod.color }}>
                                                    <IconComponent size={18} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mod.description}</span>
                                                </div>
                                            </div>
                                            <div 
                                                className={`module-toggle ${isEnabled ? 'active' : ''}`}
                                                onClick={() => handleToggleModule(mod.key)}
                                            >
                                                <div className="toggle-thumb" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'notifications' || activeTab === 'billing') && (
                        <div className="empty-settings">
                            <p>This setting section is coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="settings-section">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                                <div>
                                    <h2 className="settings-section-title" style={{marginBottom:'4px'}}>Team Directory</h2>
                                    <p className="settings-section-hint">Invite managers and employees. Assign modules and tasks to your team.</p>
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <Button variant="ghost" icon={UserPlus} onClick={() => { setInviteEmployeeForm({ name: '', email: '', password: 'Employee@123' }); setInviteSuccess(null); setIsInviteEmployeeModalOpen(true); }}>Invite Employee</Button>
                                    <Button variant="primary" icon={UserPlus} onClick={() => { setInviteForm({ name: '', email: '', password: 'Manager@123', assignedModule: 'projects' }); setInviteSuccess(null); setIsInviteModalOpen(true); }}>Invite Manager</Button>
                                </div>
                            </div>

                            <h3 className="settings-subsection-title" style={{marginBottom: '16px'}}>Managers</h3>
                            {managers.length === 0 && (
                                <div className="empty-settings" style={{padding:'40px', marginBottom: '24px'}}>
                                    <ShieldCheck size={36} style={{opacity:0.2, marginBottom:'12px'}}/>
                                    <p style={{fontWeight:600, marginBottom:'4px'}}>No managers yet</p>
                                </div>
                            )}

                            {managers.length > 0 && (
                                <div className="module-settings-list">
                                    {managers.map(m => {
                                        const mod = DEPARTMENT_MODULES.find(dm => dm.key === m.assigned_module);
                                        return (
                                            <div key={m.id} className="module-setting-item" style={{padding:'16px 20px'}}>
                                                <div style={{display:'flex', alignItems:'center', gap:'14px', flex:1}}>
                                                    <Avatar name={m.name || 'M'} size="sm" />
                                                    <div>
                                                        <div style={{fontWeight:700, fontSize:'14px', color:'var(--text-primary)'}}>{m.name}</div>
                                                        <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'2px'}}>{m.email}</div>
                                                    </div>
                                                </div>
                                                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                                    <span style={{padding:'4px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:700, textTransform:'uppercase', background: mod ? 'rgba(87,155,252,0.08)' : 'rgba(0,0,0,0.04)', color: mod?.color || 'var(--text-muted)'}}>
                                                        {mod?.label || m.assigned_module || 'None'}
                                                    </span>
                                                    <button className="brd__icon-btn" onClick={() => { setEditingManager(m); setIsEditModuleModalOpen(true); }} title="Change module"><Pencil size={14}/></button>
                                                    <button className="brd__icon-btn danger" onClick={async () => {
                                                        if (!window.confirm(`Revoke manager access for ${m.name}? They will be demoted to employee.`)) return;
                                                        try {
                                                            await managerService.revokeManager(m.id);
                                                            dispatch(addToast({ title: 'Revoked', message: `${m.name} is no longer a manager.`, type: 'info' }));
                                                            loadData();
                                                        } catch(err) {
                                                            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                                                        }
                                                    }} title="Revoke access"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <h3 className="settings-subsection-title" style={{marginTop: '32px', marginBottom: '16px'}}>Employees</h3>
                            {employees.length === 0 && (
                                <div className="empty-settings" style={{padding:'40px'}}>
                                    <Users size={36} style={{opacity:0.2, marginBottom:'12px'}}/>
                                    <p style={{fontWeight:600, marginBottom:'4px'}}>No employees yet</p>
                                    <p>Invite employees to assign them tasks.</p>
                                </div>
                            )}
                            
                            {employees.length > 0 && (
                                <div className="module-settings-list">
                                    {employees.map(e => (
                                        <div key={e.id} className="module-setting-item" style={{padding:'16px 20px'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'14px', flex:1}}>
                                                <Avatar name={e.name || 'E'} size="sm" />
                                                <div>
                                                    <div style={{fontWeight:700, fontSize:'14px', color:'var(--text-primary)'}}>{e.name}</div>
                                                    <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'2px'}}>{e.email}</div>
                                                </div>
                                            </div>
                                                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                                                    <div style={{fontSize:'13px', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:'6px'}}>
                                                        <User size={14} /> Employee
                                                    </div>
                                                    <button className="brd__icon-btn danger" onClick={async () => {
                                                        if (!window.confirm(`Are you sure you want to completely remove ${e.name}? They will lose all access.`)) return;
                                                        try {
                                                            await managerService.removeUser(e.id);
                                                            dispatch(addToast({ title: 'Deleted', message: `${e.name} has been removed from the system.`, type: 'info' }));
                                                            loadData();
                                                        } catch(err) {
                                                            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                                                        }
                                                    }} title="Remove Employee"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Invite Manager Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={() => { setIsInviteModalOpen(false); setInviteSuccess(null); }} title="Invite Manager">
                <div className="dw-form">
                    {!inviteSuccess ? (
                        <>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Full Name</label>
                                <input className="dw-form-input" placeholder="e.g. Ali Hassan" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Email Address</label>
                                <input type="email" className="dw-form-input" placeholder="manager@company.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Default Password</label>
                                <input type="text" className="dw-form-input" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} />
                                <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'4px'}}>The manager will use this password to log in for the first time.</p>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Assign Module</label>
                                <select className="dw-form-input" value={inviteForm.assignedModule} onChange={e => setInviteForm({...inviteForm, assignedModule: e.target.value})}>
                                    {DEPARTMENT_MODULES.map(m => (
                                        <option key={m.key} value={m.key}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)} fullWidth>Cancel</Button>
                                <Button variant="primary" onClick={async () => {
                                    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
                                        dispatch(addToast({ title: 'Validation', message: 'All fields are required.', type: 'error' }));
                                        return;
                                    }
                                    setInviteLoading(true);
                                    try {
                                        await managerService.inviteManager(inviteForm);
                                        setInviteSuccess({ email: inviteForm.email, password: inviteForm.password, name: inviteForm.name, module: DEPARTMENT_MODULES.find(m => m.key === inviteForm.assignedModule)?.label });
                                        dispatch(addToast({ title: 'Manager Invited', message: `${inviteForm.name} has been added as a manager.`, type: 'success' }));
                                        loadData();
                                    } catch(err) {
                                        dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                                    } finally {
                                        setInviteLoading(false);
                                    }
                                }} fullWidth disabled={inviteLoading}>{inviteLoading ? 'Creating...' : 'Create Manager Account'}</Button>
                            </div>
                        </>
                    ) : (
                        <div style={{textAlign:'center'}}>
                            <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                                <Check size={28} color="#10b981" />
                            </div>
                            <h3 style={{fontSize:'18px', fontWeight:700, marginBottom:'8px', color:'var(--text-primary)'}}>Manager Account Created!</h3>
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'24px'}}>Share these credentials with <strong>{inviteSuccess.name}</strong>:</p>

                            <div style={{background:'var(--bg-secondary)', borderRadius:'12px', padding:'20px', textAlign:'left', marginBottom:'20px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                                    <div>
                                        <div style={{fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'4px'}}>Email</div>
                                        <div style={{fontSize:'14px', fontWeight:600, color:'var(--text-primary)'}}>{inviteSuccess.email}</div>
                                    </div>
                                    <button style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'4px'}} onClick={() => { navigator.clipboard.writeText(inviteSuccess.email); dispatch(addToast({title:'Copied', message:'Email copied to clipboard', type:'info'})); }}><Copy size={14}/></button>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                                    <div>
                                        <div style={{fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'4px'}}>Password</div>
                                        <div style={{fontSize:'14px', fontWeight:600, color:'var(--text-primary)', fontFamily:'monospace'}}>{inviteSuccess.password}</div>
                                    </div>
                                    <button style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'4px'}} onClick={() => { navigator.clipboard.writeText(inviteSuccess.password); dispatch(addToast({title:'Copied', message:'Password copied to clipboard', type:'info'})); }}><Copy size={14}/></button>
                                </div>
                                <div>
                                    <div style={{fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'4px'}}>Assigned Module</div>
                                    <div style={{fontSize:'14px', fontWeight:600, color:'var(--text-primary)'}}>{inviteSuccess.module}</div>
                                </div>
                            </div>

                            <Button variant="primary" onClick={() => { setIsInviteModalOpen(false); setInviteSuccess(null); }} fullWidth>Done</Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Invite Employee Modal */}
            <Modal isOpen={isInviteEmployeeModalOpen} onClose={() => setIsInviteEmployeeModalOpen(false)} title="Invite New Employee">
                <div className="dw-form">
                    {!inviteSuccess ? (
                        <>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Full Name</label>
                                <input type="text" className="dw-form-input" placeholder="e.g. Ali Hassan" value={inviteEmployeeForm.name} onChange={e => setInviteEmployeeForm({...inviteEmployeeForm, name: e.target.value})} />
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Email Address</label>
                                <input type="email" className="dw-form-input" placeholder="employee@company.com" value={inviteEmployeeForm.email} onChange={e => setInviteEmployeeForm({...inviteEmployeeForm, email: e.target.value})} />
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Default Password</label>
                                <input type="text" className="dw-form-input" value={inviteEmployeeForm.password} onChange={e => setInviteEmployeeForm({...inviteEmployeeForm, password: e.target.value})} />
                                <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'4px'}}>They will use this to log in initially.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <Button variant="ghost" onClick={() => setIsInviteEmployeeModalOpen(false)} fullWidth>Cancel</Button>
                                <Button variant="primary" onClick={async () => {
                                    if (!inviteEmployeeForm.name || !inviteEmployeeForm.email || !inviteEmployeeForm.password) {
                                        dispatch(addToast({ title: 'Validation', message: 'All fields are required.', type: 'error' }));
                                        return;
                                    }
                                    setInviteLoading(true);
                                    try {
                                        await managerService.inviteEmployee(inviteEmployeeForm);
                                        setInviteSuccess({ email: inviteEmployeeForm.email, password: inviteEmployeeForm.password, name: inviteEmployeeForm.name, role: 'Employee' });
                                        dispatch(addToast({ title: 'Employee Invited', message: `${inviteEmployeeForm.name} has been added.`, type: 'success' }));
                                        loadData();
                                    } catch(err) {
                                        dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                                    } finally {
                                        setInviteLoading(false);
                                    }
                                }} fullWidth disabled={inviteLoading}>{inviteLoading ? 'Creating...' : 'Create Account'}</Button>
                            </div>
                        </>
                    ) : (
                        <div style={{textAlign:'center'}}>
                            <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                                <Check size={28} color="#10b981" />
                            </div>
                            <h3 style={{fontSize:'18px', fontWeight:700, marginBottom:'8px', color:'var(--text-primary)'}}>Employee Account Created!</h3>
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'24px'}}>Share these credentials with <strong>{inviteSuccess.name}</strong>:</p>

                            <div style={{background:'var(--bg-secondary)', borderRadius:'12px', padding:'20px', textAlign:'left', marginBottom:'20px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                                    <div>
                                        <div style={{fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'4px'}}>Email</div>
                                        <div style={{fontSize:'14px', fontWeight:600, color:'var(--text-primary)'}}>{inviteSuccess.email}</div>
                                    </div>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                                    <div>
                                        <div style={{fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'4px'}}>Password</div>
                                        <div style={{fontSize:'14px', fontWeight:600, color:'var(--text-primary)', fontFamily:'monospace'}}>{inviteSuccess.password}</div>
                                    </div>
                                </div>
                            </div>

                            <Button variant="primary" onClick={() => { setIsInviteEmployeeModalOpen(false); setInviteSuccess(null); }} fullWidth>Done</Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Edit Module Modal */}
            <Modal isOpen={isEditModuleModalOpen} onClose={() => setIsEditModuleModalOpen(false)} title="Change Assigned Module">
                {editingManager && (
                    <div className="dw-form">
                        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', padding:'16px', background:'var(--bg-secondary)', borderRadius:'12px'}}>
                            <Avatar name={editingManager.name} size="sm" />
                            <div>
                                <div style={{fontWeight:700, fontSize:'14px'}}>{editingManager.name}</div>
                                <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{editingManager.email}</div>
                            </div>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">New Module Assignment</label>
                            <select key={editingManager.id} className="dw-form-input" defaultValue={editingManager.assigned_module || editingManager.assignedModule} id="edit-module-select">
                                {DEPARTMENT_MODULES.map(m => (
                                    <option key={m.key} value={m.key}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <Button variant="ghost" onClick={() => setIsEditModuleModalOpen(false)} fullWidth>Cancel</Button>
                            <Button variant="primary" onClick={async () => {
                                const newModule = document.getElementById('edit-module-select').value;
                                try {
                                    await managerService.updateManagerModule(editingManager.id, newModule);
                                    dispatch(addToast({ title: 'Updated', message: `${editingManager.name} now manages ${DEPARTMENT_MODULES.find(m=>m.key===newModule)?.label}.`, type: 'success' }));
                                    setIsEditModuleModalOpen(false);
                                    loadData();
                                } catch(err) {
                                    dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                                }
                            }} fullWidth>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Settings;
