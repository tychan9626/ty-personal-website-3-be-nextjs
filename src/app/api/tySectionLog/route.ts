import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

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
