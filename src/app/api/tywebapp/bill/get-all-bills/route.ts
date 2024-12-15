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
    //const { searchParams } = new URL(req.url);
    //const user_id = searchParams.get('user_id');

    // Get user data - START
    const { data: user, error: userError } = await supabase
      .from('user')
      .select(
        'id, legal_first_name, legal_middle_name, legal_last_name, preferred_first_name, customized_display_name, name_display_mode'
      )
      .eq('status', 1)
      .order('sequence_number', { ascending: true });

    if (!user || userError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all users.' },
        { status: 401 }
      );
    }

    const outputUserList = user.map((user) => ({
      id: user.id,
      display_name: formatUserDisplayName(user),
    }));
    // Get user data - END


    // Get currency data - START
    const { data: currency, error: currencyError } = await supabase
      .from('currency')
      .select('tb_tyapp_crny_id, code')
      .eq('status', 1)
      .order('display_sequence', { ascending: true });

    if (!currency || currencyError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all currencies.' },
        { status: 401 }
      );
    }

    const outputCurrencyList = currency.map((currency) => ({
      id: currency.tb_tyapp_crny_id,
      display_name: currency.code,
    }));
    // Get currency data - END


    // Get wallet data - START
    const { data: wallet, error: walletError } = await supabase
      .from('tyapp_wallet')
      .select('tb_tyapp_wlt_id, user_id, display_name, currency_id')
      .eq('status', 1);

    if (!wallet || walletError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all wallets.' },
        { status: 401 }
      );
    }

    const outputWalletList = wallet.map((wallet) => ({
      id: wallet.tb_tyapp_wlt_id,
      user_id: wallet.user_id,
      currency_id: wallet.currency_id,
      display_name: wallet.display_name,
    }));
    // Get wallet data - END


    // Get unit data - START
    const { data: unit, error: unitError } = await supabase
      .from('unit')
      .select('tb_tyapp_unt_id, code')
      .eq('status', 1);

    if (!unit || unitError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all units.' },
        { status: 401 }
      );
    }

    const outputUnitList = unit.map((unit) => ({
      id: unit.tb_tyapp_unt_id,
      display_name: unit.code,
    }));
    // Get unit data - END

    // Get bill address, organization, title - START
    const { data: billName, error: billNameError } = await supabase
      .from('tyapp_bill')
      .select('address_en, address_zh, organization_en, organization_zh, action')
      .eq('status', 1);

    if (!billName || billNameError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all bills\' title.' },
        { status: 401 }
      );
    }

    const outputBillAddressEn = billName.map((bill) => bill.address_en).filter((item) => item !== null);
    const outputBillAddressZh = billName.map((bill) => bill.address_zh).filter((item) => item !== null);
    const outputBillOrganizationEn = billName.map((bill) => bill.organization_en).filter((item) => item !== null);
    const outputBillOrganizationZh = billName.map((bill) => bill.organization_zh).filter((item) => item !== null);
    const outputBillAction = billName.map((bill) => bill.action).filter((item) => item !== null);
    // Get bill address, organization, title - END


    // Get bill item name - START
    const { data: billItemName, error: billItemNameError } = await supabase
      .from('tyapp_bill_item')
      .select('name_en, name_zh')
      .eq('status', 1);

    if (!billItemName || billItemNameError) {
      return NextResponse.json(
        { success: false, message: 'Failed to get all bill items\' title.' },
        { status: 401 }
      );
    }

    const outputBillItemNameEn = billItemName.map((bill) => bill.name_en);
    const outputBillItemNameZh = billItemName.map((bill) => bill.name_zh);
    // Get bill item name - END

    const response = NextResponse.json({
      success: true,
      data: {
        all_users: outputUserList,
        all_currencies: outputCurrencyList,
        all_wallets: outputWalletList,
        all_units: outputUnitList,
        all_bill_address_en: outputBillAddressEn,
        all_bill_address_zh: outputBillAddressZh,
        all_bill_organization_en: outputBillOrganizationEn,
        all_bill_organization_zh: outputBillOrganizationZh,
        all_bill_action: outputBillAction,
        all_bill_item_name_en: outputBillItemNameEn,
        all_bill_item_name_zh: outputBillItemNameZh,
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
  } catch (error) {
    console.error('Failed to get new bill init value:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get new bill init value' },
      { status: 500 }
    );
  }
}