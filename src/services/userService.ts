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
  }
};

export default userService; 