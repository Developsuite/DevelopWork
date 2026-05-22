import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useDispatch } from 'react-redux';
import { hrService } from '../../services/hrService';
import { financeService } from '../../services/financeService';
import { isValidEmail, isEmpty, isPositiveNumber } from '../../utils/validation';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import { addToast } from '../../store/slices/uiSlice';
import {
    Users, UserPlus, Calendar, Clock, TrendingUp, Award, Briefcase, DollarSign,
    FileText, Search, MoreVertical, Mail, Phone, MapPin, Star, Check, X, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Download
} from 'lucide-react';
import hr1 from '../../assets/hr/1.png';
import hr2 from '../../assets/hr/2.png';
import hr3 from '../../assets/hr/3.png';
import hr4 from '../../assets/hr/4.png';
import vectorCeo from '../../assets/hr/vector_ceo.png';
import vectorEmployee from '../../assets/hr/vector_employee.png';
import './HR.css';

const HR = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'directory');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [payrollMonth, setPayrollMonth] = useState('May 2026');
    const [payrollDepartment, setPayrollDepartment] = useState('all');
    const [payrollStatus, setPayrollStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    
    // Persistent state for processed payroll months
    const [processedMonths, setProcessedMonths] = useState(() => {
        const saved = localStorage.getItem('processedPayrolls');
        return saved ? JSON.parse(saved) : [];
    });

    const [viewType, setViewType] = useState('grid'); // grid or list
    const [editId, setEditId] = useState(null);
    const [deleteConfig, setDeleteConfig] = useState({ id: null, type: '', name: '' });
    const [payrollFormData, setPayrollFormData] = useState({ salary: 0, bonus: 0, deductions: 0, name: '' });
    
    // Org Chart Panning State
    const orgChartRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

    const handleOrgMouseDown = (e) => {
        if (!orgChartRef.current) return;
        setIsPanning(true);
        setPanStart({ x: e.pageX - orgChartRef.current.offsetLeft, y: e.pageY - orgChartRef.current.offsetTop });
        setScrollPos({ left: orgChartRef.current.scrollLeft, top: orgChartRef.current.scrollTop });
    };

    const handleOrgMouseUp = () => {
        setIsPanning(false);
    };

    const handleOrgMouseMove = (e) => {
        if (!isPanning || !orgChartRef.current) return;
        e.preventDefault();
        const x = e.pageX - orgChartRef.current.offsetLeft;
        const y = e.pageY - orgChartRef.current.offsetTop;
        const walkX = (x - panStart.x);
        const walkY = (y - panStart.y);
        orgChartRef.current.scrollLeft = scrollPos.left - walkX;
        orgChartRef.current.scrollTop = scrollPos.top - walkY;
    };

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: 'Engineering',
        type: 'Full-time',
        status: 'Active',
        email: '',
        phone: '',
        location: 'Islamabad',
        skills: '',
        manager: 'CEO',
        salary: 0,
        commission: 0,
        documentUrl: '',
        documentName: '',
        isManager: false,
        joinDate: new Date().toISOString().split('T')[0]
    });

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you'd upload this to Supabase Storage
            // For now, we'll simulate the URL and save the name
            setFormData({
                ...formData,
                documentUrl: URL.createObjectURL(file), // Local preview URL
                documentName: file.name
            });
            dispatch(addToast({ title: 'File Selected', message: `${file.name} is ready for upload.`, type: 'info' }));
        }
    };

    const [draggedEmpId, setDraggedEmpId] = useState(null);

    const isDescendant = (parentName, childName) => {
        const directSubordinates = employees.filter(emp => {
            const m = emp.manager ? emp.manager.toLowerCase() : '';
            const p = parentName ? parentName.toLowerCase() : '';
            // Check if manager field matches parent name or if it matches a role of a parent
            return m === p || employees.some(e => e.name.toLowerCase() === p && e.role.toLowerCase() === m);
        });
        if (directSubordinates.some(emp => emp.name === childName)) return true;
        return directSubordinates.some(emp => isDescendant(emp.name, childName));
    };

    const handleDragStart = (e, empId) => {
        e.stopPropagation();
        setDraggedEmpId(empId);
        e.dataTransfer.setData('empId', empId);
    };

    const handleDrop = async (e, targetManagerName) => {
        e.preventDefault();
        e.stopPropagation();
        const empId = parseInt(e.dataTransfer.getData('empId'));
        const sourceEmp = employees.find(emp => emp.id === empId);
        
        if (!sourceEmp || sourceEmp.name === targetManagerName) return;
        
        // Prevent cyclic dependency (can't move a manager under their own subordinate)
        if (isDescendant(sourceEmp.name, targetManagerName)) {
            dispatch(addToast({ title: 'Invalid Move', message: 'You cannot move a manager under their own subordinate.', type: 'error' }));
            return;
        }

        // Optimistic UI update
        setEmployees(prev => prev.map(emp => 
            emp.id === empId ? { ...emp, manager: targetManagerName } : emp
        ));

        // Persist to backend
        try {
            await hrService.updateEmployee(empId, { manager: targetManagerName });
            dispatch(addToast({ 
                title: 'Hierarchy Updated', 
                message: `${sourceEmp.name} now reports to ${targetManagerName}`, 
                type: 'success' 
            }));
        } catch (err) {
            console.error('Failed to update hierarchy:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to update hierarchy.', type: 'error' }));
            // Revert on error
            loadEmployees();
        }

        setDraggedEmpId(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const tabs = [
        { id: 'directory', label: 'Directory', icon: Users },
        { id: 'org', label: 'Org Chart', icon: TrendingUp },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'performance', label: 'Performance', icon: Award },
    ];

    const [employees, setEmployees] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Load data from Supabase
    const loadEmployees = useCallback(async () => {
        try {
            const data = await hrService.getEmployees();
            setEmployees(data.map(emp => ({
                ...emp,
                type: emp.employment_type,
                joinDate: emp.join_date,
            })));
        } catch (err) { console.error('Error loading employees:', err); }
    }, []);

    const loadLeaveRequests = useCallback(async () => {
        try {
            const data = await hrService.getLeaveRequests();
            setLeaveRequests(data.map(lr => ({
                ...lr,
                employee: lr.employee_name,
                from: lr.from_date,
                to: lr.to_date,
            })));
        } catch (err) { console.error('Error loading leave requests:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setDataLoading(true);
            await Promise.all([loadEmployees(), loadLeaveRequests()]);
            setDataLoading(false);
        };
        loadAll();
    }, [loadEmployees, loadLeaveRequests]);

    const handleAddEmployee = () => {
        setIsModalOpen(true);
    };

    const handleSaveEmployee = async () => {
        if (isEmpty(formData.name)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Employee name is required.', type: 'warning' }));
            return;
        }
        if (formData.email && !isValidEmail(formData.email)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter a valid email address.', type: 'warning' }));
            return;
        }
        if (!isPositiveNumber(formData.salary)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Salary must be a positive number.', type: 'warning' }));
            return;
        }
        try {
            const skills = formData.skills ? (Array.isArray(formData.skills) ? formData.skills : formData.skills.split(',').map(s => s.trim())) : [];
            if (editId) {
                await hrService.updateEmployee(editId, {
                    name: formData.name, role: formData.role, department: formData.department,
                    employment_type: formData.type, status: formData.status, email: formData.email,
                    phone: formData.phone, location: formData.location, skills,
                    manager: formData.manager, salary: parseInt(formData.salary) || 0,
                    commission: parseInt(formData.commission) || 0, document_url: formData.documentUrl,
                    is_manager: formData.isManager, join_date: formData.joinDate
                });
                dispatch(addToast({ title: 'Employee Updated', message: `${formData.name}'s profile has been updated.`, type: 'success' }));
            } else {
                await hrService.createEmployee({
                    name: formData.name, role: formData.role, department: formData.department,
                    employment_type: formData.type, status: formData.status, email: formData.email,
                    phone: formData.phone, location: formData.location, skills,
                    salary: parseInt(formData.salary) || 0, bonus: 0, deductions: 0,
                    manager: formData.manager, commission: parseInt(formData.commission) || 0,
                    document_url: formData.documentUrl, is_manager: formData.isManager,
                    join_date: formData.joinDate
                });
                dispatch(addToast({ title: 'Employee Added', message: `${formData.name} has been added to the directory.`, type: 'success' }));
            }
            await loadEmployees();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ 
            name: '', role: '', department: 'Engineering', type: 'Full-time', 
            status: 'Active', email: '', phone: '', location: 'Islamabad', 
            skills: '', manager: 'CEO', salary: 0, commission: 0, documentUrl: '', documentName: '',
            isManager: false, joinDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleEditEmployee = (e, emp) => {
        e.stopPropagation();
        setEditId(emp.id);
        setFormData({
            name: emp.name,
            role: emp.role,
            department: emp.department,
            type: emp.type,
            status: emp.status,
            email: emp.email,
            phone: emp.phone,
            location: emp.location,
            skills: emp.skills.join(', '),
            manager: emp.manager,
            salary: emp.salary || 0,
            commission: emp.commission || 0,
            documentUrl: emp.document_url || '',
            documentName: emp.document_url ? 'Existing Document' : '',
            isManager: emp.is_manager || false,
            joinDate: emp.join_date || new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (e, id, type, name) => {
        e.stopPropagation();
        setDeleteConfig({ id, type, name });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        const { id, type, name } = deleteConfig;
        try {
            if (type === 'employee') {
                await hrService.deleteEmployee(id);
                await loadEmployees();
            } else if (type === 'review') {
                await hrService.deletePerformanceReview(id);
                await loadReviews();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
        setIsDeleteModalOpen(false);
        dispatch(addToast({ title: 'Deleted', message: `${name} has been removed.`, type: 'info' }));
    };

    const handleApproveLeave = async (id, employee) => {
        try {
            await hrService.updateLeaveRequest(id, { status: 'Approved' });
            await loadLeaveRequests();
            dispatch(addToast({ title: 'Leave Approved', message: `Leave request for ${employee} has been approved.`, type: 'success' }));
        } catch (err) { console.error(err); }
    };

    const handleRejectLeave = async (id, employee) => {
        try {
            await hrService.updateLeaveRequest(id, { status: 'Rejected' });
            await loadLeaveRequests();
            dispatch(addToast({ title: 'Leave Rejected', message: `Leave request for ${employee} has been rejected.`, type: 'info' }));
        } catch (err) { console.error(err); }
    };

    const handleViewEmployee = (emp) => {
        // Prevent opening if user is selecting text
        if (window.getSelection().toString()) return;
        
        // Find full employee data if it's just a name object
        const fullEmp = employees.find(e => e.name === emp.name) || emp;
        setSelectedEmployee(fullEmp);
        setIsProfileModalOpen(true);
    };



    const [performanceReviews, setPerformanceReviews] = useState([]);

    const loadReviews = useCallback(async () => {
        try {
            const data = await hrService.getPerformanceReviews();
            setPerformanceReviews(data.map(r => ({
                ...r,
                name: r.employee_name || 'Unknown',
                goals: Array.isArray(r.goals) ? r.goals.map(g => typeof g === 'string' ? { text: g, progress: 0 } : g) : [],
            })));
        } catch (err) { console.error('Error loading reviews:', err); }
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const [performanceFormData, setPerformanceFormData] = useState({
        employeeId: '',
        name: '',
        rating: 5,
        feedback: '',
        goals: '' // Will split by line
    });

    const handleSavePerformanceReview = async () => {
        if (!performanceFormData.employeeId) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please select an employee.', type: 'error' }));
            return;
        }
        const rating = parseInt(performanceFormData.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            dispatch(addToast({ title: 'Validation Error', message: 'Rating must be between 1 and 5.', type: 'warning' }));
            return;
        }
        const reviewData = {
            employee_id: performanceFormData.employeeId,
            employee_name: performanceFormData.name,
            rating: parseInt(performanceFormData.rating),
            feedback: performanceFormData.feedback,
            goals: performanceFormData.goals.split('\n').filter(g => g.trim()).map(g => ({ text: g.trim(), progress: 0 })),
            review_date: new Date().toISOString().split('T')[0]
        };

        try {
            if (editId) {
                await hrService.updatePerformanceReview(editId, {
                    ...reviewData
                });
                dispatch(addToast({ title: 'Review Updated', message: `Performance review for ${performanceFormData.name} updated.`, type: 'success' }));
            } else {
                await hrService.createPerformanceReview(reviewData);
                dispatch(addToast({ title: 'Review Added', message: `Performance review for ${performanceFormData.name} added.`, type: 'success' }));
            }
            await loadReviews();
        } catch (err) {
            console.error('Error saving review:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to save performance review.', type: 'error' }));
        }
        
        setIsPerformanceModalOpen(false);
        setEditId(null);
    };

    const handleEditReview = (e, review) => {
        e.stopPropagation();
        setEditId(review.id);
        setPerformanceFormData({
            employeeId: review.employee_id || '',
            name: review.name,
            rating: review.rating,
            feedback: review.feedback,
            goals: review.goals.map(g => g.text).join('\n')
        });
        setIsPerformanceModalOpen(true);
    };

    const handleEditPayroll = (emp) => {
        setEditId(emp.id);
        setPayrollFormData({
            name: emp.name,
            salary: emp.salary,
            bonus: emp.bonus,
            deductions: emp.deductions
        });
        setIsPayrollModalOpen(true);
    };

    const handleSavePayroll = async () => {
        if (!isPositiveNumber(payrollFormData.salary) || !isPositiveNumber(payrollFormData.bonus) || !isPositiveNumber(payrollFormData.deductions)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Payroll values must be positive numbers.', type: 'warning' }));
            return;
        }
        try {
            await hrService.updateEmployee(editId, {
                salary: parseFloat(payrollFormData.salary) || 0,
                bonus: parseFloat(payrollFormData.bonus) || 0,
                deductions: parseFloat(payrollFormData.deductions) || 0
            });
            await loadEmployees();
            dispatch(addToast({ title: 'Payroll Updated', message: `Financial records for ${payrollFormData.name} updated.`, type: 'success' }));
        } catch (err) {
            console.error(err);
            dispatch(addToast({ title: 'Error', message: 'Failed to update payroll records.', type: 'error' }));
        }
        setIsPayrollModalOpen(false);
        setEditId(null);
    };

    const departments = ['all', 'Engineering', 'Design', 'Operations', 'Marketing', 'HR'];
    const typeColors = { 'Full-time': 'var(--success)', 'Part-time': 'var(--info)', 'Contract': 'var(--warning)', 'Remote': '#8B5CF6' };
    const statusColors = { Active: 'var(--success)', 'On Leave': 'var(--warning)', Terminated: 'var(--danger)' };

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDepartment === 'all' || e.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    const stats = [
        { label: 'Total Employees', value: employees.length, image: hr1, align: 'bottom' },
        { label: 'Monthly Payroll', value: 'PKR ' + employees.reduce((acc, emp) => acc + ((parseFloat(emp.salary) || 0) + (parseFloat(emp.bonus) || 0) + (parseFloat(emp.commission) || 0) - (parseFloat(emp.deductions) || 0)), 0).toLocaleString(), image: hr2, align: 'center' },
        { label: 'Active Employees', value: employees.filter(e => e.status === 'Active').length, image: hr3, align: 'center' },
        { label: 'Avg Rating', value: '4.3★', image: hr4, align: 'center' },
    ];

    const getEmployeeVector = (emp) => {
        if (!emp) return vectorEmployee;
        const role = (emp.role || '').toLowerCase();
        return role.includes('ceo') || role.includes('chief executive') ? vectorCeo : vectorEmployee;
    };

    const handleExportDirectory = () => {
        const headers = ['Name', 'Role', 'Department', 'Type', 'Status', 'Location', 'Salary', 'Commission', 'Email', 'Phone', 'Manager'];
        const csvContent = [
            headers.join(','),
            ...filteredEmployees.map(emp => [
                `"${emp.name}"`, `"${emp.role}"`, `"${emp.department}"`, `"${emp.type}"`, 
                `"${emp.status}"`, `"${emp.location}"`, `"${emp.salary || 0}"`, `"${emp.commission || 0}"`,
                `"${emp.email || ''}"`, `"${emp.phone || ''}"`, `"${emp.manager || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `employee_directory_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        dispatch(addToast({ title: 'Export Complete', message: 'Employee directory exported to CSV successfully.', type: 'success' }));
    };

    const handleExportPDF = async () => {
        if (!orgChartRef.current) return;
        
        dispatch(addToast({ title: 'Exporting Chart', message: 'Preparing your organizational hierarchy PDF...', type: 'info' }));
        
        try {
            // Save current panning state to restore later
            const originalTransform = orgChartRef.current.style.transform;
            const originalCursor = orgChartRef.current.style.cursor;
            
            // Reset transform for clean capture
            orgChartRef.current.style.transform = 'none';
            orgChartRef.current.style.cursor = 'default';
            
            // Find the root level element for better capture
            const element = orgChartRef.current.querySelector('.hr-org-root-level') || orgChartRef.current;
            
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // High resolution
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    // Ensure the cloned version is visible
                    const clonedElem = clonedDoc.querySelector('.hr-org-root-level') || clonedDoc.querySelector('.hr-org-chart');
                    if (clonedElem) {
                        clonedElem.style.transform = 'none';
                        clonedElem.style.position = 'static';
                        clonedElem.style.padding = '80px';
                        clonedElem.style.width = 'fit-content';
                        clonedElem.style.height = 'fit-content';
                    }
                }
            });

            // Restore original styles
            orgChartRef.current.style.transform = originalTransform;
            orgChartRef.current.style.cursor = originalCursor;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`organization_hierarchy_${new Date().toISOString().split('T')[0]}.pdf`);
            
            dispatch(addToast({ title: 'Success', message: 'Org Chart exported to PDF successfully.', type: 'success' }));
        } catch (err) {
            console.error('PDF Export Error:', err);
            dispatch(addToast({ title: 'Export Failed', message: 'Could not generate PDF. Please try again.', type: 'error' }));
        }
    };

    const managerSuggestions = Array.from(new Set([
        'CEO',
        ...employees.filter(e => e.is_manager).map(e => e.role)
    ].filter(Boolean)));

    const renderOrgNode = (parentName, parentRole) => {
        const subordinates = employees.filter(emp => {
            const m = emp.manager ? emp.manager.toLowerCase() : '';
            const pName = parentName ? parentName.toLowerCase() : '';
            const pRole = parentRole ? parentRole.toLowerCase() : '';
            
            // Match if manager string equals parent's name OR parent's role
            if (pName && m === pName) return true;
            if (pRole && m === pRole) return true;
            
            // Special case for root CEO
            if (pName === 'ceo' || pRole === 'ceo') {
                return employees.some(e => e.name.toLowerCase() === m && e.role.toLowerCase() === 'ceo');
            }
            
            return false;
        });

        if (subordinates.length === 0) return null;

        return (
            <div className="hr-org-children">
                {subordinates.map(emp => (
                    <div key={emp.id} className="hr-org-node">
                        <div 
                            className={`hr-org-card ${draggedEmpId === emp.id ? 'dragging' : ''}`}
                            onClick={() => handleViewEmployee(emp)}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, emp.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, emp.name)}
                        >
                            <img src={getEmployeeVector(emp)} alt="" className="hr-org-card__icon" />
                            <div className="hr-org-card__content">
                                <div className="hr-org-card__name">{emp.name}</div>
                                <div className="hr-org-card__role">{emp.role}</div>
                            </div>
                        </div>
                        {renderOrgNode(emp.name, emp.role)}
                    </div>
                ))}
            </div>
        );
    };

    const getPayrollCutoffDate = (monthStr) => {
        const date = new Date(monthStr + ' 1');
        return new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of that month
    };

    const filteredPayrollEmployees = useMemo(() => {
        const cutoffDate = getPayrollCutoffDate(payrollMonth);
        return employees.filter(emp => {
            // Date filter - don't show employees hired after the payroll month
            if (emp.join_date) {
                const joinDate = new Date(emp.join_date);
                if (joinDate > cutoffDate) return false;
            }
            
            // Department filter
            if (payrollDepartment !== 'all' && emp.department !== payrollDepartment) return false;
            
            // Status filter
            const isPaid = processedMonths.includes(payrollMonth);
            if (payrollStatus === 'paid' && !isPaid) return false;
            if (payrollStatus === 'pending' && isPaid) return false;
            
            return true;
        });
    }, [employees, payrollMonth, payrollDepartment, payrollStatus, processedMonths]);

    const handleRunPayroll = async () => {

        const totalNetPay = filteredPayrollEmployees.reduce((sum, emp) => sum + ((parseFloat(emp.salary) || 0) + (parseFloat(emp.bonus) || 0) - (parseFloat(emp.deductions) || 0)), 0);

        try {
            dispatch(addToast({ title: 'Processing', message: `Finalizing payments for ${payrollMonth}...`, type: 'info' }));
            
            // Create expense transaction in Finance Module (Fail gracefully if not setup)
            if (totalNetPay > 0) {
                try {
                    await financeService.createTransaction({
                        type: 'expense',
                        category: 'Salary',
                        description: `${payrollMonth} Payroll`,
                        amount: totalNetPay,
                        date: new Date().toISOString().split('T')[0],
                        status: 'completed'
                    });
                } catch (e) {
                    console.warn('Finance sync failed or not available:', e);
                }
            }

            // Mark this month as processed
            if (!processedMonths.includes(payrollMonth)) {
                const newProcessed = [...processedMonths, payrollMonth];
                setProcessedMonths(newProcessed);
                localStorage.setItem('processedPayrolls', JSON.stringify(newProcessed));
            }
            
            await loadEmployees();
            
            // Generate PDF Report automatically
            const element = document.getElementById('payroll-report-container');
            if (element) {
                const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'l', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`payroll_report_${payrollMonth.replace(' ', '_')}.pdf`);
            }

            dispatch(addToast({ title: 'Payroll Processed', message: `Successfully processed PKR ${totalNetPay.toLocaleString()} and generated PDF.`, type: 'success' }));
        } catch (err) {
            console.error('Payroll Error:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to process payroll.', type: 'error' }));
        }
    };

    return (
        <div className="hr-dashboard">
            <div className="hr-dashboard__banner">
                <div className="hr-dashboard__banner-bg"></div>
                <div className="hr-dashboard__banner-overlay"></div>
                <div className="hr-dashboard__banner-content">
                    <h1>Human Resources</h1>
                    <p>Manage your workforce, payroll, and performance</p>
                </div>
            </div>

            {/* Stats */}
            <div className="hr-dashboard__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="hr-stat-card hr-stat-card--small">
                        <div className="hr-stat-card__content">
                            <div className="hr-stat-card__info">
                                <div className="hr-stat-card__value">{stat.value}</div>
                                <div className="hr-stat-card__label">{stat.label}</div>
                            </div>
                            <div className={`hr-stat-card__image-container hr-stat-card__image-container--${stat.align}`}>
                                <img src={stat.image} alt="" className="hr-stat-card__image" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sub-tab Navigation and Actions */}
            <div className="hr-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="hr-tabs" style={{ marginBottom: 0 }}>
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            type="button"
                            className={`hr-tab ${activeTab === tab.id ? 'active' : ''}`} 
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <tab.icon size={16} /><span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div>
                    <Button variant="primary" icon={UserPlus} onClick={handleAddEmployee}>Add Employee</Button>
                </div>
            </div>

            {/* === ORG CHART === */}
            {activeTab === 'org' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Organization Hierarchy</h2>
                        <Button variant="ghost" size="sm" icon={FileText} onClick={handleExportPDF}>Export PDF</Button>
                    </div>
                    <div 
                        className={`hr-org-chart ${isPanning ? 'panning' : ''}`}
                        ref={orgChartRef}
                        onMouseDown={handleOrgMouseDown}
                        onMouseLeave={handleOrgMouseUp}
                        onMouseUp={handleOrgMouseUp}
                        onMouseMove={handleOrgMouseMove}
                    >
                        {/* Root: People with No Manager or assigned to None */}
                        <div className="hr-org-root-level">
                            {/* CEO Office Root Node */}
                            <div className="hr-org-node hr-org-node--root">
                                <div 
                                    className="hr-org-card hr-org-card--ceo-office"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'CEO')}
                                >
                                    <img src={vectorCeo} alt="CEO" className="hr-org-card__icon" />
                                    <div className="hr-org-card__content">
                                        <div className="hr-org-card__name">CEO Office</div>
                                        <div className="hr-org-card__role">Management</div>
                                    </div>
                                </div>
                                {renderOrgNode('CEO', 'CEO')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === DIRECTORY === */}
            {activeTab === 'directory' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Employee Directory</h2>
                        <div className="hr-filters">
                            <Button variant="ghost" size="sm" icon={Download} onClick={handleExportDirectory} style={{ marginRight: '12px' }}>Export CSV</Button>
                            <div className="view-toggle" style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginRight: '12px' }}>
                                <button 
                                    onClick={() => setViewType('grid')}
                                    style={{ padding: '8px 12px', background: viewType === 'grid' ? 'var(--primary-50)' : 'transparent', border: 'none', cursor: 'pointer', color: viewType === 'grid' ? 'var(--primary-600)' : 'var(--text-muted)' }}
                                >
                                    Grid
                                </button>
                                <button 
                                    onClick={() => setViewType('list')}
                                    style={{ padding: '8px 12px', background: viewType === 'list' ? 'var(--primary-50)' : 'transparent', border: 'none', borderLeft: '1px solid var(--border-color)', cursor: 'pointer', color: viewType === 'list' ? 'var(--primary-600)' : 'var(--text-muted)' }}
                                >
                                    List
                                </button>
                            </div>
                            <div className="hr-search"><Search size={16} /><input type="text" placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                            <select className="hr-dept-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                                {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                            </select>
                        </div>
                    </div>
                    {viewType === 'grid' ? (
                        <div className="hr-employee-grid">
                            {filteredEmployees.map(emp => (
                                <div key={emp.id} className="hr-employee-card" onClick={() => handleViewEmployee(emp)}>
                                    {/* Hover Actions */}
                                    <div className="hr-employee-card__actions">
                                        <button className="hr-icon-btn" onClick={(e) => handleEditEmployee(e, emp)} title="Edit"><Pencil size={12} /></button>
                                        <button className="hr-icon-btn hr-icon-btn--danger" onClick={(e) => handleDeleteClick(e, emp.id, 'employee', emp.name)} title="Delete"><Trash2 size={12} /></button>
                                    </div>

                                    {/* Status indicator dot */}
                                    <div className="hr-employee-card__status-dot" style={{ background: statusColors[emp.status] }} title={emp.status} />

                                    {/* Centered Avatar */}
                                    <div className="hr-employee-card__avatar">
                                        <Avatar name={emp.name} size="lg" src={emp.image_url} />
                                    </div>

                                    {/* Name & Role */}
                                    <h3 className="hr-employee-card__name">{emp.name}</h3>
                                    <p className="hr-employee-card__role">{emp.role}</p>

                                    {/* Department Tag */}
                                    <div className="hr-employee-card__dept">{emp.department}</div>

                                    {/* Location */}
                                    <div className="hr-employee-card__location">
                                        <MapPin size={12} /><span>{emp.location}</span>
                                    </div>

                                    {/* Divider + Contact Actions */}
                                    <div className="hr-employee-card__footer">
                                        <button className="hr-employee-card__action-btn" title={emp.email} onClick={(e) => e.stopPropagation()}>
                                            <Mail size={14} />
                                        </button>
                                        <button className="hr-employee-card__action-btn" title={emp.phone} onClick={(e) => e.stopPropagation()}>
                                            <Phone size={14} />
                                        </button>
                                        <button className="hr-employee-card__action-btn" title={`Manager: ${emp.manager}`} onClick={(e) => e.stopPropagation()}>
                                            <Users size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="hr-employee-list">
                            <table className="hr-payroll-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Department</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Location</th>
                                        <th>Manager</th>
                                        <th style={{ width: '80px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id} onClick={() => handleViewEmployee(emp)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className="hr-payroll-employee">
                                                    <Avatar name={emp.name} size="sm" src={emp.image_url} />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="hr-employee-card__dept" style={{ marginBottom: 0 }}>
                                                    {emp.department}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="hr-employee-card__dept" style={{ marginBottom: 0, color: typeColors[emp.type], background: `color-mix(in srgb, ${typeColors[emp.type]} 15%, transparent)` }}>
                                                    {emp.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="hr-employee-card__dept" style={{ marginBottom: 0, color: statusColors[emp.status], background: `color-mix(in srgb, ${statusColors[emp.status]} 15%, transparent)` }}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td>{emp.location}</td>
                                            <td>{emp.manager}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="hr-icon-btn" onClick={(e) => handleEditEmployee(e, emp)}><Pencil size={14} /></button>
                                                    <button className="hr-icon-btn hr-icon-btn--danger" onClick={(e) => handleDeleteClick(e, emp.id, 'employee', emp.name)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}





            {/* === PAYROLL === */}
            {activeTab === 'payroll' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Payroll — {payrollMonth}</h2>
                        <div className="hr-payroll-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select className="hr-month-select" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
                                {['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026'].map(m => <option key={m}>{m}</option>)}
                            </select>
                            <select className="hr-dept-select" value={payrollDepartment} onChange={e => setPayrollDepartment(e.target.value)}>
                                {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                            </select>
                            <select className="hr-dept-select" value={payrollStatus} onChange={e => setPayrollStatus(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                            <Button variant="primary" size="sm" icon={DollarSign} onClick={handleRunPayroll}>Run Payroll</Button>
                        </div>
                    </div>
                    <div id="payroll-report-container" style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Payroll Amount</h3>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary-600)', marginTop: '4px' }}>
                                    PKR {filteredPayrollEmployees.reduce((sum, emp) => sum + ((parseFloat(emp.salary) || 0) + (parseFloat(emp.bonus) || 0) - (parseFloat(emp.deductions) || 0)), 0).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{payrollMonth}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredPayrollEmployees.length} Employees</div>
                            </div>
                        </div>
                        <table className="hr-payroll-table">
                            <thead>
                                <tr><th>Employee</th><th>Base Salary</th><th>Bonuses</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th style={{ width: '60px' }} data-html2canvas-ignore>Actions</th></tr>
                            </thead>
                            <tbody>
                                {filteredPayrollEmployees.length > 0 ? filteredPayrollEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td><div className="hr-payroll-employee"><Avatar name={emp.name} size="sm" /><span>{emp.name}</span></div></td>
                                        <td>PKR {(parseFloat(emp.salary) || 0).toLocaleString()}</td>
                                        <td className="positive">+PKR {(parseFloat(emp.bonus) || 0).toLocaleString()}</td>
                                        <td className="negative">-PKR {(parseFloat(emp.deductions) || 0).toLocaleString()}</td>
                                        <td className="hr-payroll-net">PKR {((parseFloat(emp.salary) || 0) + (parseFloat(emp.bonus) || 0) - (parseFloat(emp.deductions) || 0)).toLocaleString()}</td>
                                        <td>
                                            <span 
                                                className="hr-employee-card__dept" 
                                                style={{ 
                                                    marginBottom: 0, 
                                                    color: processedMonths.includes(payrollMonth) ? 'var(--success)' : 'var(--warning)', 
                                                    background: `color-mix(in srgb, ${processedMonths.includes(payrollMonth) ? 'var(--success)' : 'var(--warning)'} 15%, transparent)` 
                                                }}
                                            >
                                                {processedMonths.includes(payrollMonth) ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td data-html2canvas-ignore>
                                            <button className="hr-icon-btn" onClick={() => handleEditPayroll(emp)}><Pencil size={14} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            No employees found for this payroll period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === PERFORMANCE === */}
            {activeTab === 'performance' && (
                <div className="hr-section">
                    <div className="hr-section__header">
                        <h2>Performance Reviews</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="ghost" size="sm" icon={Plus} onClick={() => { setEditId(null); setPerformanceFormData({ employeeId: '', name: '', rating: 5, feedback: '', goals: '' }); setIsPerformanceModalOpen(true); }}>New Review</Button>
                            <Button variant="ghost" size="sm" icon={TrendingUp} onClick={() => dispatch(addToast({ title: 'Performance Stats', message: 'Generating company-wide performance report...', type: 'info' }))}>Full Report</Button>
                        </div>
                    </div>
                    <div className="hr-performance-grid">
                        {performanceReviews.map(review => (
                            <div key={review.id} className="hr-performance-card glass-card" onClick={() => handleViewEmployee(review)} style={{ cursor: 'pointer', position: 'relative' }}>
                                <div className="hr-performance-card__actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
                                    <button className="hr-icon-btn" onClick={(e) => handleEditReview(e, review)} title="Edit"><Pencil size={14} /></button>
                                    <button className="hr-icon-btn hr-icon-btn--danger" onClick={(e) => handleDeleteClick(e, review.id, 'review', review.name)} title="Delete"><Trash2 size={14} /></button>
                                </div>
                                <div className="hr-performance-card__header">
                                    <Avatar name={review.name} size="lg" />
                                    <div><h3>{review.name}</h3>
                                        <div className="hr-performance-rating-tag">
                                            <div className="hr-rating">
                                                {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= review.rating ? 'currentColor' : 'none'} />)}
                                            </div>
                                            <span>{review.rating}/5 Rating</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hr-performance-card__goals">
                                    <h4>Goals</h4>
                                    {review.goals.map((g, i) => (
                                        <div key={i} className="hr-goal">
                                            <div className="hr-goal__header"><span>{g.text}</span><span>{g.progress}%</span></div>
                                            <div className="hr-goal__bar"><div className="hr-goal__fill" style={{ width: `${g.progress}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hr-performance-card__feedback">
                                    <h4>Manager Feedback</h4>
                                    <p>{review.feedback}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Employee" : "Add New Employee"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveEmployee} disabled={!formData.name}>
                            {editId ? "Update Employee" : "Add Employee"}
                        </Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Full Name</label>
                            <input
                                type="text"
                                className="dw-form-input"
                                placeholder="e.g. Ali Hassan"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Role</label>
                            <input
                                type="text"
                                className="dw-form-input"
                                placeholder="e.g. Backend Developer"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Department</label>
                            <select
                                className="dw-form-input"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option>Engineering</option>
                                <option>Design</option>
                                <option>Operations</option>
                                <option>Marketing</option>
                                <option>HR</option>
                            </select>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Manager (Name or Role)</label>
                            <input
                                list="manager-list"
                                className="dw-form-input"
                                placeholder="e.g. CEO, CTO, or Manager Name"
                                value={formData.manager}
                                onChange={e => setFormData({ ...formData, manager: e.target.value })}
                            />
                            <datalist id="manager-list">
                                {managerSuggestions.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>
                    <div className="dw-form-group" style={{ marginBottom: '20px' }}>
                        <label className="dw-checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.isManager}
                                onChange={e => setFormData({ ...formData, isManager: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Add this role/person to the Manager List? (Yes/No)</span>
                        </label>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '28px' }}>
                            If enabled, this person's Name and Role will appear as options in the Manager selection for others.
                        </p>
                    </div>
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Email</label>
                            <input
                                type="email"
                                className="dw-form-input"
                                placeholder="ali@developwork.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Phone</label>
                            <input
                                type="text"
                                className="dw-form-input"
                                placeholder="+92 300 3456789"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Location</label>
                            <input
                                type="text"
                                className="dw-form-input"
                                placeholder="e.g. Karachi"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Employment Type</label>
                            <select
                                className="dw-form-input"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                                <option>Remote</option>
                            </select>
                        </div>
                    </div>
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Basic Salary (PKR)</label>
                            <input
                                type="number"
                                className="dw-form-input"
                                placeholder="e.g. 50000"
                                value={formData.salary}
                                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                            />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Commission (PKR)</label>
                            <input
                                type="number"
                                className="dw-form-input"
                                placeholder="e.g. 5000"
                                value={formData.commission}
                                onChange={e => setFormData({ ...formData, commission: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="hr-profile-info-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Joining Date</label>
                            <input
                                type="date"
                                className="dw-form-input"
                                value={formData.joinDate}
                                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                            />
                        </div>
                        <div className="dw-form-group"></div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Personal Documents (CV/Personal Records)</label>
                        <div className="hr-file-upload-zone" onClick={() => fileInputRef.current?.click()} style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'var(--bg-primary)',
                            transition: 'all 0.2s'
                        }}>
                            <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                {formData.documentName ? `Selected: ${formData.documentName}` : 'Click to select or drag & drop files'}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                PDF, DOC, or Images up to 10MB
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Skills (Comma separated)</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="Python, Django, PostgreSQL"
                            value={formData.skills}
                            onChange={e => setFormData({ ...formData, skills: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                title="Employee Profile"
                footer={<Button variant="primary" onClick={() => setIsProfileModalOpen(false)}>Close</Button>}
            >
                {selectedEmployee && (
                    <div className="hr-profile-detail">
                        <div className="hr-profile-detail__header" style={{ 
                            background: 'linear-gradient(to bottom, var(--primary-50), transparent)',
                            padding: '40px 20px',
                            borderRadius: '20px'
                        }}>
                            <div className="hr-profile-detail__avatar-container" style={{
                                position: 'relative',
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 16px'
                            }}>
                                <img 
                                    src={getEmployeeVector(selectedEmployee)} 
                                    alt="Employee Avatar" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                />
                            </div>
                            <div className="hr-profile-detail__id">ID: #{selectedEmployee.id ? selectedEmployee.id.substring(0, 8) : '---'}</div>
                        </div>
                        <div className="hr-profile-detail__body">
                            <div className="hr-profile-info-group">
                                <label>Full Name</label>
                                <div>{selectedEmployee.name}</div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Role</label>
                                    <div>{selectedEmployee.role}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Department</label>
                                    <div>{selectedEmployee.department}</div>
                                </div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Salary</label>
                                    <div>PKR {(selectedEmployee.salary || 0).toLocaleString()}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Commission</label>
                                    <div>PKR {(selectedEmployee.commission || 0).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Email</label>
                                    <div>{selectedEmployee.email || 'N/A'}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Phone</label>
                                    <div>{selectedEmployee.phone || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Location</label>
                                    <div>{selectedEmployee.location || 'N/A'}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Joining Date</label>
                                    <div>{selectedEmployee.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                                </div>
                            </div>
                            {selectedEmployee.document_url && (
                                <div className="hr-profile-info-group">
                                    <label>Personal Documents</label>
                                    <div style={{ marginTop: '8px' }}>
                                        <a 
                                            href={selectedEmployee.document_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--primary-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}
                                        >
                                            <FileText size={16} /> View Employee CV / Records
                                        </a>
                                    </div>
                                </div>
                            )}
                            {selectedEmployee.skills && (
                                <div className="hr-profile-info-group">
                                    <label>Skills</label>
                                    <div className="hr-employee-card__skills" style={{ marginTop: '8px' }}>
                                        {selectedEmployee.skills.map(s => <span key={s} className="hr-skill-tag">{s}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isPerformanceModalOpen}
                onClose={() => setIsPerformanceModalOpen(false)}
                title={editId ? "Edit Performance Review" : "New Performance Review"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsPerformanceModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSavePerformanceReview} disabled={!performanceFormData.employeeId}>Save Review</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Employee Name</label>
                        <select
                            className="dw-form-input"
                            value={performanceFormData.employeeId || ''}
                            onChange={e => {
                                const empId = e.target.value;
                                const emp = employees.find(x => x.id === empId);
                                setPerformanceFormData({
                                    ...performanceFormData,
                                    employeeId: empId,
                                    name: emp ? emp.name : ''
                                });
                            }}
                        >
                            <option value="" disabled>Select an Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Rating (1-5)</label>
                        <select
                            className="dw-form-input"
                            value={performanceFormData.rating}
                            onChange={e => setPerformanceFormData({ ...performanceFormData, rating: e.target.value })}
                        >
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Fair</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Very Good</option>
                            <option value="5">5 - Excellent</option>
                        </select>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Feedback</label>
                        <textarea
                            className="dw-form-input"
                            style={{ height: '100px' }}
                            placeholder="Provide constructive feedback..."
                            value={performanceFormData.feedback}
                            onChange={e => setPerformanceFormData({ ...performanceFormData, feedback: e.target.value })}
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Goals (One per line)</label>
                        <textarea
                            className="dw-form-input"
                            style={{ height: '100px' }}
                            placeholder="Goal 1&#10;Goal 2..."
                            value={performanceFormData.goals}
                            onChange={e => setPerformanceFormData({ ...performanceFormData, goals: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isPayrollModalOpen}
                onClose={() => setIsPayrollModalOpen(false)}
                title={`Adjust Payroll: ${payrollFormData.name}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsPayrollModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSavePayroll}>Update Records</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Base Salary ($)</label>
                        <input
                            type="number"
                            className="dw-form-input"
                            value={payrollFormData.salary}
                            onChange={e => setPayrollFormData({ ...payrollFormData, salary: e.target.value })}
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Bonuses ($)</label>
                        <input
                            type="number"
                            className="dw-form-input"
                            value={payrollFormData.bonus}
                            onChange={e => setPayrollFormData({ ...payrollFormData, bonus: e.target.value })}
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Deductions ($)</label>
                        <input
                            type="number"
                            className="dw-form-input"
                            value={payrollFormData.deductions}
                            onChange={e => setPayrollFormData({ ...payrollFormData, deductions: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={confirmDelete} style={{ background: 'var(--danger)' }}>Delete</Button>
                    </>
                }
            >
                <p>Are you sure you want to remove <strong>{deleteConfig.name}</strong>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default HR;

