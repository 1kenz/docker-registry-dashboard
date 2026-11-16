import { NextRequest, NextResponse } from 'next/server';
import { textStore } from '@/lib/store';

const store = textStore('descriptions.json');

export async function GET() {
  return NextResponse.json(store.read());
}

export async function POST(request: NextRequest) {
  try {
    const { repo, text } = await request.json();
    const problem = store.write(repo, text ?? '');
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
// ref: 704c4e91cd38f8bf75dc5aaca0f9c7c2⁠​‍⁠‌⁠​​‌​⁠​‌​⁠‍‍‌​‌⁠​⁠‌​⁠‍​⁠⁠‍​‍⁠⁠⁠‌⁠‌‌⁠‌⁠​‌‌‍‍‍‍⁠​‍‍​​⁠⁠‍‌⁠​‌⁠⁠​​‍
