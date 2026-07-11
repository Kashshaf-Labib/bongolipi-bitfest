import Chat from '@/db/models/Chat';
import { dbConnect } from '@/db/mongod';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const { userId } = getAuth(req);

    const sessions = await Chat.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$sessionId',
          title: { $first: '$content' }, // first message becomes the label
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { createdAt: -1 } }, // newest sessions first
      { $project: { _id: 0, sessionId: '$_id', title: 1 } },
    ]);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
};


export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await getAuth(req);

    const { sessionId, role, content } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'SessionId or message was not provided' },
        { status: 401 },
      );
    }

    await dbConnect();
    const chat = new Chat({ userId, sessionId, content, role });
    await chat.save();
    return NextResponse.json(chat);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
    
  }
}