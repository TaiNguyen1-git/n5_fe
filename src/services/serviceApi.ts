import axios from 'axios';

const BASE_URL = '/api'; // Sử dụng proxy đã cấu hình trong next.config.js

// Định nghĩa interface cho dữ liệu dịch vụ
export interface DichVu {
  maDichVu?: number;
  ten: string;
  hinhAnh: string;
  moTa: string;
  gia: number;
  trangThai: number;
}

// Interface cho response từ API
interface ApiResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API services cho dịch vụ
export const serviceApi = {
  // Lấy tất cả dịch vụ
  getAllServices: async (): Promise<DichVu[]> => {
    try {
      const response = await axios.get<ApiResponse<DichVu>>(`${BASE_URL}/DichVu/GetAll`, {
        timeout: 15000 // Tăng timeout lên 15 giây
      });
      // Trả về mảng items từ response
      return response.data.items || [];
    } catch (error: any) {
      console.error('Error fetching services:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Kết nối tới máy chủ quá thời gian. Vui lòng thử lại sau.');
      } else if (error.response) {
        // Lỗi từ phía server
        throw new Error(`Lỗi server: ${error.response.status} - ${error.response.data?.message || 'Không xác định'}`);
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      } else {
        // Lỗi khác
        throw new Error('Có lỗi xảy ra khi tải dữ liệu dịch vụ.');
      }
    }
  },

  // Lấy dịch vụ theo ID
  getServiceById: async (id: number): Promise<DichVu> => {
    try {
      const response = await axios.get(`${BASE_URL}/DichVu/GetById?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service with id ${id}:`, error);
      throw error;
    }
  },

  // Tạo dịch vụ mới
  createService: async (service: DichVu): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/DichVu/Create`, service);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Cập nhật dịch vụ
  updateService: async (id: number, service: DichVu): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/DichVu/Update?id=${id}`, service);
      return response.data;
    } catch (error) {
      console.error(`Error updating service with id ${id}:`, error);
      throw error;
    }
  },

  // Xóa dịch vụ
  deleteService: async (id: number): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/DichVu/Delete?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting service with id ${id}:`, error);
      throw error;
    }
  },
  
  // Đặt dịch vụ
  bookService: async (dichVuDat: {
    maDV: number;
    maKH?: number | string;
    soLuong: number;
    ngayDat: string;
    tongTien: number;
    ghiChu?: string;
  }): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/DichVuDat/Create`, dichVuDat);
      return response.data;
    } catch (error) {
      console.error('Error booking service:', error);
      throw error;
    }
  },
  
  // Lấy dịch vụ đã đặt theo người dùng
  getBookedServicesByUser: async (userId: number | string): Promise<any[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/DichVuDat/GetByUser?id=${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booked services for user ${userId}:`, error);
      throw error;
    }
  },
  
  // Hủy dịch vụ đã đặt
  cancelBookedService: async (id: number): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/DichVuDat/Cancel?id=${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling booked service with id ${id}:`, error);
      throw error;
    }
  }
};

export default serviceApi; 