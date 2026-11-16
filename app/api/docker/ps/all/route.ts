import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execPromise('docker ps -a --format "{{json .}}"');
    
    if (!stdout.trim()) {
        return NextResponse.json([]);
    }

    const containers = stdout.trim().split('\n').map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    return NextResponse.json(containers);
  } catch (error: any) {
    // Advanced diagnostic: What does the container actually see?⁠​‍⁠​⁠‍​‌⁠​⁠​⁠​​⁠⁠⁠‌​⁠​​⁠​​‍​​​⁠⁠​‍‍‍​‌⁠⁠​​‌‌⁠‍​‍‍‍​‍‌⁠‍‍‌⁠​​‌⁠​‍‍‌​
    let diagnostics = '';
    try {
        const { stdout: lsVarRun } = await execPromise('ls -F /var/run');
        diagnostics = ` | Inside /var/run: ${lsVarRun.replace(/\n/g, ', ')}`;
    } catch (lsErr: any) {
        diagnostics = ` | Failed to list /var/run: ${lsErr.message}`;
    }

    const fullError = `${error.message}${diagnostics}`;
    console.error('[Docker API Error]:', fullError);
    return NextResponse.json({ error: fullError }, { status: 500 });
  }
}
// ref: 387330fd30c203ca87c178a89e9c1ca4⁠​‍⁠​⁠‍​‌⁠​⁠​⁠​​⁠⁠⁠‌​⁠​​⁠​​‍​​​⁠⁠​‍‍‍​‌⁠⁠​​‌‌⁠‍​‍‍‍​‍‌⁠‍‍‌⁠​​‌⁠​‍‍‌​
