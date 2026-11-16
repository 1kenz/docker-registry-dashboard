import { NextRequest, NextResponse } from 'next/server';
import { textStore } from '@/lib/store';

const store = textStore('notes.json');

export async function GET() {
  return NextResponse.json(store.read());
}

export async function POST(request: NextRequest) {
  try {
    const { repo, content } = await request.json();
    const problem = store.write(repo, content ?? '');
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
// ref: 8e8b3f32b1aca66aa470afbec5385654⁠​‍⁠‍​⁠‍‍​‍⁠​⁠⁠⁠​⁠​‍‍⁠​‌‍‍⁠​‍‍‌‍‌‍‍‍‍‍‌​‌⁠​​‍‍⁠⁠‍⁠⁠‍⁠​‌‌​⁠‍​‌‌‌‍‌‌‌​
