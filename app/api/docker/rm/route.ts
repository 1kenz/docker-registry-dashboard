import { NextRequest, NextResponse } from 'next/server';
import { docker, containerRef, errorMessage, InputError } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    await docker(['rm', '-f', containerRef(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof InputError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
// ref: 5debda1cc1bab805a8153a3a9259efc2⁠​‍⁠‌‌⁠‌⁠‍‍⁠⁠‌‍‍​‌⁠​⁠​​‌‍⁠‍‍‍⁠‍​​​‌‌‍‍‍​​‌‌‌​⁠‍‍​⁠‍‍‍‌​‍‌‌‍‌⁠‍⁠⁠⁠​​‍
