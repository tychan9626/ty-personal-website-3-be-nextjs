import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

interface BillItem {
  name_en: string;
  name_zh: string;
  amount: number | null;
  unit_id: string;
  description: string;
  price: number | null;
  tax: number | null;
  on_sale: boolean;
}

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

    const body = await req.json();
    const {
      bill_user_id,
      address_en,
      address_zh,
      organization_en,
      organization_zh,
      action,
      date_time,
      bill_currency_id,
      bill_subtotal,
      bill_tax,
      bill_tips,
      bill_payer_id,
      paid_wallet_id,
      paid_amount,
      remarks,
      bill_items,
    } = body;

    // 驗證基礎參數是否有效
    if (
      !bill_user_id ||
      !bill_currency_id ||
      !Array.isArray(bill_items) ||
      bill_items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid payload: Missing required fields or bill_items array is empty.' },
        { status: 400 }
      );
    }

    // 插入主表數據 (tyapp_bill)
    const { data: bill, error: billError } = await supabase
      .from('tyapp_bill')
      .insert([
        {
          user_id: bill_user_id,
          address_en,
          address_zh,
          organization_en,
          organization_zh,
          action,
          bill_datetime: date_time,
          bill_currency_id,
          bill_subtotal,
          bill_tax,
          bill_tip: bill_tips,
          paid_wallet_id,
          paid_amount,
          remarks,
        },
      ])
      .select('tb_tyapp_bl_id') // 返回自動生成的主鍵 ID
      .single();

    if (billError) {
      console.error('Error inserting bill:', billError);
      return NextResponse.json(
        { error: 'Failed to create bill. Please check the data and try again.' },
        { status: 500 }
      );
    }

    const billId = bill.tb_tyapp_bl_id;

    // 準備插入明細表數據 (tyapp_bill_item)
    const billItemsToInsert = bill_items.map((item: any) => ({
      bill_id: billId,
      name_en: item.name_en,
      name_zh: item.name_zh || null,
      amount: item.amount || null,
      unit_id: item.unit_id || null,
      qty: item.qty || 1, // 預設數量為 1
      description: item.description || null,
      price: item.price || 0,
      tax: item.tax || 0,
      on_sale: item.on_sale || false,
      private: item.private || false, // 是否為私人項目
    }));

    const { error: billItemsError } = await supabase
      .from('tyapp_bill_item')
      .insert(billItemsToInsert);

    if (billItemsError) {
      console.error('Error inserting bill items:', billItemsError);
      return NextResponse.json(
        { error: 'Failed to create bill items. Please check the items data.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      billId
    });
    if (origin !== null && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', 'null');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error adding log:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to add log' },
      { status: 500 }
    );
  }
}