import axios from 'axios';
import Cookies from 'js-cookie';

// Use relative URL for API calls, Next.js will proxy them
const BASE_URL = '/api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user';

// Axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      return Promise.reject({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
    
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection and try again.'
      });
    }

    if (error.response.status === 401) {
      // Clear auth data
      Cookies.remove(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
      return Promise.reject({
        success: false,
        message: 'Session expired. Please login again.'
      });
    }

    return Promise.reject(error.response.data);
  }
);

// Cookie options
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

// Helper functions for cookies
const getAuthCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

const setAuthCookie = (name: string, value: string) => {
  Cookies.set(name, value, COOKIE_OPTIONS);
};

// User interface matching backend structure
export interface User {
  maTK?: number | string;
  tenDangNhap: string;
  hoTen: string;
  email: string;
  soDienThoai?: string;
  diaChi?: string;
  gioiTinh?: string;
  ngaySinh?: string;
  vaiTro?: string;
  daXacThuc?: boolean;
  ngayTao?: string;
}

// Update data type matching backend structure
export type UserUpdateData = {
  tenDangNhap: string;
  hoTen?: string;
  soDienThoai?: string;
  email?: string;
  diaChi?: string;
  gioiTinh?: string;
  ngaySinh?: string;
};

// API response type
type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * Get current user profile from API
 */
export async function getUserProfile(): Promise<User | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return null;
    }

    console.log('getUserProfile - Calling API...');

    const response = await axiosInstance.get<ApiResponse<User>>('/TaiKhoan/Profile');

    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      
      try {
        setAuthCookie(USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        console.log('getUserProfile - Updated user data:', userData);
      } catch (storageError) {
        console.error('getUserProfile - Error updating user data:', storageError);
      }
      
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userData: UserUpdateData): Promise<ApiResponse> {
  try {
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'Authentication required'
      };
    }

    console.log('Updating user profile:', userData);

    const response = await axiosInstance.put<ApiResponse>('/TaiKhoan/Update', userData);

    if (response.data.success) {
      const currentUserStr = getAuthCookie(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          const updatedUser = {
            ...currentUser,
            ...userData
          };
          
          setAuthCookie(USER_DATA_KEY, JSON.stringify(updatedUser));
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
          console.log('userService: Updated user data in storage:', updatedUser);
        } catch (storageError) {
          console.error('Error updating local storage:', storageError);
        }
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile'
    };
  }
}

/**
 * Change password
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
  try {
    const response = await axiosInstance.put<ApiResponse>('/TaiKhoan/ChangePassword', {
      oldPassword,
      newPassword
    });

    return response.data;
  } catch (error: any) {
    console.error('Error changing password:', error);
    return {
      success: false,
      message: error.message || 'Failed to change password'
    };
  }
}

// API services for user management
export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await axiosInstance.get('/User/GetAll');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  // Get user by ID
  getUserById: async (id: number | string): Promise<User> => {
    try {
      const response = await axiosInstance.get(`/User/GetById?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id: number | string, userData: Partial<User>): Promise<any> => {
    try {
      const response = await axiosInstance.put(`/User/Update?id=${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  },
  
  // Delete user
  deleteUser: async (id: number | string): Promise<any> => {
    try {
      const response = await axiosInstance.delete(`/User/Delete?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  },
  
  // Check if user exists
  checkUserExists: async (username: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.get(`/User/CheckExists?username=${username}`);
      return response.data;
    } catch (error) {
      console.error(`Error checking if user exists: ${username}`, error);
      return false;
    }
  },
  
  // Export individual functions
  getUserProfile,
  updateUserProfile,
  changePassword
};

export default userService; 