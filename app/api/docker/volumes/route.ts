import { NextResponse } from 'next/server';
import { docker, jsonLines, errorMessage } from '@/lib/docker';

export async function GET() {
  try {
    const { stdout } = await docker(['volume', 'ls', '--format', '{{json .}}']);
    return NextResponse.json(jsonLines(stdout));
  } catch (error) {
    console.error('[docker]', errorMessage(error));
    return NextResponse.json({ error: 'Docker is not reachable' }, { status: 500 });
  }
}
// ref: d35e33af40cbb09451f694dd0b8abfd3⁠​‍⁠⁠‌​⁠‌‌⁠‍​⁠​⁠‍‍⁠⁠‌​​​⁠​‍⁠‍⁠​​‍‌‌​‌‌​‌⁠⁠‌‍‍‌‌​⁠‌⁠‌​​‍⁠‍​‍‍‍⁠⁠⁠⁠‌​⁠
