import axios from 'axios';

// Định nghĩa interface cho dữ liệu chức vụ
export interface Position {
  id?: number;
  maCV?: number;
  tenCV?: string;
  tenChucVu?: string; // Thêm trường mới từ API
  moTa?: string;
  luongCoBan?: number;
  nhanViens?: any[]; // Thêm trường mới từ API
  [key: string]: any; // Cho phép truy cập động vào các trường
}

// API services cho chức vụ
export const positionService = {
  // Lấy tất cả chức vụ
  getAllPositions: async (): Promise<Position[]> => {
    try {

      const response = await axios.get('/api/ChucVu/GetAll', {
        timeout: 15000 // 15 second timeout
      });

      // Kiểm tra cấu trúc dữ liệu trả về

      if (response.data) {
        // Nếu dữ liệu có cấu trúc items
        if (response.data.items && Array.isArray(response.data.items)) {

          return response.data.items;
        }
        // Nếu dữ liệu có cấu trúc data
        else if (response.data.data && Array.isArray(response.data.data)) {

          return response.data.data;
        }
        // Nếu dữ liệu là mảng trực tiếp
        else if (Array.isArray(response.data)) {

          return response.data;
        }
        // Nếu dữ liệu có cấu trúc success và data
        else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {

            return response.data.data;
          } else {

          }
        }
      }

      return [];
    } catch (error) {

      throw error;
    }
  },

  // Lấy chức vụ theo ID
  getPositionById: async (id: number): Promise<Position | null> => {
    try {

      // Gọi API với đường dẫn chính xác
      const response = await axios.get(`/api/ChucVu/GetById`, {
        params: { id },
        timeout: 15000 // 15 second timeout
      });

      if (response.data) {
        // Nếu dữ liệu có cấu trúc success và data
        if (response.data.success && response.data.data) {

          return response.data.data;
        }
        // Nếu dữ liệu là đối tượng trực tiếp
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {

          return response.data;
        }
      }

      return null;
    } catch (error) {

      // Thử gọi API trực tiếp đến backend nếu proxy không hoạt động
      try {
        const backendUrl = 'https://ptud-web-1.onrender.com/api';

        const directResponse = await axios.get(`${backendUrl}/ChucVu/GetById`, {
          params: { id },
          timeout: 15000
        });

        if (directResponse.data) {
          return directResponse.data;
        }
      } catch (directError) {

      }

      return null;
    }
  }
};

export default positionService;
