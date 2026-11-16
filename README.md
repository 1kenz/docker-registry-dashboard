This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).⁠​‍⁠​​‌⁠‍‌⁠​​⁠​‍⁠⁠​⁠​⁠‍​​​⁠‍​⁠‍‌‍‌⁠⁠​​‍‌‌​‍​‍​​‌​‌​‌⁠​​​‌​⁠⁠‌​‍‍‍‌​‌

## Security model

This dashboard controls the host's Docker daemon through `/var/run/docker.sock`.
Anyone who can reach its API can run containers on the host, so treat it as a
local admin tool:

- `docker-compose.yml` publishes it on `127.0.0.1:7777` only. Do not expose it to
  a network without putting authentication in front of it.
- The API answers only requests addressed to `localhost`, `127.0.0.1` or a host in
  `ALLOWED_HOSTS`, and refuses cross-origin and non-JSON writes (`proxy.ts`).
- Docker commands run without a shell (`execFile`) and every container id, image
  reference, port mapping and log length is validated first (`lib/docker.ts`).
- The registry proxy only talks to `REGISTRY_URL`, `NEXT_PUBLIC_REGISTRY_URL` and
  `REGISTRY_ALLOWED_URLS`.

| Variable | Default | Purpose |
|---|---|---|
| `REGISTRY_URL` | `http://localhost:5001` | Registry the proxy uses |
| `REGISTRY_ALLOWED_URLS` | — | Extra registries the UI may select (comma-separated) |
| `ALLOWED_HOSTS` | — | Extra `host:port` values the UI may be opened through |
| `WORKSPACE_ROOT` | `/Volumes/Depo/docker-repo` | Folder that "Open folder" reveals in Finder |

Run the input-validation tests with `npm test`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
<!-- ref: 079c32f3380e399f09488111c04f4a91⁠​‍⁠​​‌⁠‍‌⁠​​⁠​‍⁠⁠​⁠​⁠‍​​​⁠‍​⁠‍‌‍‌⁠⁠​​‍‌‌​‍​‍​​‌​‌​‌⁠​​​‌​⁠⁠‌​‍‍‍‌​‌ -->
