import { NextRequest, NextResponse } from 'next/server';

/**
 * The API drives the host's Docker daemon, so it only answers same-origin requests
 * addressed to an allowed host. This blocks cross-site requests from other tabs
 * and DNS-rebinding. ALLOWED_HOSTS (comma-separated host:port) extends the list.
 */
const DEFAULT_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

function allowedHost(host: string): boolean {
  const extra = (process.env.ALLOWED_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (extra.includes(host)) return true;
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
  return DEFAULT_HOSTS.includes(name);
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  if (!allowedHost(host)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }
  const origin = request.headers.get('origin');
  if (origin) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      /* malformed origin is rejected below */
    }
    if (originHost !== host) {
      return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
    }
  }
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE') {
    const type = request.headers.get('content-type') ?? '';
    if (!type.startsWith('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
