import { supabase } from '../lib/supabase';

export const hrService = {
    // ========== EMPLOYEES ==========
    async getEmployees(filters = {}) {
        let query = supabase.from('employees').select('*').order('created_at', { ascending: false });
        if (filters.department && filters.department !== 'all') {
            query = query.eq('department', filters.department);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,role.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async createEmployee(employee) {
        const { data, error } = await supabase.from('employees').insert(employee).select().single();
        if (error) throw error;
        return data;
    },

    async updateEmployee(id, updates) {
        const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteEmployee(id) {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== LEAVE REQUESTS ==========
    async getLeaveRequests() {
        const { data, error } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createLeaveRequest(request) {
        const { data, error } = await supabase.from('leave_requests').insert(request).select().single();
        if (error) throw error;
        return data;
    },

    async updateLeaveRequest(id, updates) {
        const { data, error } = await supabase.from('leave_requests').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },



    // ========== PERFORMANCE REVIEWS ==========
    async getPerformanceReviews() {
        const { data, error } = await supabase.from('performance_reviews').select('*').order('review_date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createPerformanceReview(review) {
        const { data, error } = await supabase.from('performance_reviews').insert(review).select().single();
        if (error) throw error;
        return data;
    },

    async updatePerformanceReview(id, updates) {
        const { data, error } = await supabase.from('performance_reviews').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deletePerformanceReview(id) {
        const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== PAYROLL ==========
    async getPayroll() {
        const { data, error } = await supabase.from('payroll').select('*').order('year', { ascending: false }).order('month', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createPayroll(record) {
        const { data, error } = await supabase.from('payroll').insert(record).select().single();
        if (error) throw error;
        return data;
    },

    async updatePayroll(id, updates) {
        const { data, error } = await supabase.from('payroll').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    // ========== RECRUITMENT (localStorage-backed with rich defaults) ==========
    getJobPostings() {
        const saved = localStorage.getItem('dw-job-postings');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        const defaultPostings = [
            {
                id: 'job-1',
                title: 'Senior Full-Stack Developer',
                department: 'Engineering',
                type: 'Full-time',
                location: 'Islamabad (Hybrid)',
                experience: '4+ years',
                minSalary: 180000,
                maxSalary: 260000,
                status: 'Active',
                description: 'Leading front-end and back-end web development with React, Node.js, and Cloud services.',
                postedDate: '2026-09-15',
                skills: 'React, Node.js, PostgreSQL, TypeScript'
            },
            {
                id: 'job-2',
                title: 'UI/UX Product Designer',
                department: 'Design',
                type: 'Full-time',
                location: 'Remote',
                experience: '3+ years',
                minSalary: 140000,
                maxSalary: 200000,
                status: 'Active',
                description: 'Design intuitive, world-class enterprise SaaS dashboards and collaborative tools.',
                postedDate: '2026-09-20',
                skills: 'Figma, Design Systems, Wireframing, User Research'
            },
            {
                id: 'job-3',
                title: 'DevOps & Cloud Engineer',
                department: 'Engineering',
                type: 'Contract',
                location: 'Lahore',
                experience: '3+ years',
                minSalary: 170000,
                maxSalary: 240000,
                status: 'Active',
                description: 'Manage CI/CD pipelines, container orchestration, Kubernetes clusters, and cloud infrastructure.',
                postedDate: '2026-09-28',
                skills: 'Docker, Kubernetes, AWS, CI/CD, Terraform'
            },
            {
                id: 'job-4',
                title: 'Growth Marketing Specialist',
                department: 'Marketing',
                type: 'Full-time',
                location: 'Islamabad',
                experience: '2+ years',
                minSalary: 110000,
                maxSalary: 160000,
                status: 'Active',
                description: 'Drive user acquisition, lead generation campaigns, SEO, and brand growth.',
                postedDate: '2026-10-02',
                skills: 'Performance Marketing, SEO, Google Analytics, Content'
            }
        ];
        localStorage.setItem('dw-job-postings', JSON.stringify(defaultPostings));
        return defaultPostings;
    },

    saveJobPostings(postings) {
        localStorage.setItem('dw-job-postings', JSON.stringify(postings));
    },

    getApplicants() {
        const saved = localStorage.getItem('dw-applicants');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        const defaultApplicants = [
            {
                id: 'app-1',
                name: 'Hamza Tariq',
                jobId: 'job-1',
                jobTitle: 'Senior Full-Stack Developer',
                department: 'Engineering',
                stage: 'Interview',
                experience: '5 years',
                email: 'hamza.tariq@example.com',
                phone: '+92 321 4455667',
                expectedSalary: 220000,
                rating: 4.8,
                appliedDate: '2026-09-18',
                notes: 'Strong system architecture skills, passed technical assessment with 95% score.',
                portfolio: 'https://github.com/hamzatariq-dev'
            },
            {
                id: 'app-2',
                name: 'Ayesha Khan',
                jobId: 'job-2',
                jobTitle: 'UI/UX Product Designer',
                department: 'Design',
                stage: 'Offered',
                experience: '4 years',
                email: 'ayesha.k@example.com',
                phone: '+92 301 9876543',
                expectedSalary: 190000,
                rating: 4.9,
                appliedDate: '2026-09-22',
                notes: 'Exceptional portfolio with design system examples. Offer letter dispatched.',
                portfolio: 'https://behance.net/ayeshakhan'
            },
            {
                id: 'app-3',
                name: 'Bilal Ahmed',
                jobId: 'job-1',
                jobTitle: 'Senior Full-Stack Developer',
                department: 'Engineering',
                stage: 'Screening',
                experience: '3 years',
                email: 'bilal.dev@example.com',
                phone: '+92 333 1122334',
                expectedSalary: 180000,
                rating: 4.2,
                appliedDate: '2026-10-01',
                notes: 'Solid React & Node.js background, scheduling initial phone screen.',
                portfolio: 'https://linkedin.com/in/bilalahmed'
            },
            {
                id: 'app-4',
                name: 'Zainab Malik',
                jobId: 'job-3',
                jobTitle: 'DevOps & Cloud Engineer',
                department: 'Engineering',
                stage: 'Hired',
                experience: '4 years',
                email: 'zainab.malik@example.com',
                phone: '+92 312 8765432',
                expectedSalary: 210000,
                rating: 5.0,
                appliedDate: '2026-09-29',
                notes: 'Signed offer! Ready to onboard into Engineering team as Cloud Engineer.',
                portfolio: 'https://github.com/zainab-ops'
            },
            {
                id: 'app-5',
                name: 'Daniyal Raza',
                jobId: 'job-4',
                jobTitle: 'Growth Marketing Specialist',
                department: 'Marketing',
                stage: 'Applied',
                experience: '2 years',
                email: 'daniyal.marketing@example.com',
                phone: '+92 345 6677889',
                expectedSalary: 120000,
                rating: 4.0,
                appliedDate: '2026-10-05',
                notes: 'Submitted application via careers portal. Reviewed initial credentials.',
                portfolio: 'https://daniyalmarketing.com'
            },
            {
                id: 'app-6',
                name: 'Usman Farooq',
                jobId: 'job-3',
                jobTitle: 'DevOps & Cloud Engineer',
                department: 'Engineering',
                stage: 'Interview',
                experience: '3.5 years',
                email: 'usman.f@example.com',
                phone: '+92 300 5544332',
                expectedSalary: 195000,
                rating: 4.5,
                appliedDate: '2026-10-03',
                notes: 'Technical interview scheduled with Lead Architect on Monday.',
                portfolio: 'https://github.com/usmanfarooq'
            },
            {
                id: 'app-7',
                name: 'Sara Noor',
                jobId: 'job-2',
                jobTitle: 'UI/UX Product Designer',
                department: 'Design',
                stage: 'Applied',
                experience: '2.5 years',
                email: 'sara.noor@example.com',
                phone: '+92 322 9988776',
                expectedSalary: 150000,
                rating: 4.3,
                appliedDate: '2026-10-08',
                notes: 'Reviewed Behance link, impressive SaaS UI mockups.',
                portfolio: 'https://dribbble.com/saranoor'
            },
            {
                id: 'app-8',
                name: 'Farhan Ali',
                jobId: 'job-4',
                jobTitle: 'Growth Marketing Specialist',
                department: 'Marketing',
                stage: 'Screening',
                experience: '3 years',
                email: 'farhan.ali@example.com',
                phone: '+92 315 2233445',
                expectedSalary: 135000,
                rating: 4.1,
                appliedDate: '2026-10-06',
                notes: 'Good track record running paid ad campaigns and SEO growth.',
                portfolio: 'https://linkedin.com/in/farhanali'
            }
        ];
        localStorage.setItem('dw-applicants', JSON.stringify(defaultApplicants));
        return defaultApplicants;
    },

    saveApplicants(applicants) {
        localStorage.setItem('dw-applicants', JSON.stringify(applicants));
    },
};
