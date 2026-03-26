import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skxcgdhaechxpxhmxzjl.supabase.co';
const supabaseKey = 'sb_publishable_3T6aG0hDIouQHpRA1eCZHQ_CqZX6UM3';

export const supabase = createClient(supabaseUrl, supabaseKey);
