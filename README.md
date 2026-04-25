# SLOOK E-Commerce

## Deployment Guide

### Environment Variables
Set these variables in your deployment platform (Vercel/Render/Heroku).

**Backend (Server):**
- `MONGO_URI`: Your MongoDB Connection String.
- `JWT_SECRET`: A long random string for security.
- `PORT`: (Optional, Vercel sets this automatically).
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID (starts with rzp_live_...).
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
- `EMAIL_USER`: Email address for sending notifications (Gmail).
- `EMAIL_PASS`: App Password for the email (NOT your login password).
- `CLIENT_URL`: The URL of your frontend (e.g., https://your-app.vercel.app).

**Frontend (Client):**
- No specific ENV vars are hardcoded, but if you separate deployments, you might need `VITE_API_URL`. Currently, it proxies to relative `/api`.

### Vercel Deployment (Monorepo)
1. Import this repository to Vercel.
2. The `vercel.json` file should automatically configure the build.
3. If asked for Root Directory, keep it as `./`.
4. Add the Environment Variables above in Project Settings.

### Local Development
1. Install dependencies: `npm install` (in root, client, and server).
2. Start Dev Server: `npm run dev` (in root).
   - This starts client on :5173 and server on :5005.
