import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_REGISTRY = process.env.REGISTRY_URL || 'http://localhost:5001';

/**
 * Registries the UI may pick through the x-registry-url header. Anything else is
 * refused so the server cannot be used to reach arbitrary addresses (SSRF).
 * REGISTRY_ALLOWED_URLS (comma-separated) extends the list.
 */
function allowedRegistries(): string[] {
  const urls = [
    DEFAULT_REGISTRY,
    process.env.NEXT_PUBLIC_REGISTRY_URL,
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    ...(process.env.REGISTRY_ALLOWED_URLS ?? '').split(','),
  ];
  return urls.filter((u): u is string => !!u && !!u.trim()).map((u) => u.trim().replace(/\/$/, ''));
}

const REGISTRY_PATH = /^v2\/([a-z0-9._\/-]+\/)?(_catalog|tags\/list|manifests\/[A-Za-z0-9_.:-]+|blobs\/sha256:[a-f0-9]{64})?$/;

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathString = resolvedParams.path.join('/');
  if ((pathString !== 'v2' && pathString !== 'v2/' && !REGISTRY_PATH.test(pathString)) || pathString.includes('..')) {
    return NextResponse.json({ error: 'Unsupported registry path' }, { status: 400 });
  }

  const requested = (request.headers.get('x-registry-url') || DEFAULT_REGISTRY).replace(/\/$/, '');
  if (!allowedRegistries().includes(requested)) {
    return NextResponse.json(
      { error: 'Registry URL is not allowed. Add it to REGISTRY_ALLOWED_URLS on the server.' },
      { status: 400 }
    );
  }
  const url = `${requested}/${pathString}`;

  console.log(`[Registry Proxy] ${request.method} -> ${url}`);

  try {
    // Forward the request to the registry
    const res = await fetch(url, {
      method: request.method,
      headers: {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/json',
      },
      // Do not forward body for GET/HEAD, technically registry delete is empty body too.
      // For simplified dashboard, we don't expect body payloads (no push support via UI).
      cache: 'no-store',
    });

    // Check for Docker-Docker-Content-Digest header which is vital for deletions
    const digest = res.headers.get('Docker-Content-Digest');

    // Handle 204 No Content (common for Delete) or other successes without JSON
    if (res.status === 204 || res.status === 202) {
         const response = new NextResponse(null, { status: res.status });
         if (digest) response.headers.set('Docker-Content-Digest', digest);
         return response;
    }

    if (!res.ok) {
        // Try to parse error body if JSON, else text
        let errorBody;
        try { errorBody = await res.json(); } catch { errorBody = { error: res.statusText }; }
        
        return NextResponse.json(
            { ...errorBody, proxyError: `Registry responded with ${res.status}` }, 
            { status: res.status }
        );
    }

    const data = await res.json();
    const response = NextResponse.json(data);
    if (digest) response.headers.set('Docker-Content-Digest', digest);
    return response;

  } catch (error) {
    console.error('[Registry Proxy] Connection Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Docker Registry. Is it running on port 5001?' },
      { status: 502 }
    );
  }
}

export { handler as GET, handler as DELETE, handler as HEAD };
// ref: 983e2ed26906514c57bb38ed19fcde1a⁠​‍⁠‍‌‍​​⁠⁠‍​‍⁠‍⁠‌​‍‌‍‍‌​​‌‍‌‌​‌‌​⁠​‌‌‌⁠‍⁠‍⁠​⁠‍​⁠‍⁠‌​‌‍‌⁠⁠⁠​⁠‌⁠‍​‌‍‍
