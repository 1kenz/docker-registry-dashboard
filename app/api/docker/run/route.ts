import { NextRequest, NextResponse } from 'next/server';
import { docker, containerRef, imageRef, portArgs, errorMessage, InputError } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { image, ports, name } = await request.json();
    // docker run -d [--name <name>] [-p <host>:<container> ...] <image>
    const args = ['run', '-d'];
    if (name) args.push('--name', containerRef(name));
    args.push(...portArgs(ports), imageRef(image));

    const { stdout } = await docker(args, 120_000);
    return NextResponse.json({
      success: true,
      containerId: stdout.trim(),
      message: 'Container started successfully',
    });
  } catch (error) {
    const status = error instanceof InputError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
// ref: f3b569653bfa2d8aae1c9bb2e62530a3⁠​‍⁠⁠⁠​⁠‍⁠‌‌‌‍‍‌‌‍‌‌​⁠‍⁠⁠⁠‍‍​‍⁠‌‍​‍‍‍‍⁠‍​‌⁠​‍‌‍⁠‍⁠​‍⁠‍‌‍​‍‌‌​⁠​​‍‍​⁠
