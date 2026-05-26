import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nzzzwllxdrmkjulurmaf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY_HERE'; // I'll extract it from .env

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    const { data, error } = await supabase
        .from('projects')
        .select('*, project_members(user_id, role, profiles!project_members_user_id_fkey(name, avatar_url))')
        .limit(1);
    
    if (error) {
        console.error("ERROR:", error);
    } else {
        console.log("SUCCESS:", data);
    }
}

test();
