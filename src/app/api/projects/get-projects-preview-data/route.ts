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

    const section_display_mode_collection = db.collection('section_display_mode');
    const items_and_display_name_collection = db.collection('items_and_display_name');
    const project_preview_collection = db.collection('project_preview');

    //section_display_mode_collection - START
    const display_mode_result = await section_display_mode_collection.findOne({
      section_name: 'design_project',
    });
    if (!display_mode_result) {
      return NextResponse.json(
        { success: false, message: 'Display mode not found.' },
        { status: 404 }
      );
    }
    const display_mode: string = display_mode_result.display_mode;
    //section_display_mode_collection - END


    //items_and_display_name_collection - START
    const items_and_display_name_result = await items_and_display_name_collection.findOne({
      item: 'Design_project_title',
    });

    if (!items_and_display_name_result) {
      return NextResponse.json(
        { success: false, message: 'Webpage title not found.' },
        { status: 404 }
      );
    }

    const page_title: string = items_and_display_name_result.display_name;
    //items_and_display_name_collection - END

    //project_preview_collection - START
    const project_preview_collection_data = await project_preview_collection
      .find({})
      .sort({ dp51_display_sequence: 1 })
      .toArray();

    if (!project_preview_collection_data) {
      return NextResponse.json(
        { success: false, message: 'Project preview data not found.' },
        { status: 404 }
      );
    }
    //project_preview_collection - END

    const response = NextResponse.json({
      success: true,
      data: {
        page_title: page_title,
        display_mode: display_mode,
        all_design_projects_preview: project_preview_collection_data,
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