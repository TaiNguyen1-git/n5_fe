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

/**
 * Handles user login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Get registered users
    const users = getRegisteredUsers();
    const user = users[credentials.username];

    // Check if user exists and password matches
    if (user && user.password === credentials.password) {
      // Create session token
      const token = Math.random().toString(36).substring(2);
      
      // Store user data and token
      const userData = {
        id: user.id || Math.random().toString(36).substring(2),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender || 'Nam',
        birthDate: user.birthDate,
        address: user.address
      };

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: userData,
          token
        }
      };
    }

    return {
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
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