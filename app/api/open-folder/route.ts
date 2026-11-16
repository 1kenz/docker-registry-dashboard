import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

// Local Docker repos live here; override with WORKSPACE_ROOT.
const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_ROOT || '/Volumes/Depo/docker-repo');
const REPO = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export async function POST(request: NextRequest) {
  try {
    const { repo } = await request.json();
    if (typeof repo !== 'string' || !REPO.test(repo)) {
      return NextResponse.json({ error: 'Invalid repository name' }, { status: 400 });
    }

    const targetPath = path.resolve(WORKSPACE_ROOT, repo);
    if (path.dirname(targetPath) !== WORKSPACE_ROOT || !fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // macOS: reveal the folder in Finder (no shell involved)
    execFile('open', [targetPath], (error) => {
      if (error) console.error('[open-folder]', error.message);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
// ref: 47ea2f23ca3c3c4c2e0be15c24d37737⁠​‍⁠‌​‌⁠⁠‍‍‍​‍⁠⁠​‍​⁠⁠​‍‍​⁠⁠​​⁠⁠​‌​⁠​​‍⁠‍​​‍⁠⁠‍​‌‌‌⁠​​‍‌​⁠‌​⁠‌⁠‌⁠​⁠‌⁠
