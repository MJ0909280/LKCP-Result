# 🚀 Render Deployment Guide & Instructions for Codex

This application is custom-built with a **Full-Stack Architecture** (React 19 Frontend + Vite 6 + Express Node.JS Backend + Google Cloud Firestore Database). It is fully self-contained and pre-configured to build and deploy to **Render.com** (or Railway/Vercel) as a single, combined Web Service.

Follow these steps to download, upload to GitHub, and deploy it for free on Render.

---

## 📥 Step 1: Download this App as a ZIP
1. Click the **Settings Icon (⚙️)** in the top right corner of the AI Studio workspace interface.
2. Select **"Export to ZIP"** or **"Export to GitHub"** to get the entire project codebase.
3. If downloaded as a ZIP, extract it on your computer and push it to a new private or public repository on your personal **GitHub** account.

---

## 🌍 Step 2: Deploying to Render (Free Web Service)
Render is the easiest way to host full-stack applications with an Express server and React frontend for free!

1. Go to [Render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing this project.
4. Configure the following settings on the Render setup screen:
   - **Name**: `lions-karate-club` (or any name you prefer)
   - **Environment / Runtime**: `Node`
   - **Root Directory**: *Leave blank* (defaults to root)
   - **Build Command**: `npm run build` *(Compiles both Vite assets and the Backend entry point)*
   - **Start Command**: `npm run start` *(Launches the fast compiled production bundle)*
   - **Instance Type**: `Free`

5. Scroll down to **Environment Variables** and add the following keys:
   - `NODE_ENV`: `production`
   - `APP_URL`: *Your Render app URL (e.g., `https://your-app-name.onrender.com` - you can add/update this after Render allocates your domain!)*

*(Note: The Firebase connection details are already baked into the server backend as secure defaults, so your live database and existing karate exam data will load automatically.)*

---

## 🤖 Instructions for Codex (Copy-Paste this to Codex)

If you are working with **Codex** to manage, configure, or migrate this app, copy and paste the message below to Codex. This tells them exactly what has been built and how to support you:

```text
Hi Codex! I have a fully functional React + Express full-stack application that is ready to be hosted on Render.com as a lightweight Node Web Service.

Here are the key technical details of the codebase so you understand how to guide or configure it:
1. Architecture: It is a monorepo monolith.
   - Frontend is built using React 19 and Vite.
   - Backend is built with Express (server.ts) and handles Firestore database queries securely server-side.
2. Database: It has a live Google Firestore integration. The configuration keys are baked into the server backend as environment-fallback variables, pointing to our high-availability database 'ai-studio-74adde1c-5f78-4165-bc31-730788215dd5'.
3. Scripts (in package.json):
   - "npm run build": Runs "vite build" to compile frontend static assets to the "/dist" directory, and then compiles "server.ts" to "/dist/server.cjs" using esbuild.
   - "npm run start": Runs the bundled project directly using Node: "node dist/server.cjs".
   - "npm run dev": Runs "tsx server.ts" for development.
4. Hosting: On Render, we want to deploy this as a single "Web Service" using Node.JS. The Build Command is "npm run build" and the Start Command is "npm run start".

Please help me verify that this is ready to go, and let me know if there are any additional configurations you'd like to adjust for local development or external hosting!
```

---

## 🛠️ Verification & Troubleshooting
- **No data or blank screens?** Ensure that `NODE_ENV` is set to `production` in your Render Environment Variables so that Express serves the built React assets correctly rather than executing hot-module replacement code.
- **Port config**: The Express app binds to port `3000` on host `0.0.0.0`, which Render automatically intercepts and routes to public port `80 / 443`. No custom port mappings are required!
