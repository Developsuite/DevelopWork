import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/uiSlice';
import { docsService } from '../../services/docsService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import {
    FileText, Plus, Search, Clock, Share2, Edit3, Folder, MoreVertical, Upload, Download,
    Star, Eye, BookOpen, Layout, File, ChevronRight, ChevronDown, Bold, Italic, List,
    Code, Table, Heading, Minus, Image, Link2, Undo, Redo, Type, ArrowLeft, ArrowUp, ArrowDown, ArrowRight,
    Rows, Columns, ClipboardList, RefreshCcw, UserPlus, Cpu, Rocket, Trash2, LayoutGrid
} from 'lucide-react';
import tpl1 from '../../assets/templates/1.png';
import tpl2 from '../../assets/templates/2.png';
import tpl3 from '../../assets/templates/3.png';
import tpl4 from '../../assets/templates/4.png';
import tpl5 from '../../assets/templates/5.png';
import tpl6 from '../../assets/templates/6.png';
import './Docs.css';
import html2pdf from 'html2pdf.js';

const Docs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('all');
    const [activeFolder, setActiveFolder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const editorRef = useRef(null);
    const editorContentRef = useRef('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [viewType, setViewType] = useState('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderList, setFolderList] = useState(['Strategy', 'Technical', 'Design', 'HR', 'General']);
    const [editingDocId, setEditingDocId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateFolder, setTemplateFolder] = useState('General');
    const [formData, setFormData] = useState({
        title: '',
        category: 'General'
    });
    const [editorContent, setEditorContent] = useState('# Getting Started\n\nWelcome to DevelopWork documentation. Start writing here...\n\n## Features\n\n- **Rich text editing** with markdown support\n- Organize docs in **spaces** and **folders**\n- Share with your team\n\n> 💡 Use the toolbar above to format your content.');
    const [sidebarExpanded, setSidebarExpanded] = useState({ 'Engineering': true, 'Design': false, 'Company': true });

    const tabs = [
        { id: 'all', label: 'All Docs', icon: FileText },
        { id: 'templates', label: 'Templates', icon: Layout },
    ];

    const [docs, setDocs] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    const loadDocs = useCallback(async () => {
        try {
            const data = await docsService.getDocuments();
            // Fetch versions for all docs (in a real app, load these on demand)
            const docsWithVersions = await Promise.all(data.map(async (doc) => {
                const versions = await docsService.getVersions(doc.id);
                return { 
                    ...doc, 
                    versions: versions.map(v => ({ v: v.version, date: v.created_at, author: v.author_name })),
                    owner: doc.owner_name,
                    lastEdited: doc.updated_at
                };
            }));
            setDocs(docsWithVersions);
            window.dispatchEvent(new Event('docsChanged'));
        } catch (err) { console.error('Error loading documents:', err); }
    }, []);

    const loadFolders = useCallback(async () => {
        try {
            const data = await docsService.getFolders();
            const defaultFolders = ['Strategy', 'Technical', 'Design', 'HR', 'General'];
            let dbFolders = [];
            if (data && data.length > 0) {
                dbFolders = data.map(f => f.name);
            }
            // Merge defaults and db folders, removing any duplicates
            const allFolders = [...new Set([...defaultFolders, ...dbFolders])];
            setFolderList(allFolders);
        } catch (err) { console.error('Error loading folders:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setDataLoading(true);
            await Promise.all([loadDocs(), loadFolders()]);
            setDataLoading(false);
        };
        loadAll();
    }, [loadDocs, loadFolders]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // Handle tab selection
        const tab = params.get('tab');
        if (tab && ['all', 'editor', 'templates'].includes(tab)) {
            setActiveTab(tab);
        } else {
            setActiveTab('all');
        }

        // Handle document selection
        const docId = params.get('doc');
        if (docId) {
            const doc = docs.find(d => d.id === parseInt(docId, 10));
            if (doc) setSelectedDoc(doc);
        }

        // Handle folder selection
        const folder = params.get('folder');
        if (folder) {
            setActiveFolder(folder);
            // Only clear selected doc if there's no docId in the URL
            if (!docId && !tab) {
                setSelectedDoc(null);
            }
        } else if (!tab && !docId) {
            setActiveFolder(null);
            setSelectedDoc(null);
        }
    }, [location.search, docs]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveFromEditor();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingDocId, editorContent, selectedDoc]);

    // Ensure editor content is loaded when switching to editor tab or changing docs
    useEffect(() => {
        if (activeTab === 'editor' && editorRef.current) {
            // Always sync if we have a specific doc being edited
            if (editorContentRef.current) {
                editorRef.current.innerHTML = editorContentRef.current;
            }
        }
    }, [activeTab, editingDocId]);

    const handleAddDoc = () => {
        setFormData(prev => ({
            ...prev,
            category: activeFolder || 'General'
        }));
        setIsModalOpen(true);
    };

    const handleAddFolder = () => {
        setIsFolderModalOpen(true);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await docsService.createFolder(newFolderName);
            await loadFolders();
            dispatch(addToast({ title: 'Folder Created', message: `${newFolderName} folder created successfully.`, type: 'success' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsFolderModalOpen(false);
        setNewFolderName('');
    };

    const handleEditDoc = (doc) => {
        const htmlContent = doc.content || `<h1>${doc.title}</h1><p>Start writing here...</p>`;
        editorContentRef.current = htmlContent;
        setEditingDocId(doc.id);
        setSelectedDoc(doc);
        setActiveTab('editor');
        setIsDirty(false);
        navigate(`/docs?tab=editor${activeFolder ? `&folder=${activeFolder}` : ''}`);
    };

    const handleSaveContent = async () => {
        if (!selectedDoc) return;
        setIsSaving(true);
        try {
            await docsService.updateDocument(selectedDoc.id, {
                content: editorContentRef.current
            });
            // Record a version
            await docsService.createVersion({
                document_id: selectedDoc.id,
                version: `${(selectedDoc.versions?.length || 0) + 1}.0`,
                author_name: 'Current User' // Replace with actual user
            });
            await loadDocs();
            setIsDirty(false);
            dispatch(addToast({ title: 'Saved', message: 'Document content has been saved successfully.', type: 'success' }));
            
            // Redirect back to the document view page
            navigate(`/docs?doc=${selectedDoc.id}${activeFolder ? `&folder=${activeFolder}` : ''}`);
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveFromEditor = () => {
        if (editingDocId) {
            handleSaveContent();
        } else {
            setIsModalOpen(true);
        }
    };

    const handleExportPDF = () => {
        if (!selectedDoc) return;
        
        // Create a temporary container with the document content
        const container = document.createElement('div');
        container.innerHTML = `
            <div style="font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e;">
                <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #0f172a;">${selectedDoc.title}</h1>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                    <span>Author: ${selectedDoc.owner || 'Unknown'}</span>
                    <span style="margin: 0 12px;">•</span>
                    <span>Folder: ${selectedDoc.category || 'General'}</span>
                    <span style="margin: 0 12px;">•</span>
                    <span>Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style="font-size: 14px; line-height: 1.7; color: #334155;">
                    ${selectedDoc.content || '<p>No content available.</p>'}
                </div>
            </div>
        `;

        const opt = {
            margin: [10, 15, 10, 15],
            filename: `${selectedDoc.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        dispatch(addToast({ title: 'Exporting...', message: 'Generating PDF, please wait.', type: 'info' }));

        html2pdf().set(opt).from(container).save().then(() => {
            dispatch(addToast({ title: 'PDF Exported', message: `${selectedDoc.title}.pdf has been downloaded.`, type: 'success' }));
        }).catch((err) => {
            dispatch(addToast({ title: 'Export Failed', message: err.message || 'Could not generate PDF.', type: 'error' }));
        });
    };

    const handleDeleteDoc = async (id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await docsService.deleteDocument(id);
                await loadDocs();
                if (selectedDoc && selectedDoc.id === id) {
                    setSelectedDoc(null);
                    setEditingDocId(null);
                    setActiveTab('all');
                    if (activeFolder) {
                        navigate(`/docs?folder=${activeFolder}`);
                    } else {
                        navigate('/docs');
                    }
                }
                setSelectedDocIds(prev => prev.filter(docId => docId !== id));
                dispatch(addToast({ title: 'Document Deleted', message: 'The document has been removed.', type: 'info' }));
            } catch (err) {
                dispatch(addToast({ title: 'Error', message: err.message || 'Failed to delete document.', type: 'error' }));
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDocIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedDocIds.length} document(s)?`)) {
            try {
                for (const id of selectedDocIds) {
                    await docsService.deleteDocument(id);
                }
                await loadDocs();
                setSelectedDocIds([]);
                if (selectedDoc && selectedDocIds.includes(selectedDoc.id)) {
                    setSelectedDoc(null);
                    setEditingDocId(null);
                    setActiveTab('all');
                    if (activeFolder) {
                        navigate(`/docs?folder=${activeFolder}`);
                    } else {
                        navigate('/docs');
                    }
                }
                dispatch(addToast({ title: 'Documents Deleted', message: `${selectedDocIds.length} document(s) removed.`, type: 'info' }));
            } catch (err) {
                dispatch(addToast({ title: 'Error', message: err.message || 'Failed to delete some documents.', type: 'error' }));
            }
        }
    };

    const handleToggleSelectDoc = (id, e) => {
        e.stopPropagation();
        setSelectedDocIds(prev => 
            prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
        );
    };

    const handleSelectAllDocs = (docsInView) => {
        if (selectedDocIds.length === docsInView.length) {
            setSelectedDocIds([]);
        } else {
            setSelectedDocIds(docsInView.map(d => d.id));
        }
    };

    const handleDeleteFolder = async (folderName) => {
        if (window.confirm(`Are you sure you want to delete the folder "${folderName}"? Documents will be moved to General.`)) {
            try {
                // Move docs in DB first
                const docsInFolder = docs.filter(d => d.category === folderName);
                for (const doc of docsInFolder) {
                    await docsService.updateDocument(doc.id, { category: 'General' });
                }
                // Try to delete from DB (might fail if it's a default non-DB folder, which is fine, we just ignore)
                try {
                    await docsService.deleteFolder(folderName);
                } catch (e) { /* Ignore if not in DB */ }
                
                await loadDocs();
                await loadFolders();
                setActiveFolder(null);
                dispatch(addToast({ title: 'Folder Deleted', message: `Folder "${folderName}" has been removed.`, type: 'info' }));
            } catch (err) {
                dispatch(addToast({ title: 'Error', message: err.message || 'Failed to delete folder.', type: 'error' }));
            }
        }
    };

    const handleSaveDoc = async () => {
        if (!formData.title) return;
        try {
            if (editingDocId) {
                await docsService.updateDocument(editingDocId, {
                    title: formData.title,
                    category: formData.category,
                });
                dispatch(addToast({ title: 'Document Updated', message: 'Document details have been saved.', type: 'success' }));
            } else {
                await docsService.createDocument({
                    title: formData.title,
                    category: formData.category,
                    type: 'document',
                    owner_name: 'Current User', // Replace with actual user when available
                    content: '',
                    shared: false,
                    views: 0
                });
                dispatch(addToast({ title: 'Document Created', message: 'New document has been created.', type: 'success' }));
            }
            await loadDocs();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsModalOpen(false);
        setEditingDocId(null);
        setFormData({ title: '', category: 'General' });
    };

    const sidebarTree = {
        'Engineering': [{ icon: '📋', name: 'API Documentation' }, { icon: '🔧', name: 'Setup Guide' }, { icon: '🧪', name: 'Testing Standards' }],
        'Design': [{ icon: '🎨', name: 'Brand Guidelines' }, { icon: '📐', name: 'Component Library' }],
        'Company': [{ icon: '📍', name: 'Product Roadmap' }, { icon: '📝', name: 'Meeting Notes' }, { icon: '👋', name: 'Onboarding Checklist' }],
    };

    const templates = [
        { id: 1, name: 'Meeting Notes', desc: 'Structured template for recording meeting agendas, decisions, and action items.', icon: tpl1, color: '#579BFC', content: `
            <h1>📝 Meeting Notes</h1>
            <h2>Meeting Details</h2>
            <p><b>Meeting Title:</b> </p>
            <p><b>Date:</b> </p>
            <p><b>Time:</b> </p>
            <p><b>Location / Platform:</b> </p>
            <p><b>Meeting Organizer:</b> </p>
            <p><b>Attendees:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Agenda</h2>
            <ol>
              <li></li>
              <li></li>
              <li></li>
            </ol>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Discussion Points</h2>
            <h3>Topic 1:</h3>
            <ul>
              <li>Notes:</li>
            </ul>
            <h3>Topic 2:</h3>
            <ul>
              <li>Notes:</li>
            </ul>
            <h3>Topic 3:</h3>
            <ul>
              <li>Notes:</li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Decisions Made</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Decision</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Owner</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Date</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Action Items</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Task</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Assigned To</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Deadline</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Status</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Next Meeting</h2>
            <p><b>Date:</b> </p>
            <p><b>Time:</b> </p>
            <p><b>Agenda Preview:</b> </p>
        ` },
        { id: 2, name: 'Project Brief', desc: 'Define project goals, scope, timeline, and success metrics.', icon: tpl2, color: '#00C875', content: `
            <h1>🚀 Project Brief</h1>
            <h2>Project Overview</h2>
            <p><b>Project Name:</b> </p>
            <p><b>Project Owner:</b> </p>
            <p><b>Start Date:</b> </p>
            <p><b>Expected End Date:</b> </p>
            <p><b>Department / Team:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Project Background</h2>
            <p>Write a short explanation of why this project is needed.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Project Goals</h2>
            <ol>
              <li></li>
              <li></li>
              <li></li>
            </ol>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Project Scope</h2>
            <h3>Included:</h3>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <h3>Not Included:</h3>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Target Users / Audience</h2>
            <p>Describe who will use or benefit from this project.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Key Features / Deliverables</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Deliverable</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Description</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Priority</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Timeline</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Phase</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Start Date</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">End Date</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Status</th>
              </tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Planning</td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Design</td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Development</td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Testing</td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Launch</td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Success Metrics</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Risks & Challenges</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Risk</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Impact</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Solution</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
        ` },
        { id: 3, name: 'Sprint Retrospective', desc: 'What went well, what to improve, and action items for next sprint.', icon: tpl3, color: '#FDAB3D', content: `
            <h1>🔄 Sprint Retrospective</h1>
            <h2>Sprint Details</h2>
            <p><b>Sprint Name / Number:</b> </p>
            <p><b>Sprint Duration:</b> </p>
            <p><b>Team:</b> </p>
            <p><b>Scrum Master / Lead:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Sprint Goal</h2>
            <p>Write the main goal of this sprint.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>What Went Well?</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>What Did Not Go Well?</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>What Can Be Improved?</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Completed Work</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Task</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Owner</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Status</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Pending Work</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Task</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Reason</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Next Step</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Action Items for Next Sprint</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Action Item</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Assigned To</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Deadline</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Team Feedback</h2>
            <p>Add general comments, suggestions, or concerns from the team.</p>
        ` },
        { id: 4, name: 'Onboarding Guide', desc: 'Step-by-step guide for new team member onboarding.', icon: tpl4, color: '#A25DDC', content: `
            <h1>👋 Onboarding Guide</h1>
            <h2>Welcome Message</h2>
            <p>Welcome to the team! This guide will help you understand your role, tools, team structure, and first steps.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Employee / Member Details</h2>
            <p><b>Name:</b> </p>
            <p><b>Role:</b> </p>
            <p><b>Department:</b> </p>
            <p><b>Joining Date:</b> </p>
            <p><b>Manager / Team Lead:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Company Overview</h2>
            <p>Write a short introduction about the company, mission, and values.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Team Introduction</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Team Member</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Role</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Contact</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>First Day Checklist</h2>
            <ul>
              <li>Account access created</li>
              <li>Email setup completed</li>
              <li>Tools access provided</li>
              <li>Introduction meeting completed</li>
              <li>Company policies shared</li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Tools & Platforms</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Tool</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Purpose</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Access Link</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Role Responsibilities</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>First Week Plan</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Day</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Task</th>
              </tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Day 1</td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Day 2</td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Day 3</td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Day 4</td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
              <tr><td style="border:1px solid var(--border-default);padding:8px;">Day 5</td><td style="border:1px solid var(--border-default);padding:8px;"></td></tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Important Policies</h2>
            <ul>
              <li><b>Working hours:</b> </li>
              <li><b>Leave policy:</b> </li>
              <li><b>Communication rules:</b> </li>
              <li><b>Security guidelines:</b> </li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Helpful Resources</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
        ` },
        { id: 5, name: 'Technical RFC', desc: 'Request for Comments template for architectural decisions.', icon: tpl5, color: '#E2445C', content: `
            <h1>📄 Technical RFC</h1>
            <h2>RFC Details</h2>
            <p><b>Title:</b> </p>
            <p><b>Author:</b> </p>
            <p><b>Date:</b> </p>
            <p><b>Status:</b> Draft / Under Review / Approved / Rejected</p>
            <p><b>Related Project:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Summary</h2>
            <p>Write a short summary of the technical proposal.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Problem Statement</h2>
            <p>Explain the problem this RFC is trying to solve.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Goals</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Non-Goals</h2>
            <p>Mention what this RFC will not cover.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Proposed Solution</h2>
            <p>Describe the recommended technical solution.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Architecture / Design</h2>
            <p>Explain the system design, components, services, database changes, APIs, or workflows.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Alternatives Considered</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Option</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Pros</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Cons</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Impact</h2>
            <h3>Technical Impact:</h3>
            <ul><li></li></ul>
            <h3>Business Impact:</h3>
            <ul><li></li></ul>
            <h3>User Impact:</h3>
            <ul><li></li></ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Risks</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Risk</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Severity</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Mitigation</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Implementation Plan</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Step</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Description</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Owner</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Timeline</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Open Questions</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Final Decision</h2>
            <p>Approved / Rejected / Needs Changes</p>
            <p><b>Decision Notes:</b> </p>
        ` },
        { id: 6, name: 'Release Notes', desc: 'Template for documenting software releases and changes.', icon: tpl6, color: '#0EA5E9', content: `
            <h1>🚢 Release Notes</h1>
            <h2>Release Information</h2>
            <p><b>Product / Module Name:</b> </p>
            <p><b>Version:</b> </p>
            <p><b>Release Date:</b> </p>
            <p><b>Release Owner:</b> </p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Release Summary</h2>
            <p>Write a short summary of what is included in this release.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>New Features</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Improvements</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Bug Fixes</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Issue</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Fix Description</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Status</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Breaking Changes</h2>
            <p>Mention any changes that may affect users, APIs, workflows, or integrations.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Known Issues</h2>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Issue</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Impact</th>
                <th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Workaround</th>
              </tr>
              <tr>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
                <td style="border:1px solid var(--border-default);padding:8px;"></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Upgrade Instructions</h2>
            <ol>
              <li></li>
              <li></li>
              <li></li>
            </ol>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Dependencies / Requirements</h2>
            <ul>
              <li></li>
              <li></li>
              <li></li>
            </ul>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Notes for Users</h2>
            <p>Add any important message users should know after this release.</p>
            <hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />
            <h2>Internal Notes</h2>
            <p>Add team-only technical or operational notes.</p>
        ` },
    ];

    const filteredDocs = docs.filter(d => {
        const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === 'all' || d.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

    const handleEditorInput = () => {
        if (editorRef.current) {
            editorContentRef.current = editorRef.current.innerHTML;
            setIsDirty(true);
        }
    };

    const fileInputRef = useRef(null);

    const handleTableAction = (action) => {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
            if (node.tagName === 'TD' || node.tagName === 'TH') break;
            node = node.parentNode;
        }
        
        if (!node) {
            dispatch(addToast({ title: 'No Table Selected', message: 'Click inside a table cell to use table tools.', type: 'info' }));
            return;
        }
        
        const cell = node;
        const row = cell.parentNode;
        const table = row.closest('table');
        
        if (!table) return;

        switch (action) {
            case 'addRowAbove': {
                const newRow = table.insertRow(row.rowIndex);
                for (let i = 0; i < row.cells.length; i++) {
                    const newCell = document.createElement(row.cells[i].tagName);
                    newCell.innerHTML = 'Data';
                    newCell.style.border = '1px solid var(--border-default)';
                    newCell.style.padding = '8px';
                    if (row.cells[i].tagName === 'TH') {
                        newCell.style.background = 'var(--bg-secondary)';
                        newCell.style.fontWeight = 'bold';
                    }
                    newRow.appendChild(newCell);
                }
                break;
            }
            case 'addRowBelow': {
                const newRow = table.insertRow(row.rowIndex + 1);
                for (let i = 0; i < row.cells.length; i++) {
                    const newCell = document.createElement(row.cells[i].tagName);
                    newCell.innerHTML = 'Data';
                    newCell.style.border = '1px solid var(--border-default)';
                    newCell.style.padding = '8px';
                    if (row.cells[i].tagName === 'TH') {
                        newCell.style.background = 'var(--bg-secondary)';
                        newCell.style.fontWeight = 'bold';
                    }
                    newRow.appendChild(newCell);
                }
                break;
            }
            case 'addColLeft': {
                const colIndex = cell.cellIndex;
                Array.from(table.rows).forEach(r => {
                    const newCell = document.createElement(r.cells[colIndex].tagName);
                    newCell.innerHTML = r.cells[colIndex].tagName === 'TH' ? 'Header' : 'Data';
                    newCell.style.border = '1px solid var(--border-default)';
                    newCell.style.padding = '8px';
                    if (r.cells[colIndex].tagName === 'TH') {
                        newCell.style.background = 'var(--bg-secondary)';
                        newCell.style.fontWeight = 'bold';
                    }
                    r.insertBefore(newCell, r.cells[colIndex]);
                });
                break;
            }
            case 'addColRight': {
                const colIndex = cell.cellIndex;
                Array.from(table.rows).forEach(r => {
                    const newCell = document.createElement(r.cells[colIndex].tagName);
                    newCell.innerHTML = r.cells[colIndex].tagName === 'TH' ? 'Header' : 'Data';
                    newCell.style.border = '1px solid var(--border-default)';
                    newCell.style.padding = '8px';
                    if (r.cells[colIndex].tagName === 'TH') {
                        newCell.style.background = 'var(--bg-secondary)';
                        newCell.style.fontWeight = 'bold';
                    }
                    r.insertBefore(newCell, r.cells[colIndex].nextSibling);
                });
                break;
            }
            case 'delRow': {
                if (table.rows.length > 1) {
                    table.deleteRow(row.rowIndex);
                } else {
                    table.remove();
                }
                break;
            }
            case 'delCol': {
                const colIndex = cell.cellIndex;
                if (row.cells.length > 1) {
                    Array.from(table.rows).forEach(r => {
                        r.deleteCell(colIndex);
                    });
                } else {
                    table.remove();
                }
                break;
            }
            case 'delTable': {
                table.remove();
                break;
            }
            default: break;
        }
        handleEditorInput();
    };

    const applyFormatting = (type) => {
        editorRef.current?.focus();
        switch (type) {
            case 'undo': document.execCommand('undo'); break;
            case 'redo': document.execCommand('redo'); break;
            case 'bold': document.execCommand('bold'); break;
            case 'italic': document.execCommand('italic'); break;
            case 'heading': document.execCommand('formatBlock', false, 'h2'); break;
            case 'list': document.execCommand('insertUnorderedList'); break;
            case 'code':
                document.execCommand('insertHTML', false, '<pre style="background:var(--bg-secondary);padding:12px 16px;border-radius:8px;font-family:monospace;border:1px solid var(--border-default);margin:8px 0;"><code>' + (window.getSelection().toString() || 'code here') + '</code></pre>');
                break;
            case 'table': {
                // Prevent nested tables
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    let node = selection.anchorNode;
                    while (node && node !== editorRef.current) {
                        if (node.tagName === 'TABLE') {
                            dispatch(addToast({ title: 'Action Denied', message: 'You cannot insert a table inside another table.', type: 'warning' }));
                            return;
                        }
                        node = node.parentNode;
                    }
                }
                document.execCommand('insertHTML', false, '<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Header 1</th><th style="border:1px solid var(--border-default);padding:8px;background:var(--bg-secondary);text-align:left;">Header 2</th></tr><tr><td style="border:1px solid var(--border-default);padding:8px;">Data</td><td style="border:1px solid var(--border-default);padding:8px;">Data</td></tr></table><p></p>');
                break;
            }
            case 'image':
                fileInputRef.current?.click();
                return;
            case 'link': {
                const url = prompt('Enter URL:');
                if (url) document.execCommand('createLink', false, url);
                break;
            }
            case 'divider':
                document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border-default);margin:16px 0;" />');
                break;
            default: return;
        }
        handleEditorInput();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            editorRef.current?.focus();
            document.execCommand('insertHTML', false, `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
            handleEditorInput();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const getTypeIcon = (t) => ({ document: FileText, wiki: BookOpen, template: Layout }[t] || FileText);

    return (
        <div className="docs-dashboard">
            <div className="docs-dashboard__banner">
                <div className="docs-dashboard__banner-bg"></div>
                <div className="docs-dashboard__banner-overlay"></div>
                <div className="docs-dashboard__banner-content">
                    <h1>Documentation</h1>
                    <p>Create, collaborate, and share your team's knowledge</p>
                </div>
            </div>

            <div className="doc-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="doc-tabs" style={{ marginBottom: 0 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} className={`doc-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => navigate(`/docs${tab.id === 'all' ? '' : `?tab=${tab.id}`}`)}>
                            <tab.icon size={16} /><span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="ghost" icon={Folder} onClick={handleAddFolder}>New Folder</Button>
                    <Button variant="primary" icon={Plus} onClick={handleAddDoc}>New Document</Button>
                </div>
            </div>

            {/* === ALL DOCS === */}
            {activeTab === 'all' && (
                <div className="doc-layout">
                    {/* Main */}
                    <div className="doc-main">
                        <div className="doc-main__header">
                            <div className="doc-search"><Search size={16} /><input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                <option value="all">All Folders</option>
                                {folderList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {selectedDoc ? (
                            <div className="doc-detail">
                                <div className="doc-detail__content">
                                    <div className="doc-detail__header">
                                        <h2>{selectedDoc.title}</h2>
                                        <div className="doc-detail__meta">
                                            <Avatar name={selectedDoc.owner} size="xs" /><span>by {selectedDoc.owner}</span>
                                            <span>·</span><span><Eye size={12} /> {selectedDoc.views} views</span>
                                            <span>·</span><span><Share2 size={12} /> {selectedDoc.sharedWith} people</span>
                                        </div>
                                        <div className="doc-detail__actions">
                                            <Button variant="primary" size="sm" icon={Edit3} onClick={() => handleEditDoc(selectedDoc)}>Edit</Button>
                                            <Button variant="ghost" size="sm" icon={Share2}>Share</Button>
                                            <Button variant="ghost" size="sm" icon={Download} onClick={handleExportPDF}>Export PDF</Button>
                                            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteDoc(selectedDoc.id)} style={{ color: 'var(--danger)' }}>Delete</Button>
                                            <button className="doc-back-btn" onClick={() => { 
                                    setActiveTab('all'); 
                                    setSelectedDoc(null); 
                                    navigate(activeFolder ? `/docs?folder=${activeFolder}` : '/docs');
                                }}>
                                    <ArrowLeft size={16} /> Back to {activeFolder || 'Folders'}
                                </button>
                                        </div>
                                    </div>
                                    <div className="doc-detail__versions">
                                        <h4><Clock size={12} /> Version History</h4>
                                        {selectedDoc.versions.map((v, i) => (
                                            <div key={i} className="doc-version"><span className="doc-version__tag">v{v.v}</span><span>{v.date}</span><span>{v.author}</span>{i === 0 && <Badge variant="status" color="var(--success)">Current</Badge>}</div>
                                        ))}
                                    </div>

                                    {/* Document Content Preview */}
                                    <div className="doc-preview-body" style={{ 
                                        marginTop: '24px', 
                                        padding: '40px', 
                                        background: 'var(--bg-body)', 
                                        borderRadius: '16px', 
                                        border: '1px solid var(--border-default)', 
                                        minHeight: '600px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div className="doc-editor-area" dangerouslySetInnerHTML={{ __html: selectedDoc.content }} />
                                    </div>
                                </div>
                            </div>
                        ) : activeFolder ? (
                            <div className="folder-view">
                                <div className="folder-view-header">
                                    <button className="btn-back-folder" onClick={() => { 
                                        setActiveFolder(null); 
                                        setSelectedDocIds([]); 
                                        navigate('/docs');
                                    }}><ArrowLeft size={16} /></button>
                                    <div className="folder-view-title"><Folder size={20} color="var(--primary-500)" /> {activeFolder}</div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {filteredDocs.filter(doc => doc.category === activeFolder).length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedDocIds.length === filteredDocs.filter(doc => doc.category === activeFolder).length && filteredDocs.filter(doc => doc.category === activeFolder).length > 0}
                                                    onChange={() => handleSelectAllDocs(filteredDocs.filter(doc => doc.category === activeFolder))}
                                                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>SELECT ALL</span>
                                            </div>
                                        )}
                                        <div className="view-toggles" style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px' }}>
                                            <button 
                                                className={`view-toggle-btn ${viewType === 'grid' ? 'active' : ''}`}
                                                onClick={() => setViewType('grid')}
                                                style={{ border: 'none', background: viewType === 'grid' ? 'var(--bg-primary)' : 'transparent', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', color: viewType === 'grid' ? 'var(--primary-500)' : 'var(--text-muted)' }}
                                            ><LayoutGrid size={16} /></button>
                                            <button 
                                                className={`view-toggle-btn ${viewType === 'list' ? 'active' : ''}`}
                                                onClick={() => setViewType('list')}
                                                style={{ border: 'none', background: viewType === 'list' ? 'var(--bg-primary)' : 'transparent', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', color: viewType === 'list' ? 'var(--primary-500)' : 'var(--text-muted)' }}
                                            ><List size={16} /></button>
                                        </div>
                                        {selectedDocIds.length > 0 && (
                                            <Button variant="primary" size="sm" icon={Trash2} onClick={handleBulkDelete} style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}>Delete Selected ({selectedDocIds.length})</Button>
                                        )}
                                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => handleDeleteFolder(activeFolder)} style={{ color: 'var(--danger-600)' }}>Delete Folder</Button>
                                    </div>
                                </div>
                                <div className="doc-files-container">

                                    
                                    <div className={viewType === 'grid' ? 'doc-files-grid' : 'doc-files-list'}>
                                        {filteredDocs.filter(doc => doc.category === activeFolder).map(doc => {
                                            const TypeIcon = getTypeIcon(doc.type);
                                            if (viewType === 'grid') {
                                                return (
                                                    <div key={doc.id} className="doc-grid-item" onClick={() => setSelectedDoc(doc)} style={{ 
                                                        position: 'relative', 
                                                        padding: '24px 20px', 
                                                        borderRadius: '12px', 
                                                        cursor: 'pointer', 
                                                        border: selectedDocIds.includes(doc.id) ? '2px solid var(--primary-500)' : '1px solid var(--border-default)',
                                                        transition: 'all 0.2s ease',
                                                        background: 'transparent',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedDocIds.includes(doc.id)} 
                                                                onChange={(e) => handleToggleSelectDoc(doc.id, e)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                        <div style={{ position: 'absolute', top: '12px', right: '40px', zIndex: 2 }}>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-500)', opacity: 0.6, padding: '4px' }}
                                                                title="View Document"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        </div>
                                                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                                                            <button 
                                                                onClick={(e) => handleDeleteDoc(doc.id, e)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.4, padding: '4px' }}
                                                                title="Delete Document"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--primary-50)', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.1)' }}>
                                                            <TypeIcon size={28} />
                                                        </div>
                                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                            <Avatar name={doc.owner} size="xs" /> {doc.owner}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={10} /> {new Date(doc.lastEdited).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={doc.id} className="doc-file-item" onClick={() => setSelectedDoc(doc)} style={{ backgroundColor: selectedDocIds.includes(doc.id) ? 'rgba(var(--primary-rgb), 0.05)' : '' }}>
                                                    <div className="doc-file-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedDocIds.includes(doc.id)} 
                                                            onChange={(e) => handleToggleSelectDoc(doc.id, e)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="doc-file-icon"><TypeIcon size={20} /></div>
                                                        <div className="doc-file-details">
                                                            <h4>{doc.title}</h4>
                                                            <span>{doc.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="doc-file-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Avatar name={doc.owner} size="xs" /> {doc.owner}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(doc.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                        {doc.starred && <Star size={14} fill="var(--warning)" color="var(--warning)" />}
                                                        <button 
                                                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {filteredDocs.filter(doc => doc.category === activeFolder).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-default)' }}>
                                            <FileText size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                            <p>No documents found in this folder.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="doc-folder-grid">
                                {folderList.map(folderName => {
                                    const count = filteredDocs.filter(d => d.category === folderName).length;
                                    return (
                                        <div key={folderName} className="folder-container" onClick={() => setActiveFolder(folderName)}>
                                            <div className="folder-3d">
                                                <div className="folder-3d-back"></div>
                                                <div className="folder-3d-paper"></div>
                                                <div className="folder-3d-front">
                                                    <Folder className="folder-icon-inner" size={32} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="folder-label">{folderName}</div>
                                                <div className="folder-meta">{count} files</div>
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
                    <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    <div className="doc-editor-toolbar">
                        {[
                            { icon: Undo, label: 'Undo', type: 'undo' }, { icon: Redo, label: 'Redo', type: 'redo' }, null,
                            { icon: Heading, label: 'Heading', type: 'heading' }, { icon: Bold, label: 'Bold', type: 'bold' }, { icon: Italic, label: 'Italic', type: 'italic' }, null,
                            { icon: List, label: 'Bullet List', type: 'list' }, { icon: Code, label: 'Code Block', type: 'code' }, { icon: Table, label: 'Insert Table', type: 'table' }, null,
                            { icon: Image, label: 'Insert Image', type: 'image' }, { icon: Link2, label: 'Link', type: 'link' }, { icon: Minus, label: 'Divider', type: 'divider' },
                        ].map((item, i) => item ? (
                            <button key={i} className="doc-editor-btn" title={item.label} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormatting(item.type)}><item.icon size={16} /></button>
                        ) : (
                            <div key={i} className="doc-editor-divider" />
                        ))}
                        
                        {/* Table Tools */}
                        <div className="doc-editor-divider" />
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginRight: '4px' }}>TABLE:</span>
                            <button className="doc-editor-btn sm" title="Add Row Above" onClick={() => handleTableAction('addRowAbove')}><ArrowUp size={14} /></button>
                            <button className="doc-editor-btn sm" title="Add Row Below" onClick={() => handleTableAction('addRowBelow')}><ArrowDown size={14} /></button>
                            <button className="doc-editor-btn sm" title="Add Column Left" onClick={() => handleTableAction('addColLeft')}><ArrowLeft size={14} /></button>
                            <button className="doc-editor-btn sm" title="Add Column Right" onClick={() => handleTableAction('addColRight')}><ArrowRight size={14} /></button>
                            <div className="doc-editor-divider" style={{ height: '14px', margin: '0 4px' }} />
                            <button className="doc-editor-btn sm danger" title="Delete Row" onClick={() => handleTableAction('delRow')}><Rows size={14} /></button>
                            <button className="doc-editor-btn sm danger" title="Delete Column" onClick={() => handleTableAction('delCol')}><Columns size={14} /></button>
                            <button className="doc-editor-btn sm danger" title="Delete Table" onClick={() => handleTableAction('delTable')}><Trash2 size={14} /></button>
                        </div>

                        <div style={{ marginLeft: 'auto' }}>
                            <Button variant="primary" size="sm" onClick={handleSaveFromEditor}>Save Changes</Button>
                        </div>
                    </div>
                    <div style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
                        <div 
                            ref={editorRef}
                            className="doc-editor-area" 
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                                }
                            }}
                            data-placeholder="Start writing your document here..."
                        />
                    </div>
                    <div className="doc-editor-footer">
                        <span><Type size={12} /> {(editorRef.current?.innerText || '').length} characters</span>
                        <span>Last saved: just now</span>
                    </div>
                </div>
            )}

            {/* === TEMPLATES === */}
            {activeTab === 'templates' && (
                <div className="doc-templates-grid">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="doc-template-card">
                            <div className="doc-template-card__icon" style={{ overflow: 'hidden' }}>
                                <img src={tpl.icon} alt={tpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h3>{tpl.name}</h3>
                            <p>{tpl.desc}</p>
                            <Button variant="primary" size="sm" onClick={() => { setSelectedTemplate(tpl); setTemplateFolder('General'); setIsTemplateModalOpen(true); }}>Use Template</Button>
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
                            {folderList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                title="Create New Folder"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create Folder</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Folder Name</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Marketing"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title={`Use Template: ${selectedTemplate?.name || ''}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={async () => {
                            if (!selectedTemplate) return;
                            try {
                                const newDoc = await docsService.createDocument({
                                    title: selectedTemplate.name,
                                    type: 'document',
                                    category: templateFolder,
                                    content: selectedTemplate.content,
                                    owner_name: 'Current User'
                                });
                                await loadDocs();
                                dispatch(addToast({ title: 'Template Created', message: `"${selectedTemplate.name}" has been created in ${templateFolder}.`, type: 'success' }));
                                setIsTemplateModalOpen(false);
                                // Open the doc in editor
                                const createdDoc = { ...newDoc, versions: [], owner: newDoc.owner_name, lastEdited: newDoc.updated_at };
                                handleEditDoc(createdDoc);
                            } catch (err) {
                                dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
                            }
                        }}>Create Document</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '16px', border: `2px solid ${selectedTemplate?.color || 'var(--border-default)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden' }}>
                                {selectedTemplate?.icon && <img src={selectedTemplate.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{selectedTemplate?.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedTemplate?.desc}</div>
                            </div>
                        </div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Save to Folder</label>
                        <select
                            className="dw-form-input"
                            value={templateFolder}
                            onChange={e => setTemplateFolder(e.target.value)}
                        >
                            {folderList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Docs;
