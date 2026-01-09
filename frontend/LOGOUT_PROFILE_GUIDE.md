# Logout and Profile Functionality Guide

## ✅ Implemented Features

### 1. **Logout Functionality**
- **Location**: Available in the Header component (top right profile dropdown)
- **Functionality**:
  - Clears all session data (localStorage, sessionStorage)
  - Disconnects Socket.io connection
  - Calls backend logout API (if available)
  - Shows success toast notification
  - Redirects to `/login` page

### 2. **Profile Functionality**
- **Location**: Available in the Header component (top right profile dropdown)
- **Route**: `/profile` (accessible to all authenticated users)
- **Features**:
  - View profile information
  - Edit profile (name, email, phone, address)
  - View account details (role, member since, email verification)
  - Security options (change password, 2FA)

### 3. **Settings Navigation**
- **Location**: Available in the Header component (top right profile dropdown)
- **Functionality**:
  - Navigates to role-specific settings page
  - Super Admin → `/super-admin/settings`
  - School Admin → `/school-admin/settings`
  - Others → Shows "coming soon" message

## How to Use

### Logout
1. Click on your profile avatar/name in the top right corner
2. Click "Log out" from the dropdown menu
3. You will be logged out and redirected to the login page

### Profile
1. Click on your profile avatar/name in the top right corner
2. Click "Profile" from the dropdown menu
3. You will be taken to your profile page where you can:
   - View your account information
   - Edit your profile details
   - Manage security settings

### Settings
1. Click on your profile avatar/name in the top right corner
2. Click "Settings" from the dropdown menu
3. You will be taken to your role-specific settings page

## Technical Details

### Logout Function (`frontend/src/lib/auth.ts`)
```typescript
export async function logout(): Promise<void>
```
- Clears all authentication tokens
- Disconnects real-time connections
- Clears all stored data
- Redirects to login

### Profile Page (`frontend/src/pages/Profile.tsx`)
- Protected route (requires authentication)
- Accessible to all user roles
- Editable profile information
- Account security options

## Files Modified/Created

1. **`frontend/src/lib/auth.ts`** - New logout utility
2. **`frontend/src/components/layout/Header.tsx`** - Added logout and profile handlers
3. **`frontend/src/pages/Profile.tsx`** - New profile page
4. **`frontend/src/App.tsx`** - Added profile route

## Testing

1. **Test Logout**:
   - Login with any role
   - Click profile dropdown → Log out
   - Should redirect to login page
   - Should clear all session data

2. **Test Profile**:
   - Login with any role
   - Click profile dropdown → Profile
   - Should navigate to `/profile`
   - Should display user information
   - Should allow editing profile

3. **Test Settings**:
   - Login with Super Admin or School Admin
   - Click profile dropdown → Settings
   - Should navigate to role-specific settings page

## Notes

- Logout works on all dashboards (Super Admin, School Admin, Teacher, Parent)
- Profile page is accessible to all authenticated users
- Settings navigation is role-aware
- All functionality is properly protected with authentication checks
