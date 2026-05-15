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
};
