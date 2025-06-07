import axios, { AxiosRequestConfig } from 'axios';

// Base URL for API calls
const BASE_URL = '/api';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1 second
  timeoutMs: 8000   // 8 seconds
};

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API call with retry logic specifically for discount operations
export async function callDiscountAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  config?: AxiosRequestConfig
): Promise<any> {
  const url = `${BASE_URL}/${endpoint}`;
  let lastError: any;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries + 1; attempt++) {
    try {
      const requestConfig: AxiosRequestConfig = {
        method,
        url,
        data,
        timeout: RETRY_CONFIG.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...config?.headers
        },
        ...config
      };

      const response = await axios(requestConfig);
      
      // Return successful response
      return response;

    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.response?.status === 400 || error.response?.status === 404) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt > RETRY_CONFIG.maxRetries) {
        throw error;
      }

      // Wait before retrying
      await delay(RETRY_CONFIG.retryDelay * attempt);
      
      console.log(`Retrying discount API call (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
    }
  }

  throw lastError;
}

// Specific functions for discount operations
export const discountAPI = {
  // Get all discounts
  getAll: () => callDiscountAPI('GiamGia/GetAll'),

  // Get discount by ID
  getById: (id: number) => callDiscountAPI(`GiamGia/GetById?id=${id}`),

  // Create new discount
  create: (data: any) => callDiscountAPI('GiamGia/Create', 'POST', data),

  // Update discount
  update: (id: number, data: any) => callDiscountAPI(`GiamGia/Update?id=${id}`, 'PUT', data),

  // Delete discount
  delete: (id: number) => callDiscountAPI(`GiamGia/Delete?id=${id}`, 'DELETE'),

  // Toggle discount status (optimized for quick status changes)
  toggleStatus: async (discount: any) => {
    const updateData = {
      id: discount.id,
      tenMa: discount.tenMa,
      loaiGiam: discount.loaiGiam,
      giaTri: discount.giaTri,
      ngayBatDau: discount.ngayBatDau,
      ngayKetThuc: discount.ngayKetThuc,
      trangThai: !discount.trangThai
    };

    return callDiscountAPI(`GiamGia/Update?id=${discount.id}`, 'PUT', updateData, {
      timeout: 6000 // Shorter timeout for status toggle
    });
  }
};

// Error message helper
export function getDiscountErrorMessage(error: any): string {
  if (error.code === 'ECONNABORTED') {
    return 'Yêu cầu quá thời gian. Vui lòng thử lại sau.';
  }
  
  if (error.response?.status === 503) {
    return 'Server tạm thời không khả dụng. Vui lòng thử lại sau.';
  }
  
  if (error.response?.status === 500) {
    return 'Lỗi server nội bộ. Vui lòng liên hệ quản trị viên.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return error.message || 'Đã xảy ra lỗi không xác định';
}
