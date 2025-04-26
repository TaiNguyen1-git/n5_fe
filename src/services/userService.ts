import axios from 'axios';

const BASE_URL = 'https://ptud-web-1.onrender.com/api';

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
  
  // Lấy thông tin profile của người dùng đăng nhập hiện tại
  getUserProfile: async (): Promise<any> => {
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      
      const response = await axios.get(`${BASE_URL}/User/GetProfile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param userData Thông tin cần cập nhật
 * @returns Kết quả cập nhật
 */
export async function updateUserProfile(userData: UserUpdateData): Promise<UpdateResponse> {
  try {
    // Kiểm tra xác thực
    if (typeof window === 'undefined' || !localStorage.getItem('auth_token')) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện chức năng này'
      };
    }

    // Lấy token từ localStorage
    const token = localStorage.getItem('auth_token');
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
      // Cập nhật thông tin người dùng trong localStorage
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const updatedUser = {
          ...currentUser,
          fullName: userData.tenHienThi || currentUser.fullName,
          email: userData.email || currentUser.email,
          phoneNumber: userData.phone || currentUser.phoneNumber
        };
        
        // Lưu dữ liệu mới vào localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('userService: Đã cập nhật dữ liệu người dùng trong localStorage');
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

/**
 * Lấy thông tin người dùng hiện tại từ API
 * @returns Thông tin người dùng
 */
export async function getUserProfile(): Promise<any> {
  try {
    // Kiểm tra xác thực
    if (typeof window === 'undefined' || !localStorage.getItem('auth_token')) {
      return null;
    }

    // Lấy token từ localStorage
    const token = localStorage.getItem('auth_token');
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
      
      // Nếu có dữ liệu, kiểm tra chi tiết
      if (responseData.data) {
        console.log('getUserProfile - Số điện thoại:', responseData.data.phone);
        console.log('getUserProfile - Kiểu dữ liệu số điện thoại:', typeof responseData.data.phone);
      }
      
      return responseData.data;
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    return null;
  }
}

export default userService; 