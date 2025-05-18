// plugins/auth.ts

import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(async (nuxtApp) => {
  // IMPORTANT: Ensure consistent initial state between server and client
  // Always start with isAuthenticated = false to prevent hydration mismatches
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false);
  const userRole = useState<string | null>('userRole', () => null);
  
  // Only initialize from localStorage on client-side AFTER hydration is complete
  if (process.client) {
    // Use nuxtApp.hook('app:mounted') to ensure this runs after hydration
    nuxtApp.hook('app:mounted', () => {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      
      if (token && role) {
        // Update after hydration is complete to prevent mismatches
        isAuthenticated.value = true;
        userRole.value = role;
      }
    });
  }
  
  const auth = {
    async login(username: string, password: string): Promise<boolean> {
      try {
        const trimmedUsername = username.trim();
        
        if (!trimmedUsername || !password) {
          return false;
        }
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: trimmedUsername,
            password: password
          })
        });
        if (response.ok) {
          const { token, role } = await response.json();
          
          isAuthenticated.value = true;
          userRole.value = role;
          if (process.client) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_role', role);
          }
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    logout() {
      isAuthenticated.value = false;
      userRole.value = null;
      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_role');
      }
    },
    async getAuthStatus() {
      // Always return false on server to prevent hydration issues
      if (process.server) {
        return {
          isAuthenticated: false,
          userRole: null
        };
      }
      
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      
      if (!token || !role) {
        isAuthenticated.value = false;
        userRole.value = null;
        return {
          isAuthenticated: false,
          userRole: null
        };
      }
      
      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update state only if validation succeeds
          isAuthenticated.value = true;
          userRole.value = role;
          return {
            isAuthenticated: true,
            userRole: role
          };
        }
      } catch (error) {
        console.error('Auth validation error:', error);
      }
      
      // Clear invalid auth data
      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_role');
      }
      isAuthenticated.value = false;
      userRole.value = null;
      
      return {
        isAuthenticated: false,
        userRole: null
      };
    },
    isAdmin() {
      return userRole.value === 'admin';
    }
  };
  
  // Make auth available globally
  return {
    provide: {
      auth
    }
  };
});