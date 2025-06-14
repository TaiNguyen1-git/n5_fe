import axios from 'axios';

const BASE_URL = '/api'; // Sử dụng proxy đã cấu hình trong next.config.js

// Định nghĩa interface cho dữ liệu dịch vụ
export interface DichVu {
  maDichVu?: number;      // Mã dịch vụ
  ten: string;            // Tên dịch vụ
  hinhAnh: string;        // Hình ảnh dịch vụ
  moTa: string;           // Mô tả dịch vụ
  gia: number;            // Giá dịch vụ
  trangThai: number;      // Trạng thái dịch vụ
}

// Interface cho phản hồi từ API
interface ApiResponse<T> {
  success: boolean;       // Trạng thái thành công
  message?: string;       // Thông báo
  data?: T;               // Dữ liệu
}

// Interface cho phản hồi phân trang
interface PaginatedResponse<T> {
  items: T[];             // Danh sách items
  totalItems: number;     // Tổng số items
  pageNumber: number;     // Số trang hiện tại
  pageSize: number;       // Số items mỗi trang
  totalPages: number;     // Tổng số trang
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
        timeout: 15000 // 15 giây timeout
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
      const response = await serviceApi.getAllServices(1, 1000); // Lấy một trang lớn

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
    maDV: number;           // Mã dịch vụ
    maKH?: number | string; // Mã khách hàng
    soLuong: number;        // Số lượng
    ngayDat: string;        // Ngày đặt
    tongTien: number;       // Tổng tiền
    ghiChu?: string;        // Ghi chú
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
  },

  // === SuDungDichVu APIs ===

  // Tạo bản ghi sử dụng dịch vụ
  createServiceUsage: async (serviceUsage: {
    maKH: number;           // Mã khách hàng
    maDV: number;           // Mã dịch vụ
    ngaySD: string;         // Ngày sử dụng
    soLuong: number;        // Số lượng
    thanhTien: number;      // Thành tiền
    trangThai?: string;     // Trạng thái
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.post(`${BASE_URL}/service-usage`, serviceUsage, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Đặt dịch vụ thành công',
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Đặt dịch vụ thất bại',
          data: null
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể đặt dịch vụ. Vui lòng thử lại.',
        data: null
      };
    }
  },

  // Lấy lịch sử sử dụng dịch vụ
  getServiceUsageHistory: async (pageNumber: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedResponse<any>>> => {
    try {
      const response = await axios.get(`${BASE_URL}/service-usage`, {
        params: {
          pageNumber,
          pageSize
        },
        timeout: 15000
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Không thể lấy lịch sử sử dụng dịch vụ',
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
        message: error.response?.data?.message || 'Không thể lấy lịch sử sử dụng dịch vụ',
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

  // Cập nhật bản ghi sử dụng dịch vụ
  updateServiceUsage: async (id: number, serviceUsage: {
    maKH: number;
    maDV: number;
    ngaySD: string;
    soLuong: number;
    thanhTien: number;
    trangThai?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.put(`${BASE_URL}/service-usage`, {
        id,
        ...serviceUsage
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Cập nhật sử dụng dịch vụ thành công',
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Cập nhật sử dụng dịch vụ thất bại',
          data: null
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật sử dụng dịch vụ. Vui lòng thử lại.',
        data: null
      };
    }
  },

  // Xóa bản ghi sử dụng dịch vụ
  deleteServiceUsage: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.delete(`${BASE_URL}/service-usage?id=${id}`, {
        timeout: 15000
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Xóa sử dụng dịch vụ thành công',
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Xóa sử dụng dịch vụ thất bại',
          data: null
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể xóa sử dụng dịch vụ. Vui lòng thử lại.',
        data: null
      };
    }
  }
};

// Export types for use in components
export type { PaginatedResponse, ApiResponse };

export default serviceApi;