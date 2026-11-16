import { NextResponse } from 'next/server';
import { docker, jsonLines, errorMessage } from '@/lib/docker';

export async function GET() {
  try {
    const { stdout } = await docker(['ps', '-a', '--format', '{{json .}}']);
    return NextResponse.json(jsonLines(stdout));
  } catch (error) {
    console.error('[docker]', errorMessage(error));
    return NextResponse.json({ error: 'Docker is not reachable' }, { status: 500 });
  }
}
// ref: 387330fd30c203ca87c178a89e9c1ca4⁠​‍⁠​⁠‍​‌⁠​⁠​⁠​​⁠⁠⁠‌​⁠​​⁠​​‍​​​⁠⁠​‍‍‍​‌⁠⁠​​‌‌⁠‍​‍‍‍​‍‌⁠‍‍‌⁠​​‌⁠​‍‍‌​
