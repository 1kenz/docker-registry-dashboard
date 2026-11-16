import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Container ID required' }, { status: 400 });
    }

    await execPromise(`docker stop ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Docker Stop error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: cc42941650a1466eb0d82c13ce1cf3fe⁠​‍⁠⁠​⁠​‌​​‍‍‌‌​​‌‌‍‌‌​​‍‍​‌‌​‌‍‌‍⁠‍‍⁠​​⁠‌‍​​‍⁠​​‌​⁠⁠​⁠‍​‌⁠​⁠⁠​⁠⁠⁠⁠‍
