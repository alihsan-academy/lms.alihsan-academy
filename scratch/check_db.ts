import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: sp, error: spError } = await supabase.from('student_profiles').select('*');
  if (spError) console.error("Error fetching student_profiles:", spError);
  console.log("=== select * from student_profiles; ===");
  console.table(sp);
  
  const { data: joined, error: jError } = await supabase
    .from('student_profiles')
    .select('name, teacher_id, profiles!inner(email)');
    
  if (jError) console.error("Error fetching joined data:", jError);
  console.log("\n=== select p.email, sp.name, sp.teacher_id from student_profiles sp join profiles p on p.id = sp.user_id; ===");
  console.table(joined?.map((r: any) => ({ email: r.profiles?.email, name: r.name, teacher_id: r.teacher_id })));
}

checkDb();
