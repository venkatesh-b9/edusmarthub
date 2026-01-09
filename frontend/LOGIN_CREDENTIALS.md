# Login Credentials

## Demo Login Credentials

Use these credentials to login to the EduSmartHub system:

### Super Admin
- **Email:** `superadmin@edusmarthub.com`
- **Password:** `SuperAdmin@2024`
- **Dashboard:** `/super-admin`

### School Admin
- **Email:** `schooladmin@edusmarthub.com`
- **Password:** `SchoolAdmin@2024`
- **Dashboard:** `/school-admin`

### Teacher
- **Email:** `teacher@edusmarthub.com`
- **Password:** `Teacher@2024`
- **Dashboard:** `/teacher`

### Parent
- **Email:** `parent@edusmarthub.com`
- **Password:** `Parent@2024`
- **Dashboard:** `/parent`

## How It Works

1. Navigate to the application root (`/`)
2. You will be automatically redirected to `/login`
3. Enter one of the credentials above
4. The system will detect your role based on the email
5. After successful login, you'll be redirected to your role-specific dashboard

## Features

- **Role Detection:** The system automatically detects your role from your email address
- **Protected Routes:** Each dashboard is protected and only accessible to users with the correct role
- **Auto-redirect:** If you're already logged in, you'll be redirected to your dashboard
- **Session Management:** Login state is stored in localStorage

## Security Note

These are demo credentials for development/testing purposes. In production, these should be replaced with actual authentication via the backend API.
