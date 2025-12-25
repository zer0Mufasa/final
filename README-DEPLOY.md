# Vercel Deployment Configuration

## IMPORTANT: Configure Root Directory in Vercel Dashboard

Vercel cannot detect the Next.js app automatically when it's in a subdirectory. You **MUST** configure this in the Vercel dashboard:

### Steps:

1. Go to https://vercel.com/dashboard
2. Select your project (`final` or your project name)
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Set it to: `fixology-next`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment (or push a new commit)

### Why This Is Required

- `rootDirectory` is NOT a valid property in `vercel.json`
- Vercel auto-detects Next.js, but only when it's in the root or configured root directory
- The dashboard setting overrides the default root directory detection

### After Configuration

Once configured, Vercel will:
- ✅ Detect Next.js automatically
- ✅ Build from `fixology-next/` directory  
- ✅ Use `fixology-next/vercel.json` for configuration
- ✅ Deploy your app correctly

### Testing Locally

To test before deploying:

```bash
cd fixology-next
npm install
npm run build
npm start
```

Then visit http://localhost:3000 to verify everything works.
