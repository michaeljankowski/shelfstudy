import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(' Missing Supabase environment variables!');
  console.error('Make sure server/.env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const STORAGE_BUCKET = 'note-images';

console.log('Supabase client initialized');