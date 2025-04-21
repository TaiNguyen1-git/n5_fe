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

type UpdateProfileData = {
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  address?: string;
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
      phoneNumber?: string;
      gender?: string;
      birthDate?: string;
      address?: string;
    },
    token?: string;
  };
};

import axios from 'axios';

const BASE_URL = 'https://ptud-web-1.onrender.com/api';

// Mock user storage
const USERS_STORAGE_KEY = 'registered_users';

const getRegisteredUsers = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};
  const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
  return usersStr ? JSON.parse(usersStr) : {};
};

const saveRegisteredUser = (userData: any) => {
  if (typeof window === 'undefined') return;
  const users = getRegisteredUsers();
  users[userData.username] = userData;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Update User interface to include role
interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  token?: string;
  role?: string;  // 'customer', 'staff', 'admin', etc.
}

/**
 * Handles user login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Kiểm tra tài khoản admin và staff đặc biệt
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const adminUser = {
        id: 'admin',
        username: 'admin',
        fullName: 'Admin',
        email: 'admin@hotel.com',
        role: 'admin',
      };
      
      const token = 'mock-admin-token-' + Math.random().toString(36).substring(2);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(adminUser));
      
      return {
        success: true,
        message: 'Đăng nhập thành công (admin)',
        data: { 
          user: adminUser,
          token
        }
      };
    }
    
    if (credentials.username === 'staff' && credentials.password === 'staff123') {
      const staffUser = {
        id: 'staff',
        username: 'staff',
        fullName: 'Nhân Viên Test',
        email: 'staff@hotel.com',
        role: 'staff',
      };
      
      const token = 'mock-staff-token-' + Math.random().toString(36).substring(2);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(staffUser));
      
      return {
        success: true,
        message: 'Đăng nhập thành công (staff)',
        data: { 
          user: staffUser,
          token
        }
      };
    }
    
    // Thử gọi API thật
    try {
      const response = await axios.post(`${BASE_URL}/Login`, credentials);
      return response.data;
    } catch (apiError) {
      // Nếu API thất bại, kiểm tra local mock
      const users = getRegisteredUsers();
      const user = users[credentials.username];
      if (user && user.password === credentials.password) {
        return {
          success: true,
          message: 'Đăng nhập thành công (mock)',
          data: { user: { ...user, id: user.id || user.username } }
        };
      }
      
      // Nếu không tìm thấy user, trả về lỗi
      return {
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      };
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Đăng nhập thất bại',
    };
  }
};

/**
 * Handles user registration
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    // Get existing users
    const users = getRegisteredUsers();

    // Check if username already exists
    if (users[userData.username]) {
      return {
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      };
    }

    // Create new user with default values
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substring(2),
      gender: 'Nam',
      birthDate: '',
      address: ''
    };

    // Save user data
    saveRegisteredUser(newUser);

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: newUser
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    };
  }
};

/**
 * Updates user profile
 */
export const updateUserProfile = async (profileData: UpdateProfileData): Promise<AuthResponse> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        message: 'Không được xác thực',
      };
    }

    // Get current user and registered users
    const currentUser = getCurrentUser();
    const users = getRegisteredUsers();

    if (!currentUser || !users[currentUser.username]) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      };
    }

    // Update user data
    const updatedUser = {
      ...users[currentUser.username],
      ...profileData
    };

    // Save updated user data
    saveRegisteredUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return {
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        user: updatedUser
      }
    };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
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
 * Gets current user data
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
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
 * Redirects to login page if user is not authenticated
 * @param redirectPath Optional path to redirect to after login
 */
export const redirectToLoginIfNotAuthenticated = (redirectPath?: string): boolean => {
  if (!isAuthenticated() && typeof window !== 'undefined') {
    const redirectUrl = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
    window.location.href = redirectUrl;
    return true;
  }
  return false;
};

/**
 * Checks if current route is a checkout or payment page
 */
export const isCheckoutPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.includes('/payment') || path.includes('/checkout');
};

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    // Get current user from localStorage
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Get all registered users
    const users = getRegisteredUsers();
    const storedUser = users[user.username];

    // Verify current password
    if (!storedUser || storedUser.password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }

    // Update password in storage
    users[user.username] = {
      ...storedUser,
      password: newPassword
    };

    // Save updated users back to storage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    return {
      success: true,
      message: 'Đổi mật khẩu thành công'
    };
  } catch (error: any) {
    throw new Error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
  }
}

/**
 * Deletes the current user account
 */
export const deleteUser = async (): Promise<AuthResponse> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        message: 'Không được xác thực',
      };
    }

    // Get current user and registered users
    const currentUser = getCurrentUser();
    const users = getRegisteredUsers();

    if (!currentUser || !users[currentUser.username]) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      };
    }

    // Delete user from registered users
    delete users[currentUser.username];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Clear user session
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');

    return {
      success: true,
      message: 'Tài khoản đã được xóa thành công',
    };
  } catch (error) {
    console.error('Account deletion error:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    };
  }
};

// Thêm hàm để đăng nhập với vai trò mock cho mục đích test
export const loginAsStaff = () => {
  const mockStaffUser = {
    id: 999,
    username: 'staff_user',
    fullName: 'Nhân Viên Test',
    email: 'staff@hotel.com',
    role: 'staff',
    token: 'mock_staff_token_123'
  };
  
  // Lưu token và thông tin người dùng
  localStorage.setItem('auth_token', mockStaffUser.token);
  localStorage.setItem('user', JSON.stringify(mockStaffUser));
  
  // Thêm vào danh sách người dùng đăng ký nếu chưa có
  const users = getRegisteredUsers();
  if (!users[mockStaffUser.username]) {
    users[mockStaffUser.username] = {
      ...mockStaffUser,
      password: 'staff123' // Mật khẩu mặc định cho tài khoản staff
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
  
  return mockStaffUser;
}; 

// MOCK ADMIN LOGIN SUPPORT
// Nếu không có user admin trong localStorage, tự động tạo tài khoản admin mặc định
const ensureAdminAccount = () => {
  if (typeof window === 'undefined') return;
  const users = getRegisteredUsers();
  if (!users['admin']) {
    users['admin'] = {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      fullName: 'Admin',
      role: 'admin',
      email: 'admin@hotel.com',
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};

// Thêm hàm loginAsAdmin tương tự như loginAsStaff
export const loginAsAdmin = () => {
  // Tạo mock user admin
  const mockAdminUser = {
    id: 'admin',
    username: 'admin',
    fullName: 'Admin',
    email: 'admin@hotel.com',
    role: 'admin',
    token: 'mock-admin-token-' + Math.random().toString(36).substring(2)
  };
  
  // Lưu token và thông tin người dùng
  localStorage.setItem('auth_token', mockAdminUser.token);
  localStorage.setItem('user', JSON.stringify(mockAdminUser));
  
  // Đảm bảo tài khoản admin có trong danh sách người dùng
  ensureAdminAccount();
  
  return mockAdminUser;
};

// Gọi ensureAdminAccount khi load file này (chỉ chạy phía client)
if (typeof window !== 'undefined') {
  ensureAdminAccount();
}