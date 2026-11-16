import { NextRequest, NextResponse } from 'next/server';
import { docker, containerRef, errorMessage, InputError } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    const { stdout } = await docker(['inspect', containerRef(id)]);
    const info = JSON.parse(stdout)[0];
    const networks = info.NetworkSettings?.Networks ?? {};

    // Simplified view for the UI
    return NextResponse.json({
      Id: info.Id,
      Created: info.Created,
      State: info.State,
      Config: {
        Env: info.Config?.Env,
        Image: info.Config?.Image,
        Entrypoint: info.Config?.Entrypoint,
        Cmd: info.Config?.Cmd,
      },
      NetworkSettings: {
        IPAddress: info.NetworkSettings?.IPAddress || networks[Object.keys(networks)[0]]?.IPAddress,
        Ports: info.NetworkSettings?.Ports,
      },
      Mounts: info.Mounts,
    });
  } catch (error) {
    const status = error instanceof InputError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
// ref: 332396cbb85215cda842afc8a17ed5fb⁠​‍⁠​⁠​⁠​‍​⁠‍‌‌‍⁠​‍⁠‍⁠‍​‌‌​‍​‌‌‌⁠​⁠‌‍‍‍​‌​​‍‍‍⁠⁠⁠​‍​‍‍​‌‌⁠⁠‍⁠‌‌‌⁠⁠‍⁠
