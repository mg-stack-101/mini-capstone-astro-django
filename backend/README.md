# Django backend

Django 5.2 LTS + Django REST Framework. Run Python 3.12+ from this folder. SQLite is the default database for local use; migrations, account commands, validation, authentication, and API tests are included.

## Supabase and development demo

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to connect to Supabase PostgreSQL and seed `admin` / `admin`, staff/resident accounts, six complaints, and demo evidence. DATABASE_URL is optional; blank values preserve local SQLite. Demo credentials are never created automatically.

## Setup

From the project root:

```sh
cd backend
python -m venv .venv
```

Activate the environment:

| Shell | Command |
| --- | --- |
| macOS / Linux | `source .venv/bin/activate` |
| Windows PowerShell | `.venv\Scripts\Activate.ps1` |
| Windows Command Prompt | `.venv\Scripts\activate.bat` |

Then run:

```sh
python -m pip install -r requirements.lock.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py create_resident princess --name "Princess"
python manage.py runserver 127.0.0.1:8000
```

Both account commands prompt for passwords. No database, uploaded evidence, real secrets, or virtual environment are included. Optional development credentials are defined in the explicit seed command; see SUPABASE_SETUP.md. Usernames are used for login; email login and self-registration are not implemented. `createsuperuser` creates an administrator. `create_resident` creates a normal non-staff resident. Staff accounts can also be managed in `/django-admin/` by a superuser.

In a second terminal, run the frontend from the project root:

```sh
npm ci
npm run dev
```

Open **http://localhost:4321** and sign in with a created account. The frontend proxies `/api/` to Django at `127.0.0.1:8000`; use the same hostname consistently in your browser. Administrators go to `/admin_dashboard/`; residents go to `/resident_dashboard/`. The backend health endpoint is **http://127.0.0.1:8000/health/ready/**.

Optional configuration: copy `.env.example` to `.env` inside `backend`, then edit the values. Development defaults work without this file. Never use the development secret or test settings for deployment.

`requirements.lock.txt` pins the exact tested Python dependencies. `requirements.txt` lists the direct compatible dependency ranges for intentional upgrades; regenerate and retest the lock file when upgrading.

## Database connection performance

PostgreSQL uses Django's native psycopg connection pool. Each process keeps one
connection available and grows to at most four while requests are busy.
Connections return to the pool after each request, avoiding repeated DNS/TCP/TLS
setup across request threads. `CONN_MAX_AGE=0` is required with this pool; it
returns connections for reuse rather than opening a new physical connection.
Connection health checks and existing SSL/pooler settings remain enabled.
SQLite behavior is unchanged.

After updating this backend, install `requirements.lock.txt` and restart every
Django process. Keep your existing `.env` and session-pooler URL. No database
migration, SQL changes, frontend changes, or account resets are needed.

Optional `DB_POOL_MAX_SIZE=4` sets the limit **per worker process**. Budget the
sum of all worker limits against the Supabase connection allowance. Run a
production WSGI/ASGI application server for deployment; `runserver` is for local
development. Keep the application server near the Supabase database region.
The first request still needs a connection; remote round trips, password hashing,
and a paused/unavailable database can still affect login time. Login logic,
password hashing, session storage, and API responses are unchanged.

## Folder responsibilities

| Folder | Responsibility |
| --- | --- |
| `config/` | Django entry points, root URL composition, environment readers |
| `config/settings/` | Application/database/session settings and isolated test configuration |
| `health/` | Public process liveness and database readiness |
| `endpoints/` | URL declarations only, grouped by resource |
| `cors/` | Allowed CORS origins, credential policy, trusted CSRF origins |
| `controllers/` | HTTP request handling and response construction |
| `serializers/` | Request validation and JSON representation |
| `models/` | Complaint records, status audit records, migrations, admin integration |
| `services/` | Login/session operations, complaint creation, photo normalization, status writes |
| `queries/` | Read-only database queries and ownership scoping |
| `permissions/` | Staff role policy |
| `common/` | Shared errors, cache policy, throttles, generated upload paths |
| `tests/` | Authentication, complaints, permissions, uploads, health, and CORS tests |

Requests flow through `endpoints → controllers → serializers + permissions → services / queries → models`. Query modules apply ownership restrictions before looking up records. Controllers do not contain model definitions or image processing. Services do not construct HTTP responses.

The `models` folder is the Django app, with app label `barangay`. Its `__init__.py` stays empty to avoid importing models before Django's app registry is ready. `models/models.py` is the standard Django model-discovery bridge; the actual definitions are in `models/complaint.py`. Run Django commands from `backend/` so these packages resolve correctly. Read queries use the name `queries`, which avoids shadowing Python's standard-library `selectors` module.

## API reference

All `/api/` responses are JSON except authorized evidence downloads. Authentication uses Django's database-backed session cookie. Unless marked public, endpoints require an active login.

| Method | Route | Access / behavior |
| --- | --- | --- |
| GET | `/health/` or `/health/live/` | Public process liveness |
| GET | `/health/ready/` | Public database connectivity; 503 if unavailable |
| GET | `/api/csrf/` | Public CSRF cookie + `{ "csrfToken": "…" }` |
| POST | `/api/login/` | Public, CSRF-protected login; returns user and role |
| GET | `/api/me/` | Current session user |
| POST | `/api/logout/` | Invalidates the session; returns JSON |
| GET | `/api/complaints/` | Residents: own records; staff: all records |
| POST | `/api/complaints/` | Creates a complaint owned by the logged-in user |
| GET | `/api/complaints/<uuid>/` | Own record or staff; includes contact/address/history |
| GET | `/api/complaints/<uuid>/photo/` | Authorized evidence download; private and uncached |
| PATCH | `/api/complaints/<uuid>/status/` | Staff only; changes status and creates audit entry |
| GET | `/api/dashboard/` | Staff only; global statistics |

`/health/ready/` verifies a database connection, not migration state or external infrastructure. Run migrations before serving traffic.

### Session requests

1. GET `/api/csrf/`, retaining the CSRF cookie and returned token.
2. POST `/api/login/` with `X-CSRFToken` and credentials: `username`, `password`, optional boolean `remember_me`.
3. Retain the returned session cookie. GET `/api/me/` to read `{ "user": { "id", "username", "name", "role" } }`.
4. Fetch a fresh CSRF token before subsequent POST/PATCH requests; Django rotates it at login.

`src/lib/api.ts` already handles this sequence, same-origin cookies, JSON errors, and fresh CSRF headers. Passwords/tokens are not placed in browser storage. The UI checkbox remembers the username; its `remember_me` field also requests a 14-day server session. Otherwise the session expires when the browser session ends, subject to browser session-restore behavior.

Django REST Framework's session authentication returns **403** for unauthenticated requests in this configuration. A bad login also returns 403; field validation returns 400; rate limits return 429. Client code redirects to login when `/api/me/` reports a missing session.

### Complaint fields

POST multipart form data:

| Field | Rules |
| --- | --- |
| `full_name` | Required, up to 150 characters |
| `contact_number` | Required, up to 30 characters; international/local formats accepted |
| `address` | Required, up to 300 characters |
| `complaint_type` | `Noise Disturbance`, `Garbage Disposal`, `Pet Nuisance`, `Property Dispute`, `Verbal Altercation`, or `Other` |
| `description` | Required, up to 5,000 characters |
| `photo` | Required actual JPEG/PNG image, up to 5 MB and 25 megapixels |

Resident and initial status always come from the server. Extra `resident` or `status` fields cannot assign another owner or bypass the initial Pending status. Photos are decoded, copied into a fresh pixel image, and saved as PNG under a generated filename, stripping source metadata. Re-encoded storage size may differ from upload size. Evidence files are never exposed through public Django media routes.

Creation returns **201** with `{ "message": "Your complaint has been submitted.", "complaint": { ... } }`. List records use frontend-compatible keys: `id`, `fullName`, `type`, `dateFiled`, `status`, `description`, `photoUrl`. IDs are UUIDs; `dateFiled` uses the Asia/Manila calendar date. Detail responses add `contactNumber`, `address`, and `statusHistory`.

### Pagination and filters

```text
GET /api/complaints/?page=1&page_size=20&search=Noise&status=Pending
```

Default page size is 20; maximum 100. Search matches resident names and complaint types, or an exact UUID. Status must be one of the supported values. Response:

```json
{
  "count": 42,
  "next": "http://localhost:4321/api/complaints/?page=2",
  "previous": null,
  "results": []
}
```

The frontend uses its own same-origin URLs and page numbers rather than following absolute pagination links. Admin statistics are global database counts, independent of the current table page or filter. `registeredUsers` counts active accounts, including staff.

### Status updates

```http
PATCH /api/complaints/<uuid>/status/
Content-Type: application/json
X-CSRFToken: <fresh token>

{"status": "Resolved"}
```

Supported values: `Pending`, `Processing`, `Resolved`. Staff may move between any supported statuses, including reopening a resolved complaint. Each actual change is transactional and stores actor, previous/new status, and time. Repeating the same status creates no duplicate history. The admin frontend provides this control in expanded complaint details. Django admin exposes complaints as read-only records so changes continue to pass through the service.

### Errors

```json
{
  "message": "photo: Only JPG and PNG images are accepted.",
  "errors": { "photo": ["Only JPG and PNG images are accepted."] }
}
```

CSRF middleware errors use `{ "message": "…" }`. Unexpected server failures remain server errors, with details only in development/logs. Another resident's record or evidence returns 404 to avoid exposing its existence.

## Tests and maintenance

```sh
python manage.py test tests --settings=config.settings.test
python manage.py check
python manage.py makemigrations --check --dry-run
```

The suite uses isolated temporary media folders and a test database. The test settings speed up hashing for disposable accounts only. Run the normal server with the default settings.

After changing model definitions:

```sh
python manage.py makemigrations barangay
python manage.py migrate
```

## Deployment integration

Serve the Astro build and Django API under one origin. Configure your reverse proxy to forward `/api/` and `/health/` to Django and serve the frontend for the other application routes. Astro's proxy is for development, not a proxy embedded into static build output.

Set `DJANGO_DEBUG=False`, a unique `DJANGO_SECRET_KEY`, exact allowed hosts/trusted origins, and `DJANGO_SECURE_COOKIES=True` behind HTTPS. The `.env.example` uses local HTTP values and must be adjusted for deployment. Run migrations, `collectstatic`, and `check --deploy` as part of your hosting setup; use a suitable WSGI/ASGI server with `config.wsgi:application` or `config.asgi:application`. The included development server is for local use.

CORS is explicitly configured in `cors/settings.py`; same-origin proxying is the supported frontend setup. For genuinely different sites/domains, revisit cookie SameSite, Secure, credential mode, trusted origins, and CSRF handling rather than simply enabling wildcard origins. Both CORS and CSRF restrictions apply independently.

Set a request-body limit at the web server (for example 6–8 MB for one 5 MB photo plus multipart fields). Application image limits are not a replacement for ingress limits. Back up the database and private evidence storage together. Do not serve `storage/private/` as public static files.

Login is limited to 10 attempts/minute per client address; complaint creation to 20/hour per user. The included local-memory throttle cache is suitable for one local process; configure a shared cache and an edge login limit for multiple workers. SQLite is appropriate for local development; configure PostgreSQL and its driver for larger concurrent deployments.

Official references:
- https://docs.djangoproject.com/en/5.2/
- https://www.django-rest-framework.org/api-guide/authentication/
- https://www.django-rest-framework.org/api-guide/testing/
