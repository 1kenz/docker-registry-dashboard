import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
  try {
    // docker ps --format '{{json .}}' returns one JSON object per line⁠​‍⁠​‌​‍‍⁠‌⁠​​⁠⁠​‍‌⁠​‍​‌​​​‍⁠⁠‍⁠‍​​‍​‌‍‌⁠​⁠‍​‍​‌‌​‍​‌​‍⁠⁠‍⁠​⁠‌⁠‌‌​‍‌
    const { stdout } = await execPromise('docker ps --format "{{json .}}"');
    
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
    console.error('Docker PS error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 12b70f272102fb8219ce21484becdd49⁠​‍⁠​‌​‍‍⁠‌⁠​​⁠⁠​‍‌⁠​‍​‌​​​‍⁠⁠‍⁠‍​​‍​‌‍‌⁠​⁠‍​‍​‌‌​‍​‌​‍⁠⁠‍⁠​⁠‌⁠‌‌​‍‌
