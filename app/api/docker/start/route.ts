import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await execPromise(`docker start ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: ee9571ff53ac615382a12db9dda0d3c6⁠​‍⁠⁠‍⁠‍‍‌‌‌‌⁠​‌⁠⁠⁠⁠‌‌​⁠‍‍⁠​‌‍​‌‌‌​⁠‍​​‍‍‍​‌​‍⁠‌‍⁠‍‌⁠‌⁠‌‍‍​​⁠‌​⁠⁠​‌‍
