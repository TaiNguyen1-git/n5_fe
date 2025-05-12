import axios from 'axios';
import Cookies from 'js-cookie';

// Sử dụng proxy đã cấu hình trong next.config.js để tránh vấn đề CORS
const BASE_URL = '/api';

// Cấu hình axios
axios.defaults.withCredentials = true; // Cho phép gửi cookies trong các request cross-origin
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Thêm interceptor để xử lý lỗi
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
    } else if (error.response) {
      // Lỗi từ server
      console.error('Server error:', error.response.status, error.response.statusText);
    } else if (error.request) {
      // Không nhận được phản hồi
      console.error('No response received:', error.request);
    } else {
      // Lỗi khác
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);
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

// Định nghĩa interface cho dữ liệu người dùng theo cấu trúc API mới
export interface User {
  maTK?: number | string;
  tenTK?: string;
  matKhau?: string;
  tenHienThi?: string;
  sinhNhat?: string | null;
  diaChi?: string | null;
  phone?: string;
  email?: string;
  isVerified?: boolean;
  createAt?: string;
  imgAvt?: string | null;
  lastRef?: string | null;
  idOTP?: string | null;
  role?: string;

  // Các trường tương thích ngược với code cũ
  tenDangNhap?: string;
  hoTen?: string;
  soDienThoai?: string;
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

          // Đảm bảo loaiTK là số
          if (typeof updatedUserData.loaiTK === 'string') {
            updatedUserData.loaiTK = parseInt(updatedUserData.loaiTK, 10);
          }

          // Đảm bảo role được đồng bộ với loaiTK
          if (updatedUserData.loaiTK === 1) {
            updatedUserData.role = 'admin';
          } else if (updatedUserData.loaiTK === 2) {
            updatedUserData.role = 'staff';
          } else {
            updatedUserData.role = 'customer';
          }

          console.log('getUserProfile - Đồng bộ role từ loaiTK:', {
            loaiTK: updatedUserData.loaiTK,
            role: updatedUserData.role
          });

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

// Định nghĩa interface cho phản hồi phân trang
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API services cho người dùng
export const userService = {
  // Lấy tất cả người dùng với phân trang
  getAllUsers: async (pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedResponse<User>> => {
    // Số lần thử lại tối đa
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        console.log(`Fetching users with pageNumber=${pageNumber}, pageSize=${pageSize} (attempt ${retryCount + 1}/${maxRetries})`);

        // Sử dụng API route của Next.js thay vì gọi trực tiếp đến backend
        const response = await axios.get(`/api/users`, {
          params: {
            pageNumber,
            pageSize
          },
          timeout: 15000 // 15 giây
        });

        console.log('API response structure:', Object.keys(response.data));

        // Kiểm tra cấu trúc phản hồi
        if (response.data && response.data.items && Array.isArray(response.data.items)) {
          // Phản hồi đã có cấu trúc phân trang
          return response.data;
        } else if (Array.isArray(response.data)) {
          // Phản hồi là mảng trực tiếp, chuyển đổi sang cấu trúc phân trang
          return {
            items: response.data,
            totalItems: response.data.length,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: Math.ceil(response.data.length / pageSize)
          };
        } else {
          // Trường hợp không xác định, trả về cấu trúc mặc định
          console.warn('Unexpected API response format:', response.data);
          return {
            items: [],
            totalItems: 0,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: 0
          };
        }
      } catch (error) {
        lastError = error;
        console.error(`Error fetching users (attempt ${retryCount + 1}/${maxRetries}):`, error);

        // Tăng số lần thử
        retryCount++;

        if (retryCount < maxRetries) {
          // Chờ trước khi thử lại (1s, 2s, 4s...)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Nếu tất cả các lần thử đều thất bại, trả về dữ liệu mặc định
    console.error('All retry attempts failed. Returning empty data.');
    return {
      items: [],
      totalItems: 0,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPages: 0
    };
  },

  // Lấy người dùng theo ID
  getUserById: async (id: number | string): Promise<User> => {
    try {
      // Sử dụng API route của Next.js
      const response = await axios.get(`/api/users/${id}`, {
        timeout: 15000 // 15 giây
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  },

  // Tạo người dùng mới
  createUser: async (userData: Partial<User>): Promise<any> => {
    // Số lần thử lại tối đa
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        console.log(`Creating user (attempt ${retryCount + 1}/${maxRetries}):`, userData);
        // Sử dụng API endpoint chính xác cho tạo mới
        console.log(`Calling API: POST ${BASE_URL}/User/Create with data:`, userData);
        const response = await axios.post(`${BASE_URL}/User/Create`, userData, {
          timeout: 15000 // 15 giây
        });
        console.log('Create API response:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`Error creating user (attempt ${retryCount + 1}/${maxRetries}):`, error);

        // Tăng số lần thử
        retryCount++;

        if (retryCount < maxRetries) {
          // Chờ trước khi thử lại (1s, 2s, 4s...)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Nếu tất cả các lần thử đều thất bại
    console.error('All retry attempts failed for createUser.');
    throw lastError;
  },

  // Cập nhật người dùng
  updateUser: async (id: number | string, userData: Partial<User>): Promise<any> => {
    // Số lần thử lại tối đa
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        // Đảm bảo maTK được bao gồm trong dữ liệu
        const updatedData = {
          ...userData,
          maTK: id
        };

        console.log(`Updating user with id ${id}, data (attempt ${retryCount + 1}/${maxRetries}):`, updatedData);

        // Sử dụng API endpoint chính xác cho cập nhật
        console.log('Calling API: PUT ${BASE_URL}/User/Update with data:', updatedData);
        const response = await axios.put(`${BASE_URL}/User/Update`, updatedData, {
          timeout: 15000 // 15 giây
        });
        console.log('Update API response:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`Error updating user with id ${id} (attempt ${retryCount + 1}/${maxRetries}):`, error);

        // Tăng số lần thử
        retryCount++;

        if (retryCount < maxRetries) {
          // Chờ trước khi thử lại (1s, 2s, 4s...)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Nếu tất cả các lần thử đều thất bại
    console.error('All retry attempts failed for updateUser.');
    throw lastError;
  },

  // Xóa người dùng
  deleteUser: async (tenTK: string): Promise<any> => {
    // Số lần thử lại tối đa
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        console.log(`Deleting user with tenTK ${tenTK} (attempt ${retryCount + 1}/${maxRetries})`);
        // Sử dụng API endpoint chính xác với tham số TenTK
        console.log(`Calling API: DELETE ${BASE_URL}/User/Delete with TenTK=${tenTK}`);
        const response = await axios.delete(`${BASE_URL}/User/Delete`, {
          params: { TenTK: tenTK },
          timeout: 15000 // 15 giây
        });
        console.log('Delete API response:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`Error deleting user with tenTK ${tenTK} (attempt ${retryCount + 1}/${maxRetries}):`, error);

        // Tăng số lần thử
        retryCount++;

        if (retryCount < maxRetries) {
          // Chờ trước khi thử lại (1s, 2s, 4s...)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Nếu tất cả các lần thử đều thất bại
    console.error('All retry attempts failed for deleteUser.');
    throw lastError;
  },

  // Kiểm tra xem người dùng đã tồn tại
  checkUserExists: async (username: string): Promise<boolean> => {
    try {
      // Sử dụng API route của Next.js
      const response = await axios.get(`/api/users/check-exists`, {
        params: { username },
        timeout: 15000 // 15 giây
      });
      return response.data.exists;
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