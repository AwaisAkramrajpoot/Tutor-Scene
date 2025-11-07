# API Utility Usage Guide

## Overview
The `api.js` utility provides helper functions for making authenticated API requests with automatic token management.

## Usage Examples

### 1. Making an authenticated GET request
```javascript
import { apiRequest } from '../utils/api';

const fetchUserProfile = async () => {
  try {
    const data = await apiRequest('/api/v1/users/profile', {
      method: 'GET'
    });
    console.log('User profile:', data);
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

### 2. Making an authenticated POST request
```javascript
import { apiRequest } from '../utils/api';

const updateProfile = async (profileData) => {
  try {
    const data = await apiRequest('/api/v1/users/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    console.log('Profile updated:', data);
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
```

### 3. Getting current user
```javascript
import { getCurrentUser } from '../utils/api';

const user = getCurrentUser();
if (user) {
  console.log('Current user:', user);
}
```

### 4. Checking authentication status
```javascript
import { isAuthenticated } from '../utils/api';

if (isAuthenticated()) {
  // User is logged in
} else {
  // Redirect to login
}
```

### 5. Logging out
```javascript
import { logout } from '../utils/api';

const handleLogout = () => {
  logout(); // Clears storage and redirects to /signin
};
```

## Features
- Automatic token injection in request headers
- Automatic 401 error handling (redirects to login)
- Centralized API URL management
- Helper functions for user management

## Token Management
The utility automatically:
- Adds `Authorization: Bearer <token>` header to all requests
- Handles token expiration (401 errors)
- Clears storage and redirects to login on authentication failure
