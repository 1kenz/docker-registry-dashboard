import { NextResponse } from 'next/server';
import { docker, jsonLines, errorMessage } from '@/lib/docker';

export async function GET() {
  try {
    const { stdout } = await docker(['ps', '--format', '{{json .}}']);
    return NextResponse.json(jsonLines(stdout));
  } catch (error) {
    console.error('[docker]', errorMessage(error));
    return NextResponse.json({ error: 'Docker is not reachable' }, { status: 500 });
  }
}
// ref: 12b70f272102fb8219ce21484becdd49⁠​‍⁠​‌​‍‍⁠‌⁠​​⁠⁠​‍‌⁠​‍​‌​​​‍⁠⁠‍⁠‍​​‍​‌‍‌⁠​⁠‍​‍​‌‌​‍​‌​‍⁠⁠‍⁠​⁠‌⁠‌‌​‍‌
