import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

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
export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];
  
    const client: MongoClient = await clientPromise;
    const db = client.db('tychan_web');

    const sectionDisplayModeCollection = db.collection('section_display_mode');
    const itemsAndDisplayNameCollection = db.collection('items_and_display_name');
    const logCollection = db.collection('log');


    const displayModeResult = await sectionDisplayModeCollection.findOne({
      section_name: 'log',
    });
    if (!displayModeResult) {
      return NextResponse.json(
        { success: false, message: 'Display mode for "log" section not found.' },
        { status: 404 }
      );
    }
    const displayMode : string = displayModeResult.display_mode;

    const itemsAndDisplayNameResult = await itemsAndDisplayNameCollection.findOne({
      item: 'Log_title',
    });
    if (!itemsAndDisplayNameResult) {
      return NextResponse.json(
        { success: false, message: 'Title of log page not found.' },
        { status: 404 }
      );
    }
    const PageLogTitle : string = itemsAndDisplayNameResult.display_name;

    const logs = await logCollection.find({}).sort({ "version.major": -1 , "version.minor": -1, "version.patch": -1}).toArray();
    
    const response =  NextResponse.json({
      success: true,
      data: {
        page_log_title: PageLogTitle,
        display_mode: displayMode,
        logs,
      },
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
    console.error('Error fetching logs:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface Log {
  category: string;
  date: string; // YYYY-MM-DD
  version: Version;
  is_critical: boolean;
  description: string[];
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const allowedOrigins = ['http://localhost:4200', 'https://www.tychan.net', 'https://tychan.net'];

    const body = await req.json() as Log;

    if ('_id' in body) {
      delete body._id; // 确保自动生成
    }

    if ('custome_category' in body) {
      delete body.custome_category; // 确保自动生成
    }

    //驗證請求數據
    if (!body.category || !body.date || !body.version || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 驗證日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format (YYYY-MM-DD required)' },
        { status: 400 }
      );
    }

    // 驗證版本號結構
    if (
      typeof body.version.major !== 'number' ||
      typeof body.version.minor !== 'number' ||
      typeof body.version.patch !== 'number'
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid version format' },
        { status: 400 }
      );
    }

    // 連接 MongoDB
    const client: MongoClient = await clientPromise;
    const db = client.db('tychan_web');
    const logCollection = db.collection('log');

    // 插入數據到數據庫
    const result = await logCollection.insertOne(body);

    const response = NextResponse.json({
      success: true,
      message: 'Log added successfully',
      data: result.insertedId,
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