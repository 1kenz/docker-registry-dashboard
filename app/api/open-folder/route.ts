import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Local Docker repos are stored in /Volumes/Depo/docker-repo⁠​‍⁠‌​‌⁠⁠‍‍‍​‍⁠⁠​‍​⁠⁠​‍‍​⁠⁠​​⁠⁠​‌​⁠​​‍⁠‍​​‍⁠⁠‍​‌‌‌⁠​​‍‌​⁠‌​⁠‌⁠‌⁠​⁠‌⁠
const WORKSPACE_ROOT = '/Volumes/Depo/docker-repo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo } = body;

    if (!repo) {
      return NextResponse.json({ error: 'Repo name required' }, { status: 400 });
    }

    // Look for the repo folder directly inside docker-repo
    const targetPath = path.join(WORKSPACE_ROOT, repo);

    // Check if path exists
    if (!fs.existsSync(targetPath)) {
        console.log(`Path not found: ${targetPath}`);
        return NextResponse.json({ error: `Folder not found: ${targetPath}` }, { status: 404 });
    }

    console.log(`Opening folder: ${targetPath}`);
    
    // MacOS command to open folder
    exec(`open "${targetPath}"`, (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
        }
    });

    return NextResponse.json({ success: true, path: targetPath });

  } catch (error: any) {
    console.error('Open folder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 47ea2f23ca3c3c4c2e0be15c24d37737⁠​‍⁠‌​‌⁠⁠‍‍‍​‍⁠⁠​‍​⁠⁠​‍‍​⁠⁠​​⁠⁠​‌​⁠​​‍⁠‍​​‍⁠⁠‍​‌‌‌⁠​​‍‌​⁠‌​⁠‌⁠‌⁠​⁠‌⁠
