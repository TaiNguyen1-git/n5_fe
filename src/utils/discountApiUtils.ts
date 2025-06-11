import axios, { AxiosRequestConfig } from 'axios';

// Base URL for API calls
const BASE_URL = '/api';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1 second
  timeoutMs: 8000   // 8 seconds
};

// Faster retry config for status toggles
const TOGGLE_RETRY_CONFIG = {
  maxRetries: 3,     // More retries for critical operations
  retryDelay: 500,   // Faster retry (0.5s)
  timeoutMs: 4000    // Shorter timeout
};

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API call with retry logic specifically for discount operations
export async function callDiscountAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  config?: AxiosRequestConfig,
  useToggleConfig: boolean = false
): Promise<any> {
  const url = `${BASE_URL}/${endpoint}`;
  let lastError: any;

  // Choose retry config based on operation type
  const retryConfig = useToggleConfig ? TOGGLE_RETRY_CONFIG : RETRY_CONFIG;

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      const requestConfig: AxiosRequestConfig = {
        method,
        url,
        data,
        timeout: config?.timeout || retryConfig.timeoutMs,
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
      if (attempt > retryConfig.maxRetries) {
        throw error;
      }

      // Wait before retrying (shorter delay for toggles)
      await delay(retryConfig.retryDelay * attempt);

      const operationType = useToggleConfig ? 'status toggle' : 'discount API';
      console.log(`Retrying ${operationType} call (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`);
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

    return callDiscountAPI(
      `GiamGia/Update?id=${discount.id}`,
      'PUT',
      updateData,
      {
        timeout: 4000, // Shorter timeout for status toggle
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Request-Type': 'status-toggle' // Help identify quick requests
        }
      },
      true // Use toggle retry config
    );
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
