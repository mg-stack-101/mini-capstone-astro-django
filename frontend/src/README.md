# Frontend src update

Replace the existing project's `src/` with this complete `src/` folder. Keep your existing Astro/React/Tailwind configuration, package files, Django backend, environment variables, database, and development `/api` proxy. No new package or backend endpoint is required.

The project still uses the same teal Barangay Complaint Monitoring System identity and the existing Django session/CSRF APIs. No direct Supabase credentials are placed in the frontend.

## Design

Flat white surfaces, fine borders, restrained teal/green accents, compact SVG icons, responsive sidebar/navigation, mobile complaint cards, and a complaint-details drawer. Background blobs use CSS transform animation with no animation library; users can pause them with the footer control, and reduced-motion preferences disable animation. System fonts and local/inline artwork avoid external font/image requests.

## Loading and requests

- Account, statistics, and first admin complaint page are requested in parallel, with private UI withheld until account verification completes.
- Full-page account skeletons are server-rendered before hydration. Statistics and complaint lists have their own skeletons; known data stays visible during refresh.
- Resident complaint history is fetched only when the My complaints tab is opened.
- Search is debounced by 300 ms. Pagination, status filters, and manual refresh start immediately.
- Simultaneous identical GETs share an in-flight request, with consumer-aware cancellation. Completed private responses are not persisted or cached across accounts.
- The current Django CSRF cookie is reused; a CSRF request happens only if no cookie/token is available. Login starts that request in the background while the person types. Django's login token rotation is respected.
- Requests have bounded timeouts and retry feedback. Outdated search responses cannot replace newer results.
- Photo previews use released object URLs rather than base64 state. Selected images are not uploaded until form submission.

This source update reduces frontend waiting and unnecessary requests. Hosted Supabase region, connection-pool saturation, SQL execution time, and Django hosting latency must be measured and tuned server-side; frontend changes cannot guarantee their speed.

## Run

From the existing project root:

```sh
npm run check
npm run dev
```

Use the URL printed by Astro. Keep Django running separately. The included routes remain `/`, `/login/`, `/dashboard/`, `/admin_dashboard/`, and `/resident_dashboard/`.

If your browser still has old source open, restart Astro and refresh the page. Login/logout, form field names, complaint status values, and API URLs remain compatible with the supplied Django backend.

## Verification

Astro type checks completed with zero errors, warnings, or hints, and all five routes built successfully. Browser checks covered five routes at widths of 320, 375, 768, 1024, and 1440 pixels with no document overflow or page JavaScript errors. Interaction checks covered skeletons, parallel requests, pagination/search/status filters, the details drawer, staff status updates, resident history loading, photo selection, password visibility, login, mobile navigation, background pause/reduced motion, and graceful statistics failures.

Separate API checks verified request deduplication, independent cancellation, no completed private-data cache, CSRF rotation/reuse, token warmup, and timeout handling. A real local Django flow verified session login, resident upload/history, logout, and staff status updates. Hosted Supabase latency and physical devices were not benchmarked.
