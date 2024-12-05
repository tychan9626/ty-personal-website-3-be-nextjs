import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatUserDisplayName } from '@/lib/shared_function';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  const origin = req.headers.get('origin');
  const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];

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

export async function GET(req: NextRequest) {
  try {
    // 檢查來源
    const origin = req.headers.get('origin');
    const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];

    // 從 URL 查詢參數中提取 user_id
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    // 獲取用戶資料
    const { data: users, error: usersError } = await supabase
      .from('user')
      .select(
        'id, legal_first_name, legal_middle_name, legal_last_name, preferred_first_name, customized_display_name, name_display_mode'
      )
      .eq('status', 1)
      .order('sequence_number', { ascending: true });

    if (usersError || !users) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all users.' },
        { status: 401 }
      );
    }

    const OutputUsers = users.map((user) => ({
      id: user.id,
      display_name: formatUserDisplayName(user),
    }));

    // 獲取貨幣資料
    const { data: currencies, error: currenciesError } = await supabase
      .from('currency')
      .select('tb_tyapp_crny_id, code')
      .eq('status', 1)
      .order('display_sequence', { ascending: true });

    if (currenciesError || !currencies) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all currencies.' },
        { status: 401 }
      );
    }

    // Get wallet data
    const { data: wallets, error: walletsError } = await supabase
      .from('tyapp_wallet')
      .select('tb_tyapp_wlt_id, user_id, display_name')
      .eq('status', 1);

    if (walletsError || !wallets) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all wallets.' },
        { status: 401 }
      );
    }

    // Get wallet data
    const { data: units, error: unitsError } = await supabase
      .from('unit')
      .select('tb_tyapp_unt_id, code')
      .eq('status', 1);

    if (unitsError || !units) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all units.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        users: OutputUsers,
        currencies: currencies,
        wallets: wallets,
        units: units
      },
    });

    // 處理 CORS
    if (origin !== null && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', 'null');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}