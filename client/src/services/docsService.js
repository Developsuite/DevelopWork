import { supabase } from '../lib/supabase';

export const docsService = {
    async getDocuments(filters = {}) {
        let query = supabase.from('documents').select('*').order('updated_at', { ascending: false });
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.search) query = query.ilike('title', `%${filters.search}%`);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async createDocument(doc) {
        const { data, error } = await supabase.from('documents').insert(doc).select().single();
        if (error) throw error;
        return data;
    },

    async updateDocument(id, updates) {
        const { data, error } = await supabase.from('documents').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteDocument(id) {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
    },

    // ========== FOLDERS ==========
    async getFolders() {
        const { data, error } = await supabase.from('document_folders').select('*').order('name');
        if (error) throw error;
        return data;
    },

    async createFolder(name) {
        const { data, error } = await supabase.from('document_folders').insert({ name }).select().single();
        if (error) throw error;
        return data;
    },

    async deleteFolder(name) {
        const { error } = await supabase.from('document_folders').delete().eq('name', name);
        if (error) throw error;
    },

    // ========== VERSIONS ==========
    async getVersions(documentId) {
        const { data, error } = await supabase.from('document_versions').select('*').eq('document_id', documentId).order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createVersion(version) {
        const { data, error } = await supabase.from('document_versions').insert(version).select().single();
        if (error) throw error;
        return data;
    },
};
