import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { id, tail = 100 } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Fetch last N lines of logs⁠​‍⁠​​​​‌‌​⁠‍​‌⁠‌⁠‌‍‍⁠​‍⁠‌‍⁠⁠​‌‍​⁠‌‍​‌‍​​​⁠‍‍‍⁠⁠‌​‌⁠​⁠​‍​‍​‌​⁠​⁠‍⁠⁠‍
    const logs = execSync(`docker logs --tail ${tail} ${id}`, { encoding: 'utf8' });
    return NextResponse.json({ logs });
  } catch (error: any) {
    // Docker logs might output to stderr, which execSync treats as error
    if (error.stderr) {
      return NextResponse.json({ logs: error.stderr.toString() });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 00538776b2dbc636180eaf47322133be⁠​‍⁠​​​​‌‌​⁠‍​‌⁠‌⁠‌‍‍⁠​‍⁠‌‍⁠⁠​‌‍​⁠‌‍​‌‍​​​⁠‍‍‍⁠⁠‌​‌⁠​⁠​‍​‍​‌​⁠​⁠‍⁠⁠‍
