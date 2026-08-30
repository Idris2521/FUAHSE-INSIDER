# FUAHSE_🅸🅽🆂🅸🅳🅴🆁 Campus Mirror

Production-ready anonymous campus submission, editorial moderation, and WhatsApp channel dispatch platform. Created by menmex social media management.

## 🚀 Railway Deployment Guide

### 1. Push to GitHub
1. Export or download your project ZIP from AI Studio.
2. Upload/push the code to your GitHub repository.

### 2. Deploy on Railway
1. Go to [Railway.app](https://railway.app) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and choose this repository.
3. In Railway **Variables** tab, add your environment variables:
   - `SUPABASE_URL` (optional, for persistent cloud database)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)
   - `VITE_WHATSAPP_CHANNEL_URL` (e.g. `https://whatsapp.com/channel/0029Vazzxus65yDCGNFyav1R`)
   - `NODE_ENV` = `production`

Railway will automatically build using `npm run build` and start with `npm run start`.

### 3. Database Setup (Optional)
If using Supabase, copy the contents of `supabase-schema.sql` and run it in the Supabase SQL Editor.
