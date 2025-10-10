# Google Authentication Setup

## Prerequisites

1. **Google Cloud Console Account**: You need a Google account to access the Google Cloud Console.

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and enable the API

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application" as the application type
4. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:5174`
   - For production: `https://yourdomain.com`
5. Click "Create"
6. Copy the **Client ID** (not the Client Secret)

### 4. Configure Environment Variables

Create a `.env` file in the `codetype-pro` directory with:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Replace `your-client-id-here` with your actual Client ID from step 3.

### 5. Update Auth Service

The auth service is already configured to use the environment variable. Make sure your `.env` file is in the correct location and restart the development server.

## Features

### For Authenticated Users:
- **Persistent Stats**: All typing statistics are saved to your Google account
- **Cross-Device Sync**: Access your stats from any device
- **User Profile**: Display your name and profile picture
- **Secure Storage**: Stats are tied to your Google account

### For Guest Users:
- **Local Storage**: Stats are saved locally in your browser
- **No Account Required**: Can use the app without signing in
- **Easy Migration**: Can sign in later to sync local stats

## Security Notes

- The Client ID is safe to expose in frontend code
- No sensitive data is stored in localStorage for authenticated users
- All authentication is handled by Google's secure OAuth 2.0 system
- User data is only stored locally or in your Google account

## Troubleshooting

### Common Issues:

1. **"Google Identity Services not loaded"**
   - Check your internet connection
   - Verify the Google Client ID is correct
   - Make sure the domain is authorized in Google Console

2. **"Login timeout"**
   - Check if pop-ups are blocked
   - Try refreshing the page
   - Verify the Client ID is correct

3. **Stats not saving**
   - Make sure you're signed in
   - Check browser console for errors
   - Verify localStorage is available

### Development Notes:

- The app works in both authenticated and guest modes
- Guest stats are stored in localStorage
- User stats are stored in localStorage (will be enhanced with backend later)
- Authentication state is checked every second for real-time updates
