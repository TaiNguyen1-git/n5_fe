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

// Định nghĩa interface cho dữ liệu người dùng
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

// Định nghĩa kiểu dữ liệu cho thông tin cập nhật
export type UserUpdateData = {
  tenTK: string;
  tenHienThi?: string;
  phone?: string;
  email?: string;
};

// Định nghĩa kiểu dữ liệu phản hồi
type UpdateResponse = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * Lấy thông tin người dùng hiện tại từ API
 * @returns Thông tin người dùng
 */
export async function getUserProfile(): Promise<any> {
  try {
    // Kiểm tra xác thực
    if (typeof window === 'undefined') {
      return null;
    }

    // Lấy token từ cookie hoặc localStorage
    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return null;
    }

    console.log('getUserProfile - Đang gọi API với token:', token.substring(0, 15) + '...');

    // Gọi API lấy thông tin người dùng
    const response = await fetch('/api/user-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('getUserProfile - API response:', responseData);
      
      if (responseData.data) {
        // Log để debug
        console.log('getUserProfile - Số điện thoại:', responseData.data.phone);
        console.log('getUserProfile - Kiểu dữ liệu số điện thoại:', typeof responseData.data.phone);
        
        try {
          // Đọc dữ liệu hiện tại từ cookie hoặc localStorage
          const currentUserStr = getAuthCookie(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
          let currentUser: any = {};
          
          if (currentUserStr) {
            try {
              currentUser = JSON.parse(currentUserStr);
            } catch (parseError) {
              console.error('Error parsing user data:', parseError);
            }
          }
          
          // Xây dựng đối tượng người dùng đầy đủ
          const updatedUserData = {
            ...currentUser,
            ...responseData.data,
            // Đảm bảo những trường quan trọng luôn được cập nhật đúng
            id: responseData.data.id || responseData.data.maTK || currentUser.id,
            username: responseData.data.username || responseData.data.tenTK || currentUser.username,
            tenTK: responseData.data.tenTK || responseData.data.username || currentUser.tenTK,
            fullName: responseData.data.fullName || responseData.data.tenHienThi || currentUser.fullName,
            tenHienThi: responseData.data.tenHienThi || responseData.data.fullName || currentUser.tenHienThi,
            email: responseData.data.email || currentUser.email,
            phone: responseData.data.phone || responseData.data.phoneNumber || currentUser.phone,
            phoneNumber: responseData.data.phoneNumber || responseData.data.phone || currentUser.phoneNumber
          };
          
          // Lưu dữ liệu mới vào cả cookie và localStorage
          setAuthCookie(USER_DATA_KEY, JSON.stringify(updatedUserData));
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUserData));
          console.log('getUserProfile - Đã cập nhật dữ liệu người dùng:', updatedUserData);
          
          return updatedUserData;
        } catch (storageError) {
          console.error('getUserProfile - Lỗi khi cập nhật dữ liệu người dùng:', storageError);
          return responseData.data;
        }
      }
      
      return responseData.data;
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    return null;
  }
}

/**
 * Cập nhật thông tin người dùng
 * @param userData Thông tin cần cập nhật
 * @returns Kết quả cập nhật
 */
export async function updateUserProfile(userData: UserUpdateData): Promise<UpdateResponse> {
  try {
    // Kiểm tra xác thực
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện chức năng này'
      };
    }

    // Lấy token từ cookie hoặc localStorage
    const token = getAuthCookie(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin xác thực'
      };
    }

    console.log('Đang cập nhật thông tin người dùng:', userData);

    // Gọi API cập nhật thông qua Next.js API route
    const response = await fetch('/api/user-update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    
    if (result.success) {
      // Cập nhật thông tin người dùng trong cookie và localStorage
      const currentUserStr = getAuthCookie(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          const updatedUser = {
            ...currentUser,
            fullName: userData.tenHienThi || currentUser.fullName,
            tenHienThi: userData.tenHienThi || currentUser.tenHienThi,
            email: userData.email || currentUser.email,
            phoneNumber: userData.phone || currentUser.phoneNumber,
            phone: userData.phone || currentUser.phone,
            username: userData.tenTK || currentUser.username || currentUser.tenTK,
            tenTK: userData.tenTK || currentUser.tenTK || currentUser.username
          };
          
          // Lưu dữ liệu vào cả cookie và localStorage
          setAuthCookie(USER_DATA_KEY, JSON.stringify(updatedUser));
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
          console.log('userService: Đã cập nhật dữ liệu người dùng trong storage:', updatedUser);
          
          // Ngay sau khi cập nhật dữ liệu trong cookie/localStorage, chúng ta gọi API
          // để lấy dữ liệu mới nhất từ server và cập nhật lại
          try {
            setTimeout(async () => {
              console.log('userService: Đang đồng bộ hóa dữ liệu với server...');
              const profileData = await getUserProfile();
              console.log('userService: Đồng bộ hóa dữ liệu thành công:', profileData);
            }, 1000); // Delay 1 giây để đảm bảo server đã cập nhật xong dữ liệu
          } catch (syncError) {
            console.error('userService: Lỗi khi đồng bộ hóa dữ liệu:', syncError);
          }
        } catch (err) {
          console.error('Lỗi khi cập nhật thông tin người dùng:', err);
        }
      }
      
      return {
        success: true,
        message: result.message || 'Cập nhật thông tin thành công',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || 'Cập nhật thông tin thất bại',
        data: result.data
      };
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', error);
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau.'
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
  updateUserProfile
};

export default userService; 