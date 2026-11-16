import { NextRequest, NextResponse } from 'next/server';
import { docker, containerRef, boundedInt, errorMessage, InputError } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { id, tail } = await request.json();
    const { stdout, stderr } = await docker(['logs', '--tail', String(boundedInt(tail, 100, 5000)), containerRef(id)]);
    // Containers often log to stderr; show both streams.
    return NextResponse.json({ logs: `${stdout}${stderr}` });
  } catch (error) {
    const status = error instanceof InputError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
// ref: 00538776b2dbc636180eaf47322133be⁠​‍⁠​​​​‌‌​⁠‍​‌⁠‌⁠‌‍‍⁠​‍⁠‌‍⁠⁠​‌‍​⁠‌‍​‌‍​​​⁠‍‍‍⁠⁠‌​‌⁠​⁠​‍​‍​‌​⁠​⁠‍⁠⁠‍
