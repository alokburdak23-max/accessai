# AccessAI – Render Deployment Guide

This guide describes how to deploy AccessAI (including the Playwright + axe-core scanning engine, standalone accessibility widget, and Gemini AI remediation engine) on [Render](https://render.com).

---

## 1. Deployment Architecture

AccessAI is containerized using Docker, allowing it to package Node.js 22 alongside a headless Chromium binary and all Linux system graphics/font dependencies required for `playwright-core` and `axe-core`.

* **Service Type:** Web Service (Docker Environment)
* **Port:** Render dynamically assigns `PORT` (defaults to `3000`, listened on `0.0.0.0`)
* **Health Check Path:** `/health` (or `/api/health`)

---

## 2. Required Environment Variables

Configure these in the Render Dashboard (**Environment** tab):

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | Yes | `production` |
| `PORT` | HTTP port provided by Render | Auto | `3000` (Render sets automatically) |
| `CHROMIUM_PATH` | Path to installed Chromium in Docker | Set in Dockerfile | `/usr/bin/chromium` |
| `DATA_DIR` | Directory for persistent database | Optional (defaults to `data`) | `/var/data` (when using Persistent Disk) |
| `GEMINI_API_KEY` | Google Gemini API key for AI fixes | Optional (falls back to heuristic fixes) | `AIzaSy...` |

> [!NOTE]
> If `GEMINI_API_KEY` is not provided, AccessAI will gracefully fall back to the built-in deterministic heuristic remediation engine with no errors or service interruptions.

---

## 3. Persistent Disk Configuration (Render Disk)

To persist scan history, monitored websites, registered widget domains, and verified fix statuses across deployments and restarts:

1. In your Render Web Service dashboard, navigate to **Disks**.
2. Click **Add Disk**:
   * **Name:** `accessai-data`
   * **Mount Path:** `/var/data`
   * **Size:** 1 GB (sufficient for thousands of scan records)
3. In the **Environment** tab, set:
   ```env
   DATA_DIR=/var/data
   ```

AccessAI will automatically initialize and store `accessai-db.json` inside the mounted disk.

---

## 4. Step-by-Step Render Deployment Instructions

### Step 1: Push Code to GitHub
Push this repository to your GitHub account (see GitHub setup instructions).

### Step 2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your AccessAI repository.
4. Render will detect the `Dockerfile`.
   * **Runtime:** Docker
   * **Instance Type:** Starter (recommended: minimum 1 GB RAM / 1 CPU for Playwright headless browsing)
5. Under **Advanced Settings**:
   * **Health Check Path:** `/health`
   * **Auto-Deploy:** Yes

### Step 3: Add Environment Variables & Persistent Disk
1. Add `GEMINI_API_KEY` under **Environment Variables** if using AI remediation.
2. Add a Persistent Disk mounted at `/var/data` and set `DATA_DIR=/var/data` (optional, for persistent storage).

### Step 4: Deploy
Click **Create Web Service**. Render will build the Docker container and start the server.

---

## 5. Verification & Testing

Once deployed, verify:
* **Root Application:** `https://<your-service>.onrender.com`
* **Health Check:** `https://<your-service>.onrender.com/health`
* **Standalone Widget:** `https://<your-service>.onrender.com/accessibility-widget.js`
* **Live Audit Scan:** Navigate to **My Websites** and scan an external URL (e.g. `https://example.com`).

---

## 6. Embed the Standalone Widget on Any Website

Any external website can install the AccessAI accessibility layer by adding:

```html
<script src="https://<your-service>.onrender.com/accessibility-widget.js" data-site-id="your-site-id" defer></script>
```
