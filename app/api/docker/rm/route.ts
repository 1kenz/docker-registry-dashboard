import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await execPromise(`docker rm -f ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 5debda1cc1bab805a8153a3a9259efc2⁠​‍⁠‌‌⁠‌⁠‍‍⁠⁠‌‍‍​‌⁠​⁠​​‌‍⁠‍‍‍⁠‍​​​‌‌‍‍‍​​‌‌‌​⁠‍‍​⁠‍‍‍‌​‍‌‌‍‌⁠‍⁠⁠⁠​​‍
