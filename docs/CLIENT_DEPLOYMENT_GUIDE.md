# 🚀 Multi-Client Deployment Guide

This guide explains how to deploy the Staycation template for multiple clients, each with their own isolated database and configuration.

---

## Overview

Each client gets:
- ✅ Their own Firebase project (separate database)
- ✅ Their own Vercel deployment (unique URL or custom domain)
- ✅ Their own email notifications
- ✅ Fully customizable branding via Visual Builder

---

## Step-by-Step: New Client Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Name it: `clientname-staycation` (e.g., `beachresort-staycation`)
4. Disable Google Analytics (optional, saves time)
5. Click **Create**

#### Enable Firestore:
1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose nearest region (e.g., `asia-southeast1`)

#### Get Firebase Config:
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** → Click **Web** icon (`</>`)
3. Register app name: `staycation-web`
4. Copy the config values:
```javascript
apiKey: "xxx",
authDomain: "xxx.firebaseapp.com",
projectId: "xxx",
storageBucket: "xxx.appspot.com",
messagingSenderId: "xxx",
appId: "xxx"
```

---

### Step 2: Set Up Gmail for Emails

1. Use client's Gmail OR create one (e.g., `clientbusiness@gmail.com`)
2. Enable 2-Factor Authentication in Google Account
3. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
4. Create app password → Select "Mail" → Copy the 16-character password

---

### Step 3: Create Vercel Project

#### Option A: Fork Repository (Easiest)
1. Go to your GitHub repo: `github.com/npcabrera13/Staycation-template`
2. Click **Fork** → Name it for the client (e.g., `beachresort-booking`)
3. In [Vercel Dashboard](https://vercel.com), click **Add New → Project**
4. Import the forked repo

#### Option B: Same Repo, Different Branch
1. Create a new branch: `git checkout -b client/beachresort`
2. Push: `git push origin client/beachresort`
3. In Vercel, deploy this specific branch

---

### Step 4: Configure Environment Variables in Vercel

In Vercel → Project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Client's Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `clientproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `clientproject` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `clientproject.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client's Sender ID |
| `VITE_FIREBASE_APP_ID` | Client's App ID |
| `VITE_GEMINI_API_KEY` | Your Gemini API key (or client's) |
| `SMTP_EMAIL` | Client's Gmail address |
| `SMTP_PASSWORD` | Gmail App Password |

> ⚠️ Make sure to add for **Production** environment

---

### Step 5: Deploy & Set Custom Domain

1. Click **Deploy** in Vercel
2. Once deployed, go to **Settings → Domains**
3. Add client's custom domain (e.g., `book.beachresort.com`)
4. Update DNS records as instructed

---

### Step 6: Initial Setup for Client

After deployment, the client should:

1. **Access Admin**: Go to site → scroll to footer → click copyright 5 times
2. **Set Admin Password**: First-time setup will prompt for password
3. **Customize Branding**: Use Visual Builder to change:
   - Site name, logo, colors
   - Hero images and text
   - Contact info, social links
4. **Add Rooms**: Admin → Rooms → Add rooms with images and pricing
5. **Configure Payments**: Admin → Settings → Payment Methods (GCash/Bank)
6. **Set Notifications**: Admin → Settings → Enter admin email

---

## Quick Reference: Files to Know

| File | Purpose |
|------|---------|
| `.env` | Environment variables (local dev) |
| `vercel.json` | Vercel routing configuration |
| `firebaseConfig.ts` | Reads env vars for Firebase |
| `api/send-email.ts` | Nodemailer email serverless function |

---

## Pricing Suggestion for Clients

| Item | Suggested Price |
|------|-----------------|
| Initial Setup | ₱5,000 - ₱15,000 |
| Custom Domain Setup | ₱2,000 - ₱5,000 |
| Monthly Maintenance | ₱1,000 - ₱3,000 |
| Visual Builder Training | Free (included) |

---

## FAQ

**Q: Do I need to copy the code for each client?**  
A: You can either fork the repo for each client (separate codebases) OR use the same repo with different environment variables per Vercel project.

**Q: Can multiple clients share one Firebase project?**  
A: Not recommended. Each client should have separate data for privacy and isolation.

**Q: What if a client wants a feature only for them?**  
A: Fork the repo for that client so you can customize without affecting others.

---

## Checklist for New Client Deployment

- [ ] Create Firebase project
- [ ] Enable Firestore database
- [ ] Get Firebase config values
- [ ] Create Gmail app password for client
- [ ] Fork repo or create Vercel project
- [ ] Add all environment variables to Vercel
- [ ] Deploy and verify site loads
- [ ] Test booking flow
- [ ] Test email notifications
- [ ] Set up custom domain (if any)
- [ ] Client training on Visual Builder

