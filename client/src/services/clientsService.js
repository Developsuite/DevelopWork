import { supabase } from '../lib/supabase';

export const clientsService = {
    async getClients() {
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createClient(client) {
        const { data, error } = await supabase.from('clients').insert(client).select().single();
        if (error) throw error;
        return data;
    },

    async updateClient(id, updates) {
        const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteClient(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== CLIENT PROJECTS ==========
    async getClientProjects(clientId) {
        let query = supabase.from('client_projects').select('*').order('created_at', { ascending: false });
        if (clientId) query = query.eq('client_id', clientId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async createClientProject(project) {
        const { data, error } = await supabase.from('client_projects').insert(project).select().single();
        if (error) throw error;
        return data;
    },

    async updateClientProject(id, updates) {
        const { data, error } = await supabase.from('client_projects').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteClientProject(id) {
        const { error } = await supabase.from('client_projects').delete().eq('id', id);
        if (error) throw error;
    },
};
