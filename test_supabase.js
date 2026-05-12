const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, supabaseKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const userId = '3f058bf4-1b15-4617-af46-9e7f2de950b5';

  console.log('Testing with ANON KEY (simulating client):');
  const res1 = await client.from('profiles').select('role').eq('id', userId).single();
  console.log(JSON.stringify(res1, null, 2));

  console.log('\nTesting with SERVICE ROLE KEY (admin bypass):');
  const res2 = await serviceClient.from('profiles').select('role').eq('id', userId).single();
  console.log(JSON.stringify(res2, null, 2));
}

test();
