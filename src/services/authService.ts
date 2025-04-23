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

// Thay đổi BASE_URL để sử dụng proxy local
const BASE_URL = '/api';

// Tạo instance Axios với cấu hình mạng
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 giây timeout để xử lý mạng chậm
});

// Mock user storage
const USERS_STORAGE_KEY = 'registered_users';

// Export hàm getRegisteredUsers để các component khác có thể sử dụng
export const getRegisteredUsers = (): Record<string, any> => {
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
    
    // Kiểm tra đăng nhập local với dữ liệu trong localStorage
    const users = getRegisteredUsers();
    const user = users[credentials.username];
    
    if (user && user.password === credentials.password) {
      // Tạo token giả
      const token = 'local-token-' + Math.random().toString(36).substring(2);
      
      // Lưu token và thông tin người dùng
      localStorage.setItem('auth_token', token);
      const userData = {
        id: user.id || user.username,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role || 'customer'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Login success with local account:', userData);
      
      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: { 
          user: userData,
          token 
        }
      };
    }
    
    // Không tìm thấy tài khoản phù hợp
    console.log('Login failed: Invalid credentials');
    return {
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
    };
    
    /* API login code is commented out due to connectivity issues
    try {
      console.log('Gửi request đăng nhập tới:', `${BASE_URL}/auth/login`);
      
      // Điều chỉnh format dữ liệu theo yêu cầu API
      const requestData = {
        userName: credentials.username, 
        password: credentials.password
      };
      
      // Hoặc thử format khác
      const alternativeRequestData = {
        Username: credentials.username,  
        Password: credentials.password  
      };
      
      console.log('Dữ liệu gửi đi:', requestData);
      
      // Kết nối API đăng nhập thực tế từ Swagger - thử với các đường dẫn khác nhau
      let response;
      try {
        // Thử với đường dẫn và format thứ nhất
        response = await axiosInstance.post(`/auth/login`, requestData);
      } catch (err1) {
        ... // More API call attempts
      }
      
      console.log('Login API response:', response);
      
      if (response.data && response.data.token) {
        // ... existing API success handling
      } else {
        return {
          success: false,
          message: response.data?.message || 'Đăng nhập thất bại',
        };
      }
    } catch (apiError: any) {
      // ... existing API error handling
    }
    */
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
    // Kiểm tra xem username đã tồn tại chưa
    const users = getRegisteredUsers();
    if (users[userData.username]) {
      return {
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      };
    }

    // Tạo user mới với thông tin từ form đăng ký
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substring(2),
      gender: 'Nam',
      birthDate: '',
      address: '',
      role: 'customer'
    };

    // Lưu user vào localStorage
    saveRegisteredUser(newUser);
    console.log('User registered successfully:', newUser);

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber
        }
      }
    };
    
    /* API registration code is commented out due to connectivity issues
    try {
      // Định dạng dữ liệu theo cấu trúc mà API yêu cầu
      const registrationData = {
        userName: userData.username,
        password: userData.password,
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber || ''
      };
      
      // Định dạng dữ liệu khác
      const alternativeRegistrationData = {
        Username: userData.username,
        Password: userData.password,
        Email: userData.email,
        FullName: userData.fullName,
        PhoneNumber: userData.phoneNumber || ''
      };
      
      console.log('Sending registration data:', registrationData);
      console.log('Gửi request đăng ký tới:', `${BASE_URL}/auth/register`);
      
      // Gọi API đăng ký từ Swagger - thử với các đường dẫn khác nhau và định dạng khác nhau
      let response;
      try {
        // Thử với đường dẫn và format thứ nhất
        response = await axiosInstance.post(`/auth/register`, registrationData);
      } catch (err1) {
        ... // API call attempts
      }
      
      console.log('Register API response:', response);
      
      if (response.data && response.data.success !== false) {
        // Nếu đăng ký thành công, trả về kết quả từ API
        return {
          success: true,
          message: 'Đăng ký tài khoản thành công',
          data: {
            user: {
              id: response.data.userId || response.data.id || Math.random().toString(36).substring(2),
              username: userData.username,
              fullName: userData.fullName,
              email: userData.email,
              phoneNumber: userData.phoneNumber
            }
          }
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Đăng ký thất bại'
        };
      }
    } catch (apiError: any) {
      console.error('API registration error details:', apiError.message);
      if (apiError.response) {
        console.error('Response data:', apiError.response.data);
        console.error('Response status:', apiError.response.status);
      } else if (apiError.request) {
        console.error('Request made but no response received');
      } else {
        console.error('Error setting up request:', apiError.message);
      }
      
      // Fallback to local registration if API fails
      // ... existing fallback code ...
    }
    */
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.',
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