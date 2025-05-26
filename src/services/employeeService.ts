import axios from 'axios';

const BASE_URL = '/api'; // Using Next.js API routes

// Define interface for employee data
export interface Employee {
  id?: number;
  maNV?: number;
  hoTen?: string;
  chucVu?: string;
  taiKhoan?: string;
  matKhau?: string;
  luong?: number;
  // Các trường từ API
  maNV_?: string | null;
  chucVu_?: string | null;
  hoTen_?: string | null;
  taiKhoan_?: string | null;
  luongCoBan?: number;
  trangThai?: boolean;
  // Các trường mới từ API
  chucVuId?: number;
  caLamId?: number;
  maVaiTro?: number;
  vaiTro?: string | null;
  caLam?: string | null;
}

// Define interface for paginated response
export interface PaginatedEmployeeResponse {
  items: Employee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API services for employees
export const employeeService = {
  // Get all employees with pagination
  getAllEmployees: async (pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedEmployeeResponse> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, {
        params: {
          pageNumber,
          pageSize
        },
        timeout: 15000 // 15 second timeout
      });

      // Kiểm tra cấu trúc dữ liệu trả về
      if (response.data) {
        // Nếu dữ liệu có cấu trúc success và data với pagination
        if (response.data.success && response.data.data) {
          const data = response.data.data;

          // Check if data has pagination structure
          if (data.items && Array.isArray(data.items)) {
            return {
              items: data.items,
              totalItems: data.totalItems || data.items.length,
              pageNumber: data.pageNumber || pageNumber,
              pageSize: data.pageSize || pageSize,
              totalPages: data.totalPages || Math.ceil((data.totalItems || data.items.length) / pageSize)
            };
          }
          // If data is directly an array (fallback)
          else if (Array.isArray(data)) {
            return {
              items: data,
              totalItems: data.length,
              pageNumber: pageNumber,
              pageSize: pageSize,
              totalPages: Math.ceil(data.length / pageSize)
            };
          }
        }
        // Nếu dữ liệu có cấu trúc items trực tiếp
        else if (response.data.items && Array.isArray(response.data.items)) {
          return {
            items: response.data.items,
            totalItems: response.data.totalItems || response.data.items.length,
            pageNumber: response.data.pageNumber || pageNumber,
            pageSize: response.data.pageSize || pageSize,
            totalPages: response.data.totalPages || Math.ceil((response.data.totalItems || response.data.items.length) / pageSize)
          };
        }
        // Nếu dữ liệu là mảng trực tiếp (fallback)
        else if (Array.isArray(response.data)) {
          return {
            items: response.data,
            totalItems: response.data.length,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: Math.ceil(response.data.length / pageSize)
          };
        }
      }
      return {
        items: [],
        totalItems: 0,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: 0
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all employees without pagination (for backward compatibility)
  getAllEmployeesNoPagination: async (): Promise<Employee[]> => {
    try {
      const response = await employeeService.getAllEmployees(1, 1000); // Get a large page
      return response.items;
    } catch (error) {
      throw error;
    }
  },

  // Get employee by ID
  getEmployeeById: async (id: number | string): Promise<Employee> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees/${id}`);

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error('Employee not found');
    } catch (error) {
      throw error;
    }
  },

  // Create new employee
  createEmployee: async (employee: Employee): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/employees`, employee);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id: number | string, employee: Partial<Employee>): Promise<any> => {
    try {
      // Không cần thêm id vào URL vì API sẽ lấy từ body
      const response = await axios.put(`${BASE_URL}/employees/${id}`, employee);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (id: number | string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/employees/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
