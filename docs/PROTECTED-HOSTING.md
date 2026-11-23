# Protected hosting at arikkarim.com/atlas

The server implementation is ready in `secure-server.mjs`. The public GitHub Pages deployment still uses the browser-based entry screen. It has **not** become private.

## What the prepared server protects

The server checks the password before serving the app, bill JSON, official Congress.gov snapshot, chart code, or exports. An unauthenticated request for an asset or data file returns HTTP 401. The login page contains no bill data, password hash, or client-side unlock token. Disabling JavaScript or editing sessionStorage cannot authorize a request.

The password stays in the server environment. Successful login creates an eight-hour signed session backed by server state, with an HttpOnly, SameSite=Strict cookie. Production cookies are Secure. The Lock button revokes the session. Sessions also expire and are invalidated by a server restart. Failed login attempts are limited to ten per client address per fifteen-minute window.

## Start the server

Use Node.js 24 or newer. No dependencies are needed. Configure these values in the host's secret/environment settings:

| Name | Value |
| --- | --- |
| `ATLAS_PASSWORD` | The shared password; do not commit it |
| `ATLAS_SESSION_SECRET` | At least 32 random characters; do not commit it |
| `ATLAS_BASE_PATH` | `/atlas` |
| `ATLAS_PUBLIC_ORIGIN` | `https://arikkarim.com` |
| `PORT` | The port assigned by the host; default `4323` |
| `HOST` | `127.0.0.1` for a local reverse proxy; `0.0.0.0` only when the host needs it |

Then run `npm run start:secure`.

The server refuses to start without a password. If the session secret is omitted, it generates a random key for that process; set a persistent secret for a deployment. The original four-letter password was previously exposed through the browser gate's public verifier and is easy to guess. Choose a stronger password before relying on this for private access.

For a local check, leave `ATLAS_PUBLIC_ORIGIN` unset, use a private test password in the process environment, and open `http://localhost:4323/atlas/`. HTTP cookies are allowed only for this local testing configuration. Never expose the unencrypted test address to public visitors.

## Keep the current URL

GitHub Pages cannot run this Node server. To retain `https://arikkarim.com/atlas/`, an HTTPS reverse proxy or edge route must send **every** `/atlas` and `/atlas/*` request to the protected server. Preserve that path, and keep the rest of the personal website routed to its existing origin. Do not send `.json`, `.js`, or download requests directly to GitHub Pages.

The origin must not offer an alternate public static-file endpoint. With the Node server above, its own direct endpoint also requires authentication. Any CDN must honor `Cache-Control: private, no-store`; do not cache Atlas responses. If multiple server processes are used, configure session affinity or replace the in-memory session store with shared storage.

The default rate limiter uses the socket address. Behind a proxy this conservatively limits all visitors sharing the proxy address. Only enable the factory's `trustProxy` option when the origin is reachable solely through a trusted proxy that overwrites `X-Forwarded-For`.

## Close the other public copies

Routing the website through a protected server alone does not hide data in the public `ArikKarim/atlas` repository or its history. For private access:

1. Make the repository private and review public forks or copies. Previously downloaded data cannot be recalled.
2. Stop the GitHub Pages deployment and remove the public Pages copy, including its `github.io/atlas` route.
3. Deploy the protected server from the private repository, including refreshed data after successful Congress.gov syncs.
4. Route `/atlas/*` to that server over HTTPS and verify that direct JSON requests receive 401 without a session.

These production changes are pending. The current task prepared and tested the server while retaining the existing URL and deployment.

## Checks

Run `npm test` for unauthorized data/asset access, invalid passwords, tampered and expired cookies, logout, HTTPS cookie flags, origin validation, safe return URLs, rate limiting, and subpath routing. Run `npm run audit:trends` to independently reconcile all chart scopes with the reviewed companion dataset.
