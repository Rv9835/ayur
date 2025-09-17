# Deploy AyurSutra Backend to Render

This project is ready to deploy on Render using a Web Service.

## 1) Create the service
- Repo: select this GitHub repo
- Root directory: `ayursutra-backend`
- Runtime: Node
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

## 2) Environment Variables (Render → Environment)
Set these keys (Production):
- `NODE_ENV=production`
- `MONGO_URI=your_mongodb_atlas_uri`
- `JWT_SECRET=your_secret`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (include literal `\n` for line breaks)

## 3) Notes
- Ensure MongoDB Atlas Network Access allows Render IPs (0.0.0.0/0 is OK for testing).
- After deploy, verify health: `https://<your-render-domain>/health`.
- API base: `https://<your-render-domain>/api`.
