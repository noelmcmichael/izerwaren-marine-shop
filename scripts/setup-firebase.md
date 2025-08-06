# Firebase Setup Checklist

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `izerwaren-dev` (or your preference)
4. Enable Google Analytics (optional)
5. Wait for project creation

## 2. Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click "Email/Password"
5. Enable "Email/Password" (first toggle)
6. Save

## 3. Get Client Configuration

1. Go to Project Settings (gear icon → Project settings)
2. Scroll down to "Your apps" section
3. Click "Web app" icon (</>) to add web app
4. Enter app nickname: `izerwaren-admin`
5. Don't check "Firebase Hosting"
6. Click "Register app"
7. Copy the config object values:

```javascript
const firebaseConfig = {
  apiKey: 'AIza...', // Copy this
  authDomain: '...', // Copy this
  projectId: '...', // Copy this
  storageBucket: '...', // Copy this
  messagingSenderId: '...', // Copy this
  appId: '...', // Copy this
};
```

## 4. Generate Service Account

1. Still in Project Settings, click "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key" in the popup
4. Save the downloaded JSON file securely
5. Extract these values from the JSON:
   - `project_id`
   - `client_email`
   - `private_key`

## 5. Configure Local Environment

Update your `.env` file with the values from steps 3 & 4.

Ready to proceed when you have these values!
