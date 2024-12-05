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
      user_id,
      bill_datetime,
      bill_currency_id,
      bill_subtotal,
      bill_tax,
      bill_tip,
      paid_wallet_id,
      paid_amount,
      title,
      billItems,
    } = body;

    if (!user_id || !bill_currency_id || !billItems || !Array.isArray(billItems)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Start a transaction
    const { data: bill, error: billError } = await supabase
      .from('tyapp_bill')
      .insert([
        {
          user_id,
          bill_datetime,
          bill_currency_id,
          bill_subtotal,
          bill_tax,
          bill_tip,
          paid_wallet_id,
          paid_amount,
          title,
        },
      ])
      .select('tb_tyapp_bl_id') // Return the generated ID
      .single();

    if (billError) {
      console.error('Error inserting bill:', billError);
      return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
    }

    const billId = bill.tb_tyapp_bl_id;

    // Insert bill items
    const billItemsToInsert = billItems.map((item: BillItem) => ({
      bill_id: billId,
      name_en: item.name_en,
      name_zh: item.name_zh || null,
      amount: item.amount || null,
      unit_id: item.unit_id || null,
      description: item.description || null,
      price: item.price || 0,
      tax: item.tax || 0,
      on_sale: item.on_sale || false,
    }));

    const { error: billItemsError } = await supabase
      .from('tyapp_bill_item')
      .insert(billItemsToInsert);

    if (billItemsError) {
      console.error('Error inserting bill items:', billItemsError);
      return NextResponse.json({ error: 'Failed to create bill items' }, { status: 500 });
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