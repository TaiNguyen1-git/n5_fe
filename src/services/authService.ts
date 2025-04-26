// Authentication service
import axios from 'axios';

const BASE_URL = 'https://ptud-web-1.onrender.com/api';

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
  id: number | string;
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
    
    // Gọi API đăng nhập thực tế
    console.log('Login - Attempting login with:', credentials.username);
    
    const requestData = {
      tenDangNhap: credentials.username, 
      matKhau: credentials.password
    };
    
    // Gọi trực tiếp đến API đăng nhập
    try {
      const response = await axios.post(`${BASE_URL}/Login`, requestData, {
        timeout: 30000, // Tăng timeout lên 30 giây
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Login - API response:', response.data);
      
      if (response.data && response.data.token) {
        // Lưu token và thông tin người dùng
        localStorage.setItem('auth_token', response.data.token);
        
        const userData = {
          id: response.data.maTK || response.data.id,
          username: response.data.username || response.data.tenDangNhap,
          fullName: response.data.fullName || response.data.hoTen,
          email: response.data.email,
          role: response.data.role || 'customer'
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        return {
          success: true,
          message: 'Đăng nhập thành công',
          data: { 
            user: userData,
            token: response.data.token
          }
        };
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (apiError: any) {
      console.error('Login - API error:', apiError.response?.data || apiError.message);
      
      // Xử lý lỗi mạng
      if (apiError.message && apiError.message.includes('Network Error')) {
        console.log('Login - Network error detected, trying local login');
        // Thử đăng nhập local
        return attemptLocalLogin(credentials);
      }
      
      // Xử lý lỗi xác thực
      if (apiError.response?.status === 401) {
        // Thử đăng nhập local
        const localLoginResult = attemptLocalLogin(credentials);
        if (localLoginResult.success) {
          return localLoginResult;
        }
        
        return {
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        };
      }
      
      // Lỗi khác
      return {
        success: false,
        message: apiError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.'
      };
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Đăng nhập thất bại. Vui lòng thử lại sau.',
    };
  }
};

// Hàm hỗ trợ để thử đăng nhập với dữ liệu local
function attemptLocalLogin(credentials: LoginCredentials): AuthResponse {
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
}

/**
 * Handles user registration
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    // Gọi API đăng ký thực tế với format chính xác
    const requestData = {
      tenDangNhap: userData.username,
      matKhau: userData.password,
      email: userData.email,
      hoTen: userData.fullName,
      soDienThoai: userData.phoneNumber || '',
      vaiTro: 'customer'
    };
    
    // Gọi trực tiếp đến API backend để đăng ký
    console.log('Sending registration data:', requestData);
    
    // Tăng timeout để tránh lỗi mạng
    const response = await axios.post(`${BASE_URL}/Auth/Register`, requestData, {
      timeout: 30000, // Tăng timeout lên 30 giây
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Registration response:', response.data);
    
    if (response.data) {
      return {
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: response.data
      };
    } else {
      throw new Error('Không nhận được phản hồi từ server');
    }
  } catch (error: any) {
    console.error('Registration API error:', error.response?.data || error.message);
    
    // Xử lý cụ thể lỗi mạng
    if (error.message && error.message.includes('Network Error')) {
      return {
        success: false,
        message: 'Lỗi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn hoặc thử lại sau.'
      };
    }
    
    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response.data.message || 'Thông tin đăng ký không hợp lệ'
      };
    }
    
    return {
      success: false,
      message: error.message || 'Đăng ký thất bại. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Updates user profile information
 */
export const updateUserProfile = async (profileData: UpdateProfileData): Promise<AuthResponse> => {
  try {
    try {
      // Lấy thông tin người dùng hiện tại
      const currentUserStr = localStorage.getItem('user');
      if (!currentUserStr) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Phiên đăng nhập hết hạn');
      }
      
      // Chuẩn bị dữ liệu cập nhật
      const requestData = {
        maTK: currentUser.id,
        tenDangNhap: profileData.username,
        hoTen: profileData.fullName,
        email: profileData.email,
        soDienThoai: profileData.phoneNumber || currentUser.phoneNumber,
        gioiTinh: profileData.gender || currentUser.gender,
        ngaySinh: profileData.birthDate || currentUser.birthDate,
        diaChi: profileData.address || currentUser.address
      };
      
      // Gọi API
      const response = await axiosInstance.put(`/Auth/UpdateProfile`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        // Cập nhật thông tin người dùng trong localStorage
        const updatedUser = {
          ...currentUser,
          username: profileData.username,
          fullName: profileData.fullName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || currentUser.phoneNumber,
          gender: profileData.gender || currentUser.gender,
          birthDate: profileData.birthDate || currentUser.birthDate,
          address: profileData.address || currentUser.address
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          success: true,
          message: 'Cập nhật thông tin thành công',
          data: {
            user: updatedUser
          }
        };
      } else {
        throw new Error(response.data.message || 'Cập nhật thông tin thất bại');
      }
    } catch (apiError) {
      // Nếu API fail, cập nhật local
      const currentUserStr = localStorage.getItem('user');
      if (!currentUserStr) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        };
      }
      
      const currentUser = JSON.parse(currentUserStr);
      
      // Cập nhật thông tin người dùng
      const updatedUser = {
        ...currentUser,
        username: profileData.username,
        fullName: profileData.fullName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || currentUser.phoneNumber,
        gender: profileData.gender || currentUser.gender,
        birthDate: profileData.birthDate || currentUser.birthDate,
        address: profileData.address || currentUser.address
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Nếu người dùng được đăng ký cục bộ, cập nhật trong USERS_STORAGE_KEY
      const users = getRegisteredUsers();
      if (users[profileData.username]) {
        users[profileData.username] = {
          ...users[profileData.username],
          ...updatedUser,
          password: users[profileData.username].password // Giữ lại mật khẩu
        };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      
      return {
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: {
          user: updatedUser
        }
      };
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'Cập nhật thông tin thất bại. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Checks if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('auth_token') !== null;
};

/**
 * Returns the current user
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data from localStorage', e);
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
  
  // Kích hoạt sự kiện để thông báo cho Header
  const logoutEvent = new Event('user-logout');
  window.dispatchEvent(logoutEvent);
  
  // Chuyển hướng đến trang đăng nhập nếu cần
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Redirects to login if not authenticated
 */
export const redirectToLoginIfNotAuthenticated = (redirectPath?: string): boolean => {
  if (!isAuthenticated() && typeof window !== 'undefined') {
    const path = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
    window.location.href = path;
    return true;
  }
  return false;
};

/**
 * Checks if the current page is checkout page
 */
export const isCheckoutPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/payment');
};

/**
 * Changes user password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Bạn chưa đăng nhập'
      };
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        message: 'Phiên đăng nhập hết hạn'
      };
    }
    
    try {
      // Gọi API đổi mật khẩu thực tế
      const response = await axiosInstance.post('/Auth/ChangePassword', {
        maTK: currentUser.id,
        matKhauCu: currentPassword,
        matKhauMoi: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Đổi mật khẩu thành công'
        };
      } else {
        throw new Error(response.data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (apiError) {
      // Nếu API không thành công, đổi mật khẩu local
      const users = getRegisteredUsers();
      const userRecord = users[currentUser.username];
      
      if (userRecord && userRecord.password === currentPassword) {
        userRecord.password = newPassword;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        return {
          success: true,
          message: 'Đổi mật khẩu thành công'
        };
      } else {
        return {
          success: false,
          message: 'Mật khẩu hiện tại không chính xác'
        };
      }
    }
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'Đổi mật khẩu thất bại. Vui lòng thử lại sau.'
    };
  }
}

/**
 * Deletes user account
 */
export const deleteUser = async (): Promise<AuthResponse> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Bạn chưa đăng nhập'
      };
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        message: 'Phiên đăng nhập hết hạn'
      };
    }
    
    try {
      // Gọi API xóa tài khoản thực tế
      const response = await axiosInstance.delete(`/Auth/DeleteAccount?id=${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        logout();
        return {
          success: true,
          message: 'Xóa tài khoản thành công'
        };
      } else {
        throw new Error(response.data.message || 'Xóa tài khoản thất bại');
      }
    } catch (apiError) {
      // Nếu API không thành công, xóa tài khoản local
      const users = getRegisteredUsers();
      
      if (users[currentUser.username]) {
        delete users[currentUser.username];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        logout();
        
        return {
          success: true,
          message: 'Xóa tài khoản thành công'
        };
      } else {
        return {
          success: false,
          message: 'Không tìm thấy tài khoản'
        };
      }
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return {
      success: false,
      message: 'Xóa tài khoản thất bại. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Đăng nhập với tài khoản nhân viên
 */
export const loginAsStaff = () => {
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
};

/**
 * Kiểm tra và đảm bảo tài khoản admin tồn tại
 */
const ensureAdminAccount = () => {
  const users = getRegisteredUsers();
  
  if (!users['admin']) {
    const adminUser = {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrator',
      email: 'admin@hotel.com',
      role: 'admin'
    };
    
    users['admin'] = adminUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};

/**
 * Đăng nhập với tài khoản admin
 */
export const loginAsAdmin = () => {
  ensureAdminAccount();
  
  const adminUser = {
    id: 'admin',
    username: 'admin',
    fullName: 'Administrator',
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
};

// Xuất tất cả các hàm
export default {
  login,
  register,
  updateUserProfile,
  isAuthenticated,
  getCurrentUser,
  logout,
  redirectToLoginIfNotAuthenticated,
  isCheckoutPage,
  changePassword,
  deleteUser,
  loginAsStaff,
  loginAsAdmin
};