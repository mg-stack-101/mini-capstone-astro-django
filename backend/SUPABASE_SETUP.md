# Connect Astro/React → Django → Supabase

The frontend calls Django's `/api/` endpoints. Django stores authentication, sessions, complaints, and history in Supabase PostgreSQL. Login stays with Django; a Supabase JavaScript SDK or a browser database key is not required for this setup.

## 1. Set the backend database URL

In Supabase, open **Connect** and copy the **Direct connection** string or **Session pooler** string. Session mode is useful for an IPv4-only network. Copy the exact host, username, and port shown by your project. Replace the password placeholder with your Supabase database password; percent-encode reserved URL characters in that password.

Copy `backend/.env.example` to `backend/.env`, then fill in the URL:

```dotenv
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=replace-with-a-random-development-secret
DATABASE_URL=postgresql://postgres.PROJECT_REF:URL_ENCODED_DATABASE_PASSWORD@YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
DJANGO_CSRF_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
DJANGO_SECURE_COOKIES=False
```

That URL is an example shape. Use the URL from your own project's Connect panel; direct connections use a different host and username. Keep `.env` in the backend, outside browser/public environment variables. `.env` is excluded from the package and git.

Generate a development secret if needed:

```sh
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The updated `config/database.py` reads `DATABASE_URL`, uses PostgreSQL with SSL by default, and keeps SQLite when the value is blank. You must fill in `DATABASE_URL` to use Supabase. No hosted connection has been made on your behalf.

## 2. Initialize the database and seed development data

From `backend/`, activate your Python virtual environment and run:

```sh
python -m pip install -r requirements.lock.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

If you already ran the corrected full SQL script, do not run its CREATE statements again. `migrate` recognizes its matching migration records and initializes Django content types/permissions. No `--fake` is needed.

For a fresh Supabase database where you want the supplied RLS/index configuration, run `backend/supabase/schema.sql` once in Supabase SQL Editor **before** the commands above. If you initialized the database with Django migrations instead, do not paste the complete CREATE script over those existing tables; use an additive migration for policies/indexes instead.

To confirm the connected database:

```sh
python manage.py shell -c "from django.db import connection; print(connection.vendor, connection.settings_dict['HOST'], connection.settings_dict['NAME']); c=connection.cursor(); c.execute('SELECT 1'); print(c.fetchone())"
```

The vendor should be `postgresql`; the host should match your Supabase URL. `http://127.0.0.1:8000/health/ready/` should return `{"status":"ready"}`. This command does not print your password.

## 3. Start the frontend

In another terminal, from the project root:

```sh
npm ci
npm run dev
```

Open **http://localhost:4321/login/**. The existing Astro proxy sends `/api/` requests to Django on port 8000. Django handles cookies and CSRF, and redirects users to the appropriate dashboard. Use the same browser hostname consistently while signing in.

For a deployed static Astro build, configure your hosting reverse proxy to route `/api/` to Django under the same origin. Vite's local development proxy is not embedded in static build output.

## Development credentials

These accounts are created only after you run `seed_demo` against the selected database:

| Username | Password | Access |
| --- | --- | --- |
| `admin` | `admin` | Active Django superuser and staff; administrator dashboard and full Django admin permissions |
| `staff1` | `StaffDemo123!` | Staff; all complaints and status updates, without Django superuser permissions |
| `resident1` | `ResidentDemo123!` | Only Resident One's three complaints |
| `resident2` | `ResidentDemo456!` | Only Resident Two's three complaints |

`admin` / `admin` is deliberately limited to development. The seed command requires `DJANGO_DEBUG=True`, and all passwords are hashed through Django. The command never runs automatically when a server starts. Do not retain these credentials in a public deployment; change or remove the demo accounts before doing so.

Changing DEBUG to False blocks future seeding; it does not remove accounts already created. Set a new administrator password with `python manage.py changepassword admin` before deploying.

The command refuses to overwrite unrelated existing accounts with these usernames. Re-running preserves existing demo passwords, complaint statuses, and photos. To explicitly restore the documented passwords for matching demo accounts:

```sh
python manage.py seed_demo --reset-passwords
```

This never changes your Supabase dashboard login, PostgreSQL database password, or Supabase Auth users. These are Django application accounts.

## Included complaint data

All names, contact numbers, addresses, descriptions, and evidence images are fictional and labeled as demonstrations.

| Owner | Complaint type | Initial seeded status |
| --- | --- | --- |
| `resident1` | Noise Disturbance | Pending |
| `resident1` | Garbage Disposal | Processing |
| `resident1` | Pet Nuisance | Resolved |
| `resident2` | Property Dispute | Pending |
| `resident2` | Verbal Altercation | Processing |
| `resident2` | Other | Resolved |

This gives six complaints, four status-change history entries, four accounts, and six generated demo evidence PNGs. All four accounts are active; `registeredUsers` should be 4 in an otherwise empty database. Global complaint statistics should be 6 total, 2 pending, and 2 resolved (plus 2 processing).

Evidence files stay in Django's private local storage. This configuration moves database records to Supabase; it does not provision a Supabase Storage bucket.

## RLS and the existing schema

The supplied SQL policies protect access through Supabase's authenticated API role. This Django architecture connects directly using a server-side owner connection, which bypasses RLS and relies on Django's tested session/ownership/staff checks. Merely setting DATABASE_URL does not turn Django sessions into Supabase JWT identities.

You do not need account links for frontend → Django → database access. The private `auth_links` table is only relevant if you separately add Supabase Auth and direct Supabase API access. Such an integration needs separately verified Supabase accounts and explicit links; the demo seed does not provision them.

## References

- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/database/postgres/row-level-security
