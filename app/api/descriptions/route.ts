import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'descriptions.json');

// Ensure file exists⁠​‍⁠‌⁠​​‌​⁠​‌​⁠‍‍‌​‌⁠​⁠‌​⁠‍​⁠⁠‍​‍⁠⁠⁠‌⁠‌‌⁠‌⁠​‌‌‍‍‍‍⁠​‍‍​​⁠⁠‍‌⁠​‌⁠⁠​​‍
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
}

export async function GET() {
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { repo, text } = body;
        
        if (!repo) return NextResponse.json({ error: 'Repo required' }, { status: 400 });

        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        let data = JSON.parse(fileContent);
        
        data[repo] = text;
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
// ref: 704c4e91cd38f8bf75dc5aaca0f9c7c2⁠​‍⁠‌⁠​​‌​⁠​‌​⁠‍‍‌​‌⁠​⁠‌​⁠‍​⁠⁠‍​‍⁠⁠⁠‌⁠‌‌⁠‌⁠​‌‌‍‍‍‍⁠​‍‍​​⁠⁠‍‌⁠​‌⁠⁠​​‍
