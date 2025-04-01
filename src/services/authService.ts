// Authentication service
type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
};

// Response types
type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    user?: {
      id: string;
      username: string;
      fullName: string;
      email?: string;
    },
    token?: string;
  };
};

/**
 * Handles user login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    // Store token in localStorage if login is successful
    if (data.success && data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error occurred. Please try again.',
    };
  }
};

/**
 * Handles user registration
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth?action=register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Network error occurred. Please try again.',
    };
  }
};

/**
 * Checks if user is logged in
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('auth_token') !== null;
};

/**
 * Logs out the current user
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  // Redirect to login page or home page after logout
  window.location.href = '/';
};

/**
 * Gets the current authenticated user
 */
export const getCurrentUser = (): any => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}; 