import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import { User, UserNameDetails } from '@/lib/user-data.model';
import { formatUserDisplayName } from '@/lib/shared_function';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  const origin = req.headers.get('origin');
  const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];

  // 處理 OPTIONS 預檢請求
  if (origin !== null && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', 'null');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');  // 如果需要帶憑證的請求
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];

    const { account_name, password } = await req.json();

    // Step 1: Find user
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, role, legal_first_name, legal_middle_name, legal_last_name, preferred_first_name, customized_display_name, name_display_mode')
      .eq('account_name', account_name)
      .eq('status', 1)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Account does not exist.' }),
        { status: 401 }
      );
    }

    // Step 2: Find password and verify
    const { data: passwordData, error: passwordError } = await supabase
      .from('user_password')
      .select('type, content')
      .eq('user_id', user.id)
      .eq('status', 1)
      .single();

    if (passwordError || !passwordData) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    if (passwordData.type === 1) {
      const isPasswordValid = await bcrypt.compare(password, passwordData.content);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          { status: 401 }
        );
      }

      const user_name_details: UserNameDetails = {
        legal_first_name: user.legal_first_name,
        legal_middle_name: user.legal_middle_name,
        legal_last_name: user.legal_last_name,
        preferred_first_name: user.preferred_first_name,
        customized_display_name: user.customized_display_name,
        name_display_mode: user.name_display_mode,
      }
      const display_name = formatUserDisplayName(user_name_details);

      // Step 3: Return user
      const response = NextResponse.json({
        success: true,
        data: {
          id: user.id,
          display_name: display_name,
        },
      });

      if (origin !== null && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        response.headers.set('Access-Control-Allow-Origin', 'null');
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');

      return response;
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid credentials' }),
        { status: 401 }
      );
    }


  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500 }
    );
  }

}