import { supabase } from '../lib/supabase';

export const leadsService = {
    // ========== LEADS ==========
    async getLeads() {
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createLead(lead) {
        const { data, error } = await supabase.from('leads').insert(lead).select().single();
        if (error) throw error;
        return data;
    },

    async updateLead(id, updates) {
        const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteLead(id) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== CONTACTS ==========
    async getContacts() {
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createContact(contact) {
        const { data, error } = await supabase.from('contacts').insert(contact).select().single();
        if (error) throw error;
        return data;
    },

    async updateContact(id, updates) {
        const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteContact(id) {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== LEAD STAGE HISTORY ==========
    async addStageChange(entry) {
        const { data, error } = await supabase.from('lead_stage_history').insert(entry).select().single();
        if (error) throw error;
        return data;
    },
};
