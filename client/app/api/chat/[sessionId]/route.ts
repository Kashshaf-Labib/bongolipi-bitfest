import Chat from '@/db/models/Chat';
import { dbConnect } from '@/db/mongod';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest, {params}: {params: Promise<{sessionId:string}>}) => {
  try {
    const { sessionId } = await params;

    const { userId } = await getAuth(req);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId was not provided' },
        { status: 401 },
      );
    }

    await dbConnect();
    const contents = await Chat.find({ sessionId });
    return NextResponse.json(contents);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
};
