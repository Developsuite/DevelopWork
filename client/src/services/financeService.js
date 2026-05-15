import { supabase } from '../lib/supabase';

export const financeService = {
    // ========== TRANSACTIONS ==========
    async getTransactions() {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createTransaction(tx) {
        const { data, error } = await supabase.from('transactions').insert(tx).select().single();
        if (error) throw error;
        return data;
    },

    async updateTransaction(id, updates) {
        const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteTransaction(id) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== INVOICES ==========
    async getInvoices() {
        const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createInvoice(invoice) {
        const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
        if (error) throw error;
        return data;
    },

    async updateInvoice(id, updates) {
        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteInvoice(id) {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== EXPENSES ==========
    async getExpenses() {
        const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createExpense(expense) {
        const { data, error } = await supabase.from('expenses').insert(expense).select().single();
        if (error) throw error;
        return data;
    },

    async updateExpense(id, updates) {
        const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteExpense(id) {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
    },
};
