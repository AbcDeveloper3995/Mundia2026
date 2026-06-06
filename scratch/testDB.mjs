import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iamkggtiqsahrckbcurg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbWtnZ3RpcXNhaHJja2JjdXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTIyNTMsImV4cCI6MjA5NjI4ODI1M30.zFIzupwW9rKoQmK-AnzJ5Ktmaz1icdsImC3x_9QVq-E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('teams').select('*, groups(*)').limit(5);
  console.log("Teams query result:", JSON.stringify(data, null, 2));
  console.log("Teams query error:", error);
}

check();
