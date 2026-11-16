import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const data = execSync(`docker inspect ${id}`, { encoding: 'utf8' });
    const info = JSON.parse(data)[0];
    
    // Simplify for UI⁠​‍⁠​⁠​⁠​‍​⁠‍‌‌‍⁠​‍⁠‍⁠‍​‌‌​‍​‌‌‌⁠​⁠‌‍‍‍​‌​​‍‍‍⁠⁠⁠​‍​‍‍​‌‌⁠⁠‍⁠‌‌‌⁠⁠‍⁠
    const filtered = {
      Id: info.Id,
      Created: info.Created,
      State: info.State,
      Config: {
        Env: info.Config.Env,
        Image: info.Config.Image,
        Entrypoint: info.Config.Entrypoint,
        Cmd: info.Config.Cmd,
      },
      NetworkSettings: {
        IPAddress: info.NetworkSettings.IPAddress || info.NetworkSettings.Networks[Object.keys(info.NetworkSettings.Networks)[0]]?.IPAddress,
        Ports: info.NetworkSettings.Ports,
      },
      Mounts: info.Mounts
    };

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ref: 332396cbb85215cda842afc8a17ed5fb⁠​‍⁠​⁠​⁠​‍​⁠‍‌‌‍⁠​‍⁠‍⁠‍​‌‌​‍​‌‌‌⁠​⁠‌‍‍‍​‌​​‍‍‍⁠⁠⁠​‍​‍‍​‌‌⁠⁠‍⁠‌‌‌⁠⁠‍⁠
