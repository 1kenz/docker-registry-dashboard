import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure directory and file exist⁠​‍⁠‍​⁠‍‍​‍⁠​⁠⁠⁠​⁠​‍‍⁠​‌‍‍⁠​‍‍‌‍‌‍‍‍‍‍‌​‌⁠​​‍‍⁠⁠‍⁠⁠‍⁠​‌‌​⁠‍​‌‌‌‍‌‌‌​
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, '{}');

export async function GET() {
  try {
    const data = fs.readFileSync(NOTES_FILE, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { repo, content } = await request.json();
    if (!repo) return NextResponse.json({ error: 'Repo required' }, { status: 400 });

    const data = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    data[repo] = content;
    
    fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 8e8b3f32b1aca66aa470afbec5385654⁠​‍⁠‍​⁠‍‍​‍⁠​⁠⁠⁠​⁠​‍‍⁠​‌‍‍⁠​‍‍‌‍‌‍‍‍‍‍‌​‌⁠​​‍‍⁠⁠‍⁠⁠‍⁠​‌‌​⁠‍​‌‌‌‍‌‌‌​
