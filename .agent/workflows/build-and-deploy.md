---
description: Build production bundle and deploy (Netlify frontend + Render backend)
---

# Build & Deploy

Build the production frontend bundle and verify it before deploying.

## Steps

### Build Verification

1. Run full lint and type-check first:
// turbo
```bash
yarn typecheck
```

2. Build the frontend production bundle:
// turbo
```bash
yarn build
```

3. Verify the build output exists:
// turbo
```bash
dir packages\frontend\dist
```

### Deployment

4. Push to `main` to trigger automatic deploys:
```bash
git push origin main
```

> **Frontend** deploys automatically to **Netlify** on push to `main`.
> **Backend** deploys automatically to **Render** on push to `main`.

### Post-Deploy Verification

5. Check the Render health endpoint:
```bash
curl https://<your-app>.onrender.com/health
```

6. Verify the Netlify deployment URL loads correctly.

## Environment Variables

Ensure these are set in the respective dashboards:

| Service  | Variable           | Where to Set         |
| -------- | ------------------ | -------------------- |
| Netlify  | `VITE_API_URL`     | Site Settings > Env  |
| Render   | `DATABASE_URL`     | Service > Environment |
| Render   | `CLERK_ISSUER_URL` | Service > Environment |
| Render   | `CLERK_JWKS_URL`   | Service > Environment |
