import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://ptud-web-1.onrender.com/api',
  FALLBACK_URLS: [
    'https://ptud-web-1.onrender.com/api',
    'https://ptud-web-3.onrender.com/api'
  ],
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  value?: T; // For some APIs that return data in 'value' field
}

// Error type
export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
}

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API call with retry logic and fallback URLs
export async function apiCall<T = any>(
  endpoint: string,
  options: AxiosRequestConfig = {},
  useProxy: boolean = true
): Promise<ApiResponse<T>> {
  const { method = 'GET', data, headers = {}, ...restOptions } = options;
  
  // Determine URLs to try
  const urlsToTry = useProxy 
    ? [`/api/${endpoint.replace(/^\//, '')}`] // Use Next.js proxy
    : API_CONFIG.FALLBACK_URLS.map(baseUrl => `${baseUrl}/${endpoint.replace(/^\//, '')}`);

  let lastError: any;

  // Try each URL with retry logic
  for (const url of urlsToTry) {
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          method,
          url,
          data,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          timeout: API_CONFIG.TIMEOUT,
          ...restOptions,
        };

        const response: AxiosResponse = await axios(config);
        
        // Handle different response formats
        if (response.data) {
          // If response has success field, use it
          if (typeof response.data.success !== 'undefined') {
            return response.data;
          }
          
          // If response has statusCode and value (common pattern)
          if (response.data.statusCode === 200 && response.data.value) {
            return {
              success: true,
              data: response.data.value,
              statusCode: response.data.statusCode
            };
          }
          
          // If response is direct data
          return {
            success: true,
            data: response.data,
            statusCode: response.status
          };
        }

        return {
          success: true,
          data: response.data,
          statusCode: response.status
        };

      } catch (error: any) {
        lastError = error;
        
        // If it's the last attempt with this URL, don't delay
        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          break;
        }
        
        // Delay before retry
        await delay(API_CONFIG.RETRY_DELAY * attempt);
      }
    }
  }

  // All attempts failed
  const errorMessage = lastError?.response?.data?.message || 
                      lastError?.message || 
                      'Không thể kết nối đến server';
  
  return {
    success: false,
    message: errorMessage,
    statusCode: lastError?.response?.status || 500
  };
}

// Specific API methods
export const apiMethods = {
  // GET request
  get: <T = any>(endpoint: string, config?: AxiosRequestConfig) => 
    apiCall<T>(endpoint, { ...config, method: 'GET' }),

  // POST request  
  post: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'POST', data }),

  // PUT request
  put: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'PUT', data }),

  // DELETE request
  delete: <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'DELETE' }),

  // PATCH request
  patch: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'PATCH', data }),
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: 'Auth/Login',
    REGISTER: 'Auth/Register', 
    CHANGE_PASSWORD: 'Auth/ChangePassword',
  },
  
  // Users
  USER: {
    GET_ALL: 'User/GetAll',
    GET_BY_ID: (id: string | number) => `User/GetById?id=${id}`,
    CREATE: 'User/Create',
    UPDATE: 'User/Update',
    DELETE: (id: string | number) => `User/Delete?id=${id}`,
  },
  
  // Rooms
  ROOM: {
    GET_ALL: 'Phong/GetAll',
    GET_BY_ID: (id: string | number) => `Phong/GetById?id=${id}`,
    CREATE: 'Phong/Create',
    UPDATE: 'Phong/Update',
    DELETE: (id: string | number) => `Phong/Delete?id=${id}`,
  },
  
  // Bookings
  BOOKING: {
    GET_ALL: 'DatPhong/GetAll',
    GET_BY_ID: (id: string | number) => `DatPhong/GetById?id=${id}`,
    CREATE: 'DatPhong/Create',
    UPDATE: 'DatPhong/Update',
    DELETE: (id: string | number) => `DatPhong/Delete?id=${id}`,
  },
  
  // Services
  SERVICE: {
    GET_ALL: 'DichVu/GetAll',
    GET_BY_ID: (id: string | number) => `DichVu/GetById?id=${id}`,
    CREATE: 'DichVu/Create',
    UPDATE: 'DichVu/Update',
    DELETE: (id: string | number) => `DichVu/Delete?id=${id}`,
  },
  
  // Customers
  CUSTOMER: {
    GET_ALL: 'KhachHang/GetAll',
    GET_BY_ID: (id: string | number) => `KhachHang/GetById?id=${id}`,
    CREATE: 'KhachHang/Create',
    UPDATE: 'KhachHang/Update',
    DELETE: (id: string | number) => `KhachHang/Delete?id=${id}`,
  },
  
  // Employees
  EMPLOYEE: {
    GET_ALL: 'NhanVien/GetAll',
    GET_BY_ID: (id: string | number) => `NhanVien/GetById?id=${id}`,
    CREATE: 'NhanVien/Create',
    UPDATE: 'NhanVien/Update',
    DELETE: (id: string | number) => `NhanVien/Delete?id=${id}`,
  },
  
  // Positions
  POSITION: {
    GET_ALL: 'ChucVu/GetAll',
    GET_BY_ID: (id: string | number) => `ChucVu/GetById?id=${id}`,
  },
  
  // Revenue
  REVENUE: {
    BY_DAY: 'DoanhThu/TheoNgay',
    BY_MONTH: 'DoanhThu/TheoThang', 
    BY_YEAR: 'DoanhThu/TheoNam',
    TOTAL: 'DoanhThu/TongDoanhThu',
  },
};

// Helper function to build query string
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Helper function for paginated requests
export async function getPaginatedData<T = any>(
  endpoint: string,
  page: number = 1,
  pageSize: number = 10,
  additionalParams: Record<string, any> = {}
): Promise<ApiResponse<{
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}>> {
  const params = {
    page,
    pageSize,
    ...additionalParams
  };
  
  const queryString = buildQueryString(params);
  return apiMethods.get(`${endpoint}${queryString}`);
}
