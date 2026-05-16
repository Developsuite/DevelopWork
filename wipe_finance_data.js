const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from client folder
dotenv.config({ path: path.resolve(process.cwd(), 'client/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in client/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Clearing all finance data to make it fresh and live...');
  
  try {
    // Delete all from transactions
    const { error: tErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (tErr) console.error('Error clearing transactions:', tErr.message);
    else console.log('Transactions cleared.');

    // Delete all from expenses
    const { error: eErr } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (eErr) console.error('Error clearing expenses:', eErr.message);
    else console.log('Expenses cleared.');

    // Delete all from invoices
    const { error: iErr } = await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (iErr) console.error('Error clearing invoices:', iErr.message);
    else console.log('Invoices cleared.');

    console.log('All finance data has been successfully wiped. Dashboard is now fresh and null.');
  } catch (err) {
    console.error('Failed to wipe data:', err);
  }
}

clearData();
