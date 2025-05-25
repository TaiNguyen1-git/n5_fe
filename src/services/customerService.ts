import axios from 'axios';

// Customer interface
export interface Customer {
  maKH?: number;
  tenKH: string;
  email: string;
  phone?: string;
  maVaiTro?: number;
  xoa?: boolean;
}

// Response interface
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Define interface for paginated response
export interface PaginatedCustomerResponse {
  items: Customer[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Create a new customer
 * API tạo khách hàng: POST /api/KhachHang/Create
 * Format dữ liệu POST:
 * {
 *   "tenKH": string,
 *   "email": string,
 *   "phone": string,
 *   "maVaiTro": number, // 3: Khách hàng
 *   "xoa": boolean
 * }
 */
export const createCustomer = async (customerData: Customer): Promise<ApiResponse<any>> => {
  try {
    // Cấu trúc dữ liệu khách hàng theo đúng cấu trúc API yêu cầu
    const serverData = {
      tenKH: customerData.tenKH || "Khách hàng",
      email: customerData.email || "guest@example.com",
      phone: customerData.phone || "",
      maVaiTro: customerData.maVaiTro || 3, // Mặc định là 3 (khách hàng)
      xoa: false
    };

    // Gọi API với nhiều URL khác nhau

    // Danh sách các URL API để thử
    const API_URLS = [
      '/api/KhachHang/Create', // Sử dụng proxy Next.js
      'https://ptud-web-3.onrender.com/api/KhachHang/Create', // URL thay thế
      'https://ptud-web-1.onrender.com/api/KhachHang/Create' // URL gốc
    ];

    let response;
    let error;

    // Thử từng URL cho đến khi thành công
    for (const url of API_URLS) {
      try {
        response = await axios.post(url, serverData, {
          timeout: 15000, // 15 giây timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        // Nếu thành công, thoát khỏi vòng lặp
        if (response && response.status >= 200 && response.status < 300) {
          break;
        }
      } catch (err: any) {
        error = err;
        // Tiếp tục thử URL tiếp theo
      }
    }

    // Nếu không có response thành công, ném lỗi cuối cùng
    if (!response) {
      throw error || new Error('Failed to create customer with all available URLs');
    }

    console.log('Customer creation response status:', response.status);
    console.log('Customer creation response data:', JSON.stringify(response.data, null, 2));

    // Kiểm tra xem response có chứa dữ liệu khách hàng không
    if (!response.data || !response.data.data || !response.data.data.maKH) {
      console.warn('API response does not contain customer ID (maKH):', response.data);
    }

    return {
      success: true,
      message: 'Tạo khách hàng thành công',
      data: response.data
    };
  } catch (error) {
    console.error('Error creating customer:', error);

    // Xử lý lỗi cụ thể
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Có response từ server nhưng status code là lỗi
        return {
          success: false,
          message: error.response.data?.message || 'Không thể tạo khách hàng. Vui lòng kiểm tra thông tin và thử lại.'
        };
      } else if (error.request) {
        // Không nhận được response từ server
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
        };
      }
    }

    return {
      success: false,
      message: 'Không thể tạo khách hàng. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Get all customers with pagination
 */
export const getAllCustomers = async (pageNumber: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedCustomerResponse>> => {
  try {


    const response = await axios.get('/api/customers', {
      params: {
        pageNumber,
        pageSize
      },
      timeout: 15000 // 15 second timeout
    });

    console.log('Customers API response:', response.data);

    if (response.data && response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch customers',
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
    console.error('Error fetching customers:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể lấy danh sách khách hàng',
      data: {
        items: [],
        totalItems: 0,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: 0
      }
    };
  }
};

/**
 * Get all customers without pagination (for backward compatibility)
 */
export const getAllCustomersNoPagination = async (): Promise<ApiResponse<Customer[]>> => {
  try {

    const response = await getAllCustomers(1, 1000); // Get a large page

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch customers',
      data: []
    };
  } catch (error) {
    console.error('Error fetching customers without pagination:', error);
    return {
      success: false,
      message: 'Không thể lấy danh sách khách hàng',
      data: []
    };
  }
};

/**
 * Get customer by ID
 * API lấy thông tin khách hàng: GET /api/KhachHang/GetById?id={customerId}
 */
export const getCustomerById = async (customerId: number): Promise<ApiResponse<Customer>> => {
  try {
    const response = await axios.get(`/api/customers/${customerId}`, {
      timeout: 15000 // 15 giây timeout
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching customer with ID ${customerId}:`, error);
    return {
      success: false,
      message: 'Không thể lấy thông tin khách hàng. Vui lòng thử lại sau.'
    };
  }
};

export default {
  createCustomer,
  getAllCustomers,
  getAllCustomersNoPagination,
  getCustomerById
};
