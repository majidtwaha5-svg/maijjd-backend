# 🚂 Railway Deployment Instructions

## Quick Deploy Steps

### Step 1: Authenticate with Railway

Run this command in your terminal:

```bash
railway login
```

This will:
- Open your browser for authentication
- Complete the login process in the browser
- Return to the terminal when done

### Step 2: Link to Project (if needed)

```bash
cd backend_maijjd
railway link
```

Select your `maijjd-backend` project when prompted.

### Step 3: Deploy

```bash
railway up --environment production
```

## Alternative: Use Railway Token (Non-Interactive)

If you prefer token-based authentication:

1. **Get a Railway Token:**
   - Visit: https://railway.app/account/tokens
   - Click "Create New Token"
   - Copy the token

2. **Set the token and deploy:**
   ```bash
   export RAILWAY_TOKEN=your-token-here
   cd backend_maijjd
   railway up --environment production
   ```

## What's Being Deployed

✅ Enhanced password reset email template with:
- Visible reset button
- Copyable reset link
- Professional HTML design
- Clear instructions

## Verify Deployment

After deployment, check:

```bash
# View logs
railway logs

# Check status
railway status

# View domain
railway domain
```

## Need Help?

- Railway Dashboard: https://railway.app
- Railway Docs: https://docs.railway.app

