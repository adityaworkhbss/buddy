# Render Socket Server Configuration Fix

## Issues Fixed:

1. ✅ **Port Configuration**: Socket server now uses Render's `PORT` environment variable
2. ✅ **CORS Configuration**: Updated to allow Vercel app URL
3. ✅ **Socket Connection**: Fixed to work with Render's infrastructure

## Required Configuration:

### In Render Dashboard:

1. **Environment Variables** (Settings → Environment):
   ```env
   DATABASE_URL=your_postgres_database_url
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   SKIP_NEXT_BUILD=true
   ```
   **Important**: `FRONTEND_URL` should be your Vercel app URL (e.g., `https://your-app.vercel.app`)

2. **Build & Deploy Settings**:
   - **Build Command**: `npm install && SKIP_NEXT_BUILD=true npm run build`
   - **Start Command**: `node server/socket-server.js`
   - **Environment**: Node

3. **After deployment, get your Render service URL**:
   - It will be something like: `https://buddy-socket-server.onrender.com`
   - Or check your Render dashboard for the service URL

### In Vercel Dashboard:

1. **Environment Variables** (Settings → Environment Variables):
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
   SOCKET_URL=https://your-socket-server.onrender.com
   ```
   **Important**: Replace `your-socket-server.onrender.com` with your actual Render service URL

2. **Redeploy** your Vercel app after adding these variables

## Testing:

1. **Check Socket Server**:
   - Go to your Render service logs
   - You should see: `Socket.IO server running on port [PORT]`
   - You should see: `CORS enabled for: https://your-app.vercel.app`

2. **Check Client Connection**:
   - Open your Vercel app in browser
   - Open browser console (F12)
   - You should see: `✅ Socket connected: [socket-id]`
   - If you see connection errors, check that `NEXT_PUBLIC_SOCKET_URL` is set correctly

3. **Test Real-time Messages**:
   - Open messaging in two different browser windows/tabs
   - Send a message from one
   - It should appear instantly in the other (without refresh)

## Troubleshooting:

### Port Scan Timeout:
- ✅ Fixed: Server now uses `process.env.PORT` (provided by Render)
- Server listens on `0.0.0.0` to accept connections from Render's load balancer

### Messages Not Appearing in Real-time:
1. Check browser console for socket connection errors
2. Verify `NEXT_PUBLIC_SOCKET_URL` in Vercel matches your Render service URL
3. Check Render logs to see if socket server is receiving connections
4. Verify CORS allows your Vercel domain

### Socket Connection Errors:
- Check that `FRONTEND_URL` in Render includes your Vercel app URL
- Check that `NEXT_PUBLIC_SOCKET_URL` in Vercel matches your Render service URL
- Make sure both services are deployed and running

## What Changed:

1. **server/socket-server.js**:
   - Now uses `process.env.PORT` (Render's port) instead of `SOCKET_PORT`
   - Listens on `0.0.0.0` to accept external connections
   - Improved CORS to allow multiple origins
   - Better error handling

2. **render.yaml**:
   - Removed `SOCKET_PORT` (Render provides `PORT` automatically)
   - Updated build command to skip Next.js

3. **package.json**:
   - Added conditional build script to skip Next.js when `SKIP_NEXT_BUILD=true`
