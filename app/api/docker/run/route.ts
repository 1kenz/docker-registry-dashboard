import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, ports, name } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image name required' }, { status: 400 });
    }

    // Build the command⁠​‍⁠⁠⁠​⁠‍⁠‌‌‌‍‍‌‌‍‌‌​⁠‍⁠⁠⁠‍‍​‍⁠‌‍​‍‍‍‍⁠‍​‌⁠​‍‌‍⁠‍⁠​‍⁠‍‌‍​‍‌‌​⁠​​‍‍​⁠
    // docker run -d --name <name> -p <host_port>:<container_port> <image>
    let command = `docker run -d`;
    
    if (name) {
      command += ` --name "${name}"`;
    }
    
    if (ports) {
      command += ` -p ${ports}`;
    }
    
    command += ` ${image}`;

    console.log(`Executing: ${command}`);

    try {
      const { stdout, stderr } = await execPromise(command);
      return NextResponse.json({ 
        success: true, 
        containerId: stdout.trim(),
        message: 'Container started successfully'
      });
    } catch (execError: any) {
      console.error('Docker exec error:', execError);
      return NextResponse.json({ 
        error: execError.stderr || execError.message || 'Failed to start container' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: f3b569653bfa2d8aae1c9bb2e62530a3⁠​‍⁠⁠⁠​⁠‍⁠‌‌‌‍‍‌‌‍‌‌​⁠‍⁠⁠⁠‍‍​‍⁠‌‍​‍‍‍‍⁠‍​‌⁠​‍‌‍⁠‍⁠​‍⁠‍‌‍​‍‌‌​⁠​​‍‍​⁠
