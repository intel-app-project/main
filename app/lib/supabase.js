import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnmhgdqvpnpyrcasnnvv.supabase.co';
const supabaseAnonKey = 'sb_publishable_RyNHHEo1O4tzwZ2VEvQnvw_sKUYE3Xv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
