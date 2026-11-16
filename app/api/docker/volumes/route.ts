import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execPromise('docker volume ls --format "{{json .}}"');
    
    if (!stdout.trim()) {
        return NextResponse.json([]);
    }

    const volumes = stdout.trim().split('\n').map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    return NextResponse.json(volumes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: d35e33af40cbb09451f694dd0b8abfd3⁠​‍⁠⁠‌​⁠‌‌⁠‍​⁠​⁠‍‍⁠⁠‌​​​⁠​‍⁠‍⁠​​‍‌‌​‌‌​‌⁠⁠‌‍‍‌‌​⁠‌⁠‌​​‍⁠‍​‍‍‍⁠⁠⁠⁠‌​⁠
