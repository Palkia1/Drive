# E2E smoke test

Requires a running, seeded server (this test doesn't provision Postgres or
run migrations/seed itself):

```bash
service postgresql start
DATABASE_URL="postgresql://rijklaar:rijklaar@localhost:5432/rijklaar_test" npx prisma migrate deploy
DATABASE_URL="postgresql://rijklaar:rijklaar@localhost:5432/rijklaar_test" npm run db:seed
DATABASE_URL="postgresql://rijklaar:rijklaar@localhost:5432/rijklaar_test" AUTH_SECRET="test" npm run dev &

npx playwright test
```

Set `PLAYWRIGHT_BASE_URL` to point at a different server (e.g. a preview
deployment) instead of `http://localhost:3000`.
