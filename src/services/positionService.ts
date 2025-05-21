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
      console.log('Fetching all positions from API...');
      const response = await axios.get('/api/ChucVu/GetAll', {
        timeout: 15000 // 15 second timeout
      });

      // Kiểm tra cấu trúc dữ liệu trả về
      console.log('API response structure:', {
        isArray: Array.isArray(response.data),
        hasData: response.data && response.data.data,
        hasSuccess: response.data && response.data.success,
        hasItems: response.data && response.data.items,
        type: typeof response.data
      });

      if (response.data) {
        // Nếu dữ liệu có cấu trúc items
        if (response.data.items && Array.isArray(response.data.items)) {
          console.log('Using items array, length:', response.data.items.length);
          return response.data.items;
        }
        // Nếu dữ liệu có cấu trúc data
        else if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Using data array, length:', response.data.data.length);
          return response.data.data;
        }
        // Nếu dữ liệu là mảng trực tiếp
        else if (Array.isArray(response.data)) {
          console.log('Using direct array, length:', response.data.length);
          return response.data;
        }
        // Nếu dữ liệu có cấu trúc success và data
        else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            console.log('Using success.data array, length:', response.data.data.length);
            return response.data.data;
          } else {
            console.log('Data is not an array:', typeof response.data.data);
          }
        }
      }

      console.warn('No valid position data structure found, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  // Lấy chức vụ theo ID
  getPositionById: async (id: number): Promise<Position | null> => {
    try {
      console.log(`Fetching position with ID ${id} from API...`);

      // Gọi API với đường dẫn chính xác
      const response = await axios.get(`/api/ChucVu/GetById`, {
        params: { id },
        timeout: 15000 // 15 second timeout
      });

      console.log(`API response for position ID ${id}:`, response.data);

      if (response.data) {
        // Nếu dữ liệu có cấu trúc success và data
        if (response.data.success && response.data.data) {
          console.log('Using success.data structure:', response.data.data);
          return response.data.data;
        }
        // Nếu dữ liệu là đối tượng trực tiếp
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          console.log('Using direct object:', response.data);
          return response.data;
        }
      }

      console.warn(`No valid position data found for ID ${id}, returning null`);
      return null;
    } catch (error) {
      console.error(`Error fetching position with ID ${id}:`, error);

      // Thử gọi API trực tiếp đến backend nếu proxy không hoạt động
      try {
        const backendUrl = 'https://ptud-web-1.onrender.com/api';
        console.log(`Trying direct backend call after error: ${backendUrl}/ChucVu/GetById?id=${id}`);

        const directResponse = await axios.get(`${backendUrl}/ChucVu/GetById`, {
          params: { id },
          timeout: 15000
        });

        console.log(`Direct API response for position ID ${id}:`, directResponse.data);

        if (directResponse.data) {
          return directResponse.data;
        }
      } catch (directError) {
        console.error(`Error with direct API call for position ID ${id}:`, directError);
      }

      return null;
    }
  }
};

export default positionService;
