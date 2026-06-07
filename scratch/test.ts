import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
supabase.from('profiles').select('*').limit(2).then(res => console.log(res.data, res.error));
