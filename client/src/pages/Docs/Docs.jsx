import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import {
    FileText, Plus, Search, Clock, Share2, Edit3, Folder, MoreVertical, Upload, Download,
    Star, Eye, BookOpen, Layout, File, ChevronRight, ChevronDown, Bold, Italic, List,
    Code, Table, Heading, Minus, Image, Link2, Undo, Redo, Type,
} from 'lucide-react';
import './Docs.css';

const Docs = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'General'
    });
    const [editorContent, setEditorContent] = useState('# Getting Started\n\nWelcome to DevelopWork documentation. Start writing here...\n\n## Features\n\n- **Rich text editing** with markdown support\n- Organize docs in **spaces** and **folders**\n- Share with your team\n\n> 💡 Use the toolbar above to format your content.');
    const [sidebarExpanded, setSidebarExpanded] = useState({ 'Engineering': true, 'Design': false, 'Company': true });

    const tabs = [
        { id: 'all', label: 'All Docs', icon: FileText },
        { id: 'editor', label: 'Editor', icon: Edit3 },
        { id: 'templates', label: 'Templates', icon: Layout },
    ];

    const [docs, setDocs] = useState([
        { id: 1, title: 'Product Roadmap 2026', category: 'Strategy', type: 'document', owner: 'Abbas Khan', lastEdited: '2026-04-17T14:30:00Z', shared: true, sharedWith: 12, starred: true, views: 48, coverColor: '#579BFC',
            versions: [{ v: '3.0', date: '2026-04-17', author: 'Abbas Khan' }, { v: '2.1', date: '2026-04-10', author: 'Sarah Ahmed' }, { v: '1.0', date: '2026-03-01', author: 'Abbas Khan' }] },
        { id: 2, title: 'API Documentation', category: 'Technical', type: 'wiki', owner: 'Ali Hassan', lastEdited: '2026-04-16T10:15:00Z', shared: true, sharedWith: 24, starred: false, views: 156, coverColor: '#A25DDC',
            versions: [{ v: '5.2', date: '2026-04-16', author: 'Ali Hassan' }] },
        { id: 3, title: 'Brand Guidelines v3.0', category: 'Design', type: 'document', owner: 'Sarah Ahmed', lastEdited: '2026-04-15T16:45:00Z', shared: true, sharedWith: 8, starred: true, views: 32, coverColor: '#EC4899',
            versions: [{ v: '3.0', date: '2026-04-15', author: 'Sarah Ahmed' }] },
        { id: 4, title: 'Onboarding Checklist', category: 'HR', type: 'template', owner: 'Omar Raza', lastEdited: '2026-04-14T09:00:00Z', shared: true, sharedWith: 18, starred: false, views: 67, coverColor: '#00C875',
            versions: [{ v: '2.0', date: '2026-04-14', author: 'Omar Raza' }] },
        { id: 5, title: 'Sprint Retrospective — Q1', category: 'General', type: 'document', owner: 'Abbas Khan', lastEdited: '2026-04-17T17:00:00Z', shared: true, sharedWith: 6, starred: false, views: 22, coverColor: '#FDAB3D',
            versions: [{ v: '1.0', date: '2026-04-17', author: 'Abbas Khan' }] },
    ]);

    const handleAddDoc = () => {
        setIsModalOpen(true);
    };

    const handleSaveDoc = () => {
        if (!formData.title) return;
        
        const newDoc = {
            id: Date.now(),
            title: formData.title,
            category: formData.category,
            type: 'document',
            owner: 'Abbas Khan',
            lastEdited: new Date().toISOString(),
            shared: false,
            sharedWith: 0,
            starred: false,
            views: 0,
            coverColor: '#6C7A96',
            versions: [{ v: '1.0', date: new Date().toISOString().split('T')[0], author: 'Abbas Khan' }]
        };
        setDocs(prev => [...prev, newDoc]);
        setActiveTab('editor');
        setEditorContent(`# ${formData.title}\n\nStart writing your content here...`);
        setIsModalOpen(false);
        setFormData({ title: '', category: 'General' });
    };

    const sidebarTree = {
        'Engineering': [{ icon: '📋', name: 'API Documentation' }, { icon: '🔧', name: 'Setup Guide' }, { icon: '🧪', name: 'Testing Standards' }],
        'Design': [{ icon: '🎨', name: 'Brand Guidelines' }, { icon: '📐', name: 'Component Library' }],
        'Company': [{ icon: '📍', name: 'Product Roadmap' }, { icon: '📝', name: 'Meeting Notes' }, { icon: '👋', name: 'Onboarding Checklist' }],
    };

    const templates = [
        { id: 1, name: 'Meeting Notes', desc: 'Structured template for recording meeting agendas, decisions, and action items.', icon: '📝', color: '#579BFC' },
        { id: 2, name: 'Project Brief', desc: 'Define project goals, scope, timeline, and success metrics.', icon: '📋', color: '#00C875' },
        { id: 3, name: 'Sprint Retrospective', desc: 'What went well, what to improve, and action items for next sprint.', icon: '🔄', color: '#FDAB3D' },
        { id: 4, name: 'Onboarding Guide', desc: 'Step-by-step guide for new team member onboarding.', icon: '👋', color: '#A25DDC' },
        { id: 5, name: 'Technical RFC', desc: 'Request for Comments template for architectural decisions.', icon: '🏗️', color: '#E2445C' },
        { id: 6, name: 'Release Notes', desc: 'Template for documenting software releases and changes.', icon: '🚀', color: '#0EA5E9' },
    ];

    const categories = ['all', 'Strategy', 'Technical', 'Design', 'HR', 'General'];
    const filteredDocs = docs.filter(d => {
        const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === 'all' || d.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

    const handleEditorChange = (e) => {
        const val = e.target.value;
        setEditorContent(val);
        
        // Simple slash command detection
        if (val.endsWith('/')) {
            const rect = e.target.getBoundingClientRect();
            setShowSlashMenu(true);
            setSlashPosition({ top: 150, left: 100 }); // Approximate for demo
        } else {
            setShowSlashMenu(false);
        }
    };

    const insertCommand = (cmd) => {
        setEditorContent(prev => prev + cmd);
        setShowSlashMenu(false);
    };

    const getTypeIcon = (t) => ({ document: FileText, wiki: BookOpen, template: Layout }[t] || FileText);

    return (
        <div className="docs-dashboard">
            <div className="docs-dashboard__header">
                <div><h1>Documentation</h1><p>Create, collaborate, and share your team's knowledge</p></div>
                <div className="docs-dashboard__header-actions">
                    <Button variant="ghost" icon={Upload}>Upload</Button>
                    <Button variant="primary" icon={Plus} onClick={handleAddDoc}>New Document</Button>
                </div>
            </div>

            <div className="doc-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`doc-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* === ALL DOCS === */}
            {activeTab === 'all' && (
                <div className="doc-layout">
                    {/* Sidebar Tree */}
                    <aside className="doc-sidebar glass-card">
                        <div className="doc-sidebar__header"><h3>Spaces</h3></div>
                        <div className="doc-sidebar__starred">
                            <h4><Star size={12} /> Starred</h4>
                            {docs.filter(d => d.starred).map(d => (
                                <div key={d.id} className="doc-sidebar__item" onClick={() => setSelectedDoc(d)}><Star size={12} fill="#FDAB3D" color="#FDAB3D" /><span>{d.title}</span></div>
                            ))}
                        </div>
                        {Object.entries(sidebarTree).map(([space, docs]) => (
                            <div key={space} className="doc-sidebar__space">
                                <div className="doc-sidebar__space-header" onClick={() => setSidebarExpanded(prev => ({ ...prev, [space]: !prev[space] }))}>
                                    {sidebarExpanded[space] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <Folder size={14} /><span>{space}</span>
                                </div>
                                {sidebarExpanded[space] && docs.map((doc, i) => (
                                    <div key={i} className="doc-sidebar__item doc-sidebar__item--nested"><span>{doc.icon}</span><span>{doc.name}</span></div>
                                ))}
                            </div>
                        ))}
                    </aside>

                    {/* Main */}
                    <div className="doc-main">
                        <div className="doc-main__header">
                            <div className="doc-search"><Search size={16} /><input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>)}
                            </select>
                        </div>

                        {selectedDoc ? (
                            <div className="doc-detail glass-card">
                                <div className="doc-detail__cover" style={{ background: selectedDoc.coverColor }} />
                                <div className="doc-detail__content">
                                    <div className="doc-detail__header">
                                        <h2>{selectedDoc.title}</h2>
                                        <div className="doc-detail__meta">
                                            <Avatar name={selectedDoc.owner} size="xs" /><span>by {selectedDoc.owner}</span>
                                            <span>·</span><span><Eye size={12} /> {selectedDoc.views} views</span>
                                            <span>·</span><span><Share2 size={12} /> {selectedDoc.sharedWith} people</span>
                                        </div>
                                        <div className="doc-detail__actions">
                                            <Button variant="primary" size="sm" icon={Edit3}>Edit</Button>
                                            <Button variant="ghost" size="sm" icon={Share2}>Share</Button>
                                            <Button variant="ghost" size="sm" icon={Download}>Export PDF</Button>
                                            <button className="doc-back-btn" onClick={() => setSelectedDoc(null)}>← Back</button>
                                        </div>
                                    </div>
                                    <div className="doc-detail__versions">
                                        <h4><Clock size={12} /> Version History</h4>
                                        {selectedDoc.versions.map((v, i) => (
                                            <div key={i} className="doc-version"><span className="doc-version__tag">v{v.v}</span><span>{v.date}</span><span>{v.author}</span>{i === 0 && <Badge variant="status" color="var(--success)">Current</Badge>}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="doc-grid">
                                {filteredDocs.map(doc => {
                                    const TypeIcon = getTypeIcon(doc.type);
                                    return (
                                        <div key={doc.id} className="doc-card glass-card" onClick={() => setSelectedDoc(doc)}>
                                            <div className="doc-card__cover" style={{ background: doc.coverColor }}>
                                                {doc.starred && <Star size={14} fill="#fff" color="#fff" className="doc-card__star" />}
                                            </div>
                                            <div className="doc-card__body">
                                                <h3>{doc.title}</h3>
                                                <div className="doc-card__meta">
                                                    <Badge variant="default">{doc.category}</Badge>
                                                    <span><Eye size={12} /> {doc.views}</span>
                                                </div>
                                                <div className="doc-card__footer">
                                                    <Avatar name={doc.owner} size="xs" />
                                                    <span>{new Date(doc.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === EDITOR === */}
            {activeTab === 'editor' && (
                <div className="doc-editor-container glass-card">
                    <div className="doc-editor-toolbar">
                        {[
                            { icon: Undo, label: 'Undo' }, { icon: Redo, label: 'Redo' }, null,
                            { icon: Heading, label: 'Heading' }, { icon: Bold, label: 'Bold' }, { icon: Italic, label: 'Italic' }, null,
                            { icon: List, label: 'Bullet List' }, { icon: Code, label: 'Code Block' }, { icon: Table, label: 'Table' }, null,
                            { icon: Image, label: 'Image' }, { icon: Link2, label: 'Link' }, { icon: Minus, label: 'Divider' },
                        ].map((item, i) => item ? (
                            <button key={i} className="doc-editor-btn" title={item.label}><item.icon size={16} /></button>
                        ) : (
                            <div key={i} className="doc-editor-divider" />
                        ))}
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <textarea 
                            className="doc-editor-area" 
                            value={editorContent} 
                            onChange={handleEditorChange} 
                            placeholder="Start writing... (Type / for commands)" 
                        />
                        {showSlashMenu && (
                            <div className="doc-slash-menu glass-elevated" style={{ top: slashPosition.top, left: slashPosition.left }}>
                                <div className="doc-slash-menu__header">Basic Blocks</div>
                                <button onClick={() => insertCommand('## ')}><Heading size={14} /> Heading 2</button>
                                <button onClick={() => insertCommand('- ')}><List size={14} /> Bullet List</button>
                                <button onClick={() => insertCommand('```\n\n```')}><Code size={14} /> Code Block</button>
                                <button onClick={() => insertCommand('| Col 1 | Col 2 |\n|---|---|\n| | |')}><Table size={14} /> Table</button>
                            </div>
                        )}
                    </div>
                    <div className="doc-editor-footer">
                        <span><Type size={12} /> {editorContent.length} characters</span>
                        <span>Last saved: just now</span>
                    </div>
                </div>
            )}

            {/* === TEMPLATES === */}
            {activeTab === 'templates' && (
                <div className="doc-templates-grid">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="doc-template-card glass-card">
                            <div className="doc-template-card__icon" style={{ background: `${tpl.color}15`, color: tpl.color }}>{tpl.icon}</div>
                            <h3>{tpl.name}</h3>
                            <p>{tpl.desc}</p>
                            <Button variant="ghost" size="sm">Use Template</Button>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Document"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveDoc} disabled={!formData.title}>Create Document</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Document Title</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Project Plan"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Category / Space</label>
                        <select
                            className="dw-form-input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option>General</option>
                            <option>Engineering</option>
                            <option>Design</option>
                            <option>Company</option>
                            <option>Technical</option>
                            <option>HR</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Docs;
