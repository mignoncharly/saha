# SAHA Transport & Logistics (STL) – MVP Webapp

## Quick start
1. Copy `.env.example` to `.env` and adjust secrets.
2. Run `make build` then `make up`.
3. Apply migrations: `make migrate`.
4. Create admin: `make createsuperuser`.
5. Load example data: `make seed`.
6. Visit frontend at http://localhost:3000 and backend admin at http://localhost:8000/admin/.

See `docs/` for architecture, deployment, and security details.