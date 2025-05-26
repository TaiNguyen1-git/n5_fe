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
  success: boolean;
  message?: string;
  data?: T;
}

// Interface cho paginated response
interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API services cho dịch vụ
export const serviceApi = {
  // Lấy tất cả dịch vụ với phân trang
  getAllServices: async (pageNumber: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedResponse<DichVu>>> => {
    try {
      const response = await axios.get('/api/services', {
        params: {
          pageNumber,
          pageSize
        },
        timeout: 15000 // 15 second timeout
      });
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to fetch services',
          data: {
            items: [],
            totalItems: 0,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: 0
          }
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy danh sách dịch vụ',
        data: {
          items: [],
          totalItems: 0,
          pageNumber: pageNumber,
          pageSize: pageSize,
          totalPages: 0
        }
      };
    }
  },

  // Lấy tất cả dịch vụ không phân trang (cho backward compatibility)
  getAllServicesNoPagination: async (): Promise<DichVu[]> => {
    try {
      const response = await serviceApi.getAllServices(1, 1000); // Get a large page

      if (response.success && response.data) {
        return response.data.items;
      }

      return [];
    } catch (error) {
      return [];
    }
  },

  // Lấy dịch vụ theo ID
  getServiceById: async (id: number): Promise<DichVu> => {
    try {
      const response = await axios.get(`${BASE_URL}/DichVu/GetById?id=${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Tạo dịch vụ mới
  createService: async (service: DichVu): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/DichVu/Create`, service);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật dịch vụ
  updateService: async (id: number, service: DichVu): Promise<any> => {
    try {
      // Chuẩn bị dữ liệu theo đúng cấu trúc API yêu cầu
      const serviceData = {
        maDichVu: id,
        suDungDichVus: null,
        chiTietHoaDonDVs: null,
        ten: service.ten,
        hinhAnh: service.hinhAnh,
        moTa: service.moTa,
        gia: service.gia,
        trangThai: service.trangThai
      };
      // Thử nhiều cách gọi API
      const apiEndpoints = [
        // 1. Thông qua Next.js API route
        { url: `${BASE_URL}/services/${id}`, method: 'put' },
        // 2. Thông qua proxy chung với tham số query id
        { url: `${BASE_URL}/DichVu/Update?id=${id}`, method: 'put' },
        // 3. Trực tiếp đến backend với tham số query id
        { url: `https://ptud-web-1.onrender.com/api/DichVu/Update?id=${id}`, method: 'put' }
      ];

      let lastError = null;

      // Thử từng endpoint cho đến khi thành công
      for (const endpoint of apiEndpoints) {
        try {
          const response = await axios({
            method: endpoint.method,
            url: endpoint.url,
            data: serviceData,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          return response.data;
        } catch (apiError: any) {
          lastError = apiError;
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      // Nếu tất cả các endpoint đều thất bại
      throw lastError || new Error('Không thể cập nhật dịch vụ sau khi thử tất cả các endpoint');
    } catch (error) {
      throw error;
    }
  },

  // Xóa dịch vụ
  deleteService: async (id: number): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/DichVu/Delete?id=${id}`);
      return response.data;
    } catch (error) {
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
      throw error;
    }
  },

  // Lấy dịch vụ đã đặt theo người dùng
  getBookedServicesByUser: async (userId: number | string): Promise<any[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/DichVuDat/GetByUser?id=${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Hủy dịch vụ đã đặt
  cancelBookedService: async (id: number): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/DichVuDat/Cancel?id=${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Export types for use in components
export type { PaginatedResponse, ApiResponse };

export default serviceApi;