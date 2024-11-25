import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { account_name } = await req.json();

    // Step 1: Find user
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('account_name')
      .eq('account_name', account_name)
      .eq('status', 1)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'There is a problem in accessing this account. Either it is not exist or it is disabled.' }),
        { status: 401 }
      );
    }

    return new Response(JSON.stringify({ success: true, user }), { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
