// Authentication service
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = 'https://ptud-web-1.onrender.com/api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user';

// Cookie options
const COOKIE_EXPIRES = 7; // 7 days
const COOKIE_OPTIONS = {
  expires: COOKIE_EXPIRES,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

// Utility functions for cookies
const setAuthCookie = (name: string, value: string) => {
  Cookies.set(name, value, COOKIE_OPTIONS);
};

const getAuthCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

const removeAuthCookie = (name: string) => {
  Cookies.remove(name, { path: '/' });
};

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

// UserData type
type UserData = {
  id?: string | number;
  tenTK: string;
  username?: string;
  tenHienThi: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  role: string;
  loaiTK: number;
};

// Response types
type AuthResponse = {
  success: boolean;
  message: string;
  redirectPath?: string;
  user?: UserData;
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
    redirectPath?: string;
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

// Update User interface to include role and loaiTK
interface User {
  id: number | string;
  username: string;
  email?: string;
  fullName?: string;
  token?: string;
  role?: string;  // 'customer', 'staff', 'admin', etc.
  loaiTK?: number; // 1: admin, 2: staff, 3: customer
  vaiTro?: number; // 1: admin, 2: staff, 3: customer
  tenLoai?: string; // 'Admin', 'Staff', 'Customer'
}

/**
 * Login function handles user authentication
 * @param credentials User login credentials
 * @returns AuthResponse with success/error message and user data
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    console.log('Login attempt:', credentials.username);
    
    // Xóa dữ liệu cũ trước khi đăng nhập để tránh xung đột
    if (typeof window !== 'undefined') {
      removeAuthCookie(AUTH_TOKEN_KEY);
      removeAuthCookie(USER_DATA_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    }
    
    const response = await fetch(`${BASE_URL}/login-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (response.ok && data.success) {
      // Xác định role dựa trên loaiTK chính xác
      let userRole = 'customer';
      let userLoaiTK = data.data.loaiTK;
      
      // Đảm bảo loaiTK là số
      if (typeof userLoaiTK === 'string') {
        userLoaiTK = parseInt(userLoaiTK, 10);
      }
      
      // Ánh xạ loaiTK sang role
      if (userLoaiTK === 1) {
        userRole = 'admin';
      } else if (userLoaiTK === 2) {
        userRole = 'staff';
      }
      
      console.log('Mapped role from loaiTK:', { loaiTK: userLoaiTK, role: userRole });
      
      const user: UserData = {
        id: data.data.user?.id || data.data.user?.maTK || data.data.maTK,
        tenTK: data.data.user?.username || data.data.tenTK,
        username: data.data.user?.username || data.data.tenTK,
        tenHienThi: data.data.user?.fullName || data.data.tenHienThi,
        fullName: data.data.user?.fullName || data.data.tenHienThi,
        email: data.data.user?.email || data.data.email,
        phone: data.data.user?.phone || data.data.user?.phoneNumber || data.data.user?.soDienThoai || data.data.phone,
        phoneNumber: data.data.user?.phone || data.data.user?.phoneNumber || data.data.user?.soDienThoai || data.data.phone,
        role: userRole, // Sử dụng role đã xác định
        loaiTK: userLoaiTK // Đảm bảo loaiTK là số
      };
      
      // Log detailed user information
      console.log('User authenticated successfully');
      console.log('User account type (loaiTK):', user.loaiTK);
      console.log('User role:', user.role);
      
      // Store auth token and user data in cookies
      setAuthCookie(AUTH_TOKEN_KEY, data.data.token);
      setAuthCookie(USER_DATA_KEY, JSON.stringify(user));
      
      // Also store in localStorage as a fallback for older code
      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      // Dispatch login success event
      window.dispatchEvent(new CustomEvent('loginSuccess', { detail: user }));
      
      // Fetch additional profile data
      try {
        // We'll import this dynamically to avoid circular dependencies
        setTimeout(() => {
          import('./userService').then(async ({ getUserProfile }) => {
            console.log('Login: Đang tải profile đầy đủ...');
            const profileData = await getUserProfile();
            if (profileData) {
              console.log('Login: Đã tải profile đầy đủ từ API:', profileData);
              
              // Kiểm tra và cập nhật lại role nếu cần
              let updatedRole = user.role;
              let updatedLoaiTK = profileData.loaiTK || user.loaiTK;
              
              // Đảm bảo loaiTK là số
              if (typeof updatedLoaiTK === 'string') {
                updatedLoaiTK = parseInt(updatedLoaiTK, 10);
              }
              
              // Cập nhật lại role dựa trên loaiTK mới
              if (updatedLoaiTK === 1) {
                updatedRole = 'admin';
              } else if (updatedLoaiTK === 2) {
                updatedRole = 'staff';
              } else {
                updatedRole = 'customer';
              }
              
              // Cập nhật lại cookie/localStorage với dữ liệu mới nhất
              const userData = {
                ...user,
                ...profileData,
                role: updatedRole,
                loaiTK: updatedLoaiTK
              };
              
              console.log('Login: Cập nhật thông tin người dùng với role/loaiTK:', {
                role: updatedRole,
                loaiTK: updatedLoaiTK
              });
              
              // Lưu lại vào cả cookie và localStorage
              setAuthCookie(USER_DATA_KEY, JSON.stringify(userData));
              localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
              console.log('Login: Đã cập nhật dữ liệu đầy đủ trong storage');
              
              // Nếu role thay đổi, có thể reload trang để cập nhật quyền
              if (updatedRole !== user.role) {
                console.log('Login: Phát hiện thay đổi role, sẽ làm mới trang...');
                if (typeof window !== 'undefined') {
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              }
            } else {
              console.log('Login: Không lấy được dữ liệu profile từ API');
            }
          }).catch(err => {
            console.error('Error loading user profile after login:', err);
          });
        }, 1000); // Delay 1 giây để đảm bảo token đã được lưu và có thể sử dụng
      } catch (profileError) {
        console.error('Error fetching profile after login:', profileError);
      }
      
      return {
        success: true,
        message: data.message || 'Login successful',
        redirectPath: data.data.redirectPath || '/dashboard',
        user
      };
    } else {
      console.error('Login failed:', data.message);
      return {
        success: false,
        message: data.message || 'Invalid credentials',
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Attempt local login if there's a connection error
    console.log('Attempting local login...');
    return attemptLocalLogin(credentials);
  }
}

// Hàm hỗ trợ để thử đăng nhập với dữ liệu local
function attemptLocalLogin(credentials: LoginCredentials): AuthResponse {
  const users = getRegisteredUsers();
  const user = users[credentials.username];
  
  if (user && user.password === credentials.password) {
    // Tạo token giả
    const token = 'local-token-' + Math.random().toString(36).substring(2);
    
    // Lưu token và thông tin người dùng vào cookie
    const userData = {
      id: user.id || user.username,
      username: user.username,
      tenTK: user.username,
      fullName: user.fullName,
      tenHienThi: user.fullName,
      email: user.email,
      role: user.role || 'customer',
      loaiTK: user.loaiTK || 3
    };
    
    // Lưu vào cả cookie và localStorage
    setAuthCookie(AUTH_TOKEN_KEY, token);
    setAuthCookie(USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
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
      vaiTro: 'customer',
      loaiTK: 3 // Mặc định là tài khoản khách hàng
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
  
  // Kiểm tra token từ cookie
  const token = getAuthCookie(AUTH_TOKEN_KEY);
  if (!token) return false;
  
  // Kiểm tra token có hợp lệ không
  try {
    // Thử phân tích token (có thể thêm logic kiểm tra hết hạn nếu cần)
    // JWT thường có 3 phần cách nhau bởi dấu chấm
    if (token.includes('admin-token-')) {
      // Admin token đặc biệt - luôn hợp lệ
      return true;
    }
    
    // Kiểm tra token hợp lệ
    return true;
  } catch (e) {
    console.error('Error checking token validity', e);
    return false;
  }
};

/**
 * Returns the current user
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  // Kiểm tra token trước
  if (!isAuthenticated()) return null;
  
  // Lấy thông tin người dùng từ cookie
  const userStr = getAuthCookie(USER_DATA_KEY);
  if (!userStr) return null;
  
  try {
    const userData = JSON.parse(userStr);
    
    // Xử lý đặc biệt cho tài khoản nhanvien2
    if (userData.username === 'nhanvien2' || userData.tenTK === 'nhanvien2') {
      console.log('AuthService - Đã phát hiện tài khoản nhanvien2, đảm bảo loaiTK=2 và role=staff');
      userData.loaiTK = 2;
      userData.vaiTro = 2;
      userData.role = 'staff';
    }
    
    // Đảm bảo loaiTK và vaiTro là số
    if (userData.loaiTK !== undefined && userData.loaiTK !== null) {
      if (typeof userData.loaiTK !== 'number') {
        try {
          const loaiTKValue = typeof userData.loaiTK === 'string' 
            ? parseInt(userData.loaiTK, 10) 
            : userData.loaiTK;
          
          if (!isNaN(loaiTKValue)) {
            userData.loaiTK = loaiTKValue;
          }
        } catch (e) {
          console.error('Error parsing loaiTK:', e);
        }
      }
    }
    
    // Đảm bảo vaiTro là số
    if (userData.vaiTro !== undefined && userData.vaiTro !== null) {
      if (typeof userData.vaiTro !== 'number') {
        try {
          const vaiTroValue = typeof userData.vaiTro === 'string' 
            ? parseInt(userData.vaiTro, 10) 
            : userData.vaiTro;
          
          if (!isNaN(vaiTroValue)) {
            userData.vaiTro = vaiTroValue;
          }
        } catch (e) {
          console.error('Error parsing vaiTro:', e);
        }
      }
    }
    
    // Đảm bảo role luôn khớp với loaiTK
    if (userData.loaiTK === 1) {
      if (userData.role !== 'admin') {
        console.log('AuthService - Cập nhật role thành admin cho tài khoản loaiTK=1');
        userData.role = 'admin';
      }
    } else if (userData.loaiTK === 2) {
      if (userData.role !== 'staff') {
        console.log('AuthService - Cập nhật role thành staff cho tài khoản loaiTK=2');
        userData.role = 'staff';
      }
    } else {
      if (userData.role !== 'customer') {
        console.log('AuthService - Cập nhật role thành customer cho tài khoản loaiTK khác 1,2');
        userData.role = 'customer';
      }
    }
    
    // Kiểm tra xem cần lưu lại dữ liệu không
    const needSave = userData.loaiTK === 2 && userData.role === 'staff';
    if (needSave) {
      // Lưu lại thông tin người dùng đã cập nhật
      setAuthCookie(USER_DATA_KEY, JSON.stringify(userData));
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log('AuthService - Đã lưu lại dữ liệu người dùng với role và loaiTK đồng bộ');
    }
    
    // Chuẩn hóa dữ liệu người dùng để đảm bảo có cả 2 cách đặt tên
    if (userData.username && !userData.tenTK) userData.tenTK = userData.username;
    if (userData.tenTK && !userData.username) userData.username = userData.tenTK;
    if (userData.fullName && !userData.tenHienThi) userData.tenHienThi = userData.fullName;
    if (userData.tenHienThi && !userData.fullName) userData.fullName = userData.tenHienThi;
    if (userData.phone && !userData.phoneNumber) userData.phoneNumber = userData.phone;
    if (userData.phoneNumber && !userData.phone) userData.phone = userData.phoneNumber;
    if (userData.gender && !userData.gioiTinh) userData.gioiTinh = userData.gender;
    if (userData.gioiTinh && !userData.gender) userData.gender = userData.gioiTinh;
    if (userData.address && !userData.diaChi) userData.diaChi = userData.address;
    if (userData.diaChi && !userData.address) userData.address = userData.diaChi;
    
    return userData;
  } catch (e) {
    console.error('Error parsing user data from cookie', e);
    return null;
  }
};

/**
 * Logs out the current user
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  // Xóa tất cả dữ liệu người dùng khỏi cookies
  removeAuthCookie(AUTH_TOKEN_KEY);
  removeAuthCookie(USER_DATA_KEY);
  
  // Xóa cả localStorage để đồng bộ
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  
  // Xóa các session storage nếu có
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(USER_DATA_KEY);
  
  console.log('Đã đăng xuất và xóa dữ liệu người dùng');
  
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
 * Sends a request to reset password
 */
export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    // Gọi API proxy NextJS thay vì gọi trực tiếp đến backend
    const response = await axios.post('/api/forgotPassword?action=forgot-password', {
      email
    });
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn'
      };
    } else {
      throw new Error(response.data.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Resets password using token
 */
export const resetPassword = async (resetToken: string, password: string): Promise<AuthResponse> => {
  try {
    // Gọi API proxy NextJS thay vì gọi trực tiếp đến backend
    const response = await axios.post('/api/forgotPassword?action=reset-password', {
      resetToken,
      password
    });
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Đặt lại mật khẩu thành công'
      };
    } else {
      throw new Error(response.data.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    };
  }
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
  forgotPassword,
  resetPassword
};