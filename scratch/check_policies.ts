import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies'); // This might not exist
  if (error) {
    // Try querying pg_policies directly
    const { data: policies, error: pError } = await supabase.from('pg_policies').select('*'); // This usually fails due to permissions
    if (pError) {
      console.log("Could not fetch policies via RPC or pg_policies. Using direct SQL if possible...");
      // Try running a raw SQL query via a custom function if it exists, or just use a known way.
      // Since I can't run raw SQL directly without a function, I'll try to find a workaround.
    } else {
      console.table(policies);
    }
  } else {
    console.table(data);
  }
  
  // Let's try to just fetch the table names to be sure
  const { data: tables, error: tError } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles check:", tables ? "Success" : "Failed", tError?.message);

  const { data: sProfiles, error: spError } = await supabase.from('student_profiles').select('*').limit(1);
  console.log("Student Profiles check:", sProfiles ? "Success" : "Failed", spError?.message);
}

checkPolicies();
