import { NextRequest, NextResponse } from 'next/server';
import { docker, containerRef, errorMessage, InputError } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    await docker(['stop', containerRef(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof InputError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
// ref: cc42941650a1466eb0d82c13ce1cf3fe⁠​‍⁠⁠​⁠​‌​​‍‍‌‌​​‌‌‍‌‌​​‍‍​‌‌​‌‍‌‍⁠‍‍⁠​​⁠‌‍​​‍⁠​​‌​⁠⁠​⁠‍​‌⁠​⁠⁠​⁠⁠⁠⁠‍
