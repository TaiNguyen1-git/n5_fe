import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = 'https://ptud-web-1.onrender.com/api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user';

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

    console.log('getUserProfile - Calling API with token:', token.substring(0, 15) + '...');

    const response = await axios.get<ApiResponse<User>>(`${BASE_URL}/TaiKhoan/Profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      
      try {
        // Save to both cookie and localStorage
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

    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found'
      };
    }

    console.log('Updating user profile:', userData);

    const response = await axios.put<ApiResponse>(`${BASE_URL}/TaiKhoan/Update`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      // Update local storage with new data
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
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as ApiResponse;
    }
    return {
      success: false,
      message: 'Failed to update profile'
    };
  }
}

/**
 * Change password
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
  try {
    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found'
      };
    }

    const response = await axios.put<ApiResponse>(`${BASE_URL}/TaiKhoan/ChangePassword`, {
      oldPassword,
      newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as ApiResponse;
    }
    return {
      success: false,
      message: 'Failed to change password'
    };
  }
}

// API services cho người dùng
export const userService = {
  // Lấy tất cả người dùng
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/User/GetAll`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  // Lấy người dùng theo ID
  getUserById: async (id: number | string): Promise<User> => {
    try {
      const response = await axios.get(`${BASE_URL}/User/GetById?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  },

  // Cập nhật người dùng
  updateUser: async (id: number | string, userData: Partial<User>): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/User/Update?id=${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  },
  
  // Xóa người dùng
  deleteUser: async (id: number | string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/User/Delete?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  },
  
  // Kiểm tra xem người dùng đã tồn tại
  checkUserExists: async (username: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${BASE_URL}/User/CheckExists?username=${username}`);
      return response.data;
    } catch (error) {
      console.error(`Error checking if user exists: ${username}`, error);
      return false;
    }
  },
  
  // Export các hàm riêng lẻ
  getUserProfile,
  updateUserProfile,
  changePassword
};

export default userService; 