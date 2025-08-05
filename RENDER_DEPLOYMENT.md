# Render Deployment Guide for Airbnb Backend

## Environment Variables Setup

The 500 Internal Server Error you're experiencing with Google OAuth is likely due to missing environment variables in your Render deployment. Follow these steps to fix it:

### 1. Access Your Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service (`airbnb-backend-rbln`)

### 2. Configure Environment Variables

1. Navigate to the **Environment** tab
2. Click on **Add Environment Variable**
3. Add the following variables (these should match your local `.env` file):

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
PRODUCTION_URL=https://mini-air-bnb-clone.netlify.app
CLIENT_URL=http://localhost:5173
NODE_ENV=production
```

### 3. Update Google OAuth Configuration

You also need to update your Google OAuth configuration to allow the Render domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add the following to **Authorized JavaScript origins**:
   ```
   https://airbnb-backend-rbln.onrender.com
   ```
5. Add the following to **Authorized redirect URIs**:
   ```
   https://airbnb-backend-rbln.onrender.com/auth/google/callback
   ```

### 4. Redeploy Your Application

After setting up the environment variables:

1. Go to the **Manual Deploy** section in your Render dashboard
2. Click **Deploy latest commit**

### 5. Verify Configuration

After deployment is complete, you can verify your configuration by visiting:

```
https://airbnb-backend-rbln.onrender.com/health
https://airbnb-backend-rbln.onrender.com/auth/status
```

These endpoints will show you if your environment variables are properly configured without exposing sensitive information.

## Troubleshooting

If you're still experiencing issues:

1. Check the Render logs for specific error messages
2. Ensure your Google OAuth credentials are correct and have the proper permissions
3. Verify that your callback URL exactly matches what's configured in Google Cloud Console
4. Try accessing the `/health` endpoint to see if the server is running correctly

## Common Issues

### CORS Errors

If you're experiencing CORS issues, we've already configured the server to accept requests from your Netlify domain. If you're using a different domain, add it to the `allowedOrigins` array in `server.js`.

### Session Issues

If you're having trouble with sessions, make sure the `SESSION_SECRET` environment variable is set in Render. We've configured the server to use secure cookies in production mode.

### Database Connection Issues

Ensure your `DATABASE_URL` environment variable is correctly set in Render. You may need to whitelist Render's IP addresses in your database provider's settings.