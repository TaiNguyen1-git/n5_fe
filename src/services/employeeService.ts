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
}

// API services for employees
export const employeeService = {
  // Get all employees
  getAllEmployees: async (): Promise<Employee[]> => {
    try {
      console.log('Fetching employees from API...');
      const response = await axios.get(`${BASE_URL}/employees`, {
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

      console.warn('No valid employee data structure found, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching employees:', error);
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
      console.error(`Error fetching employee with id ${id}:`, error);
      throw error;
    }
  },

  // Create new employee
  createEmployee: async (employee: Employee): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/employees`, employee);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id: number | string, employee: Partial<Employee>): Promise<any> => {
    try {
      console.log(`Updating employee with id ${id}, data:`, employee);
      // Không cần thêm id vào URL vì API sẽ lấy từ body
      const response = await axios.put(`${BASE_URL}/employees/${id}`, employee);
      return response.data;
    } catch (error) {
      console.error(`Error updating employee with id ${id}:`, error);
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (id: number | string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting employee with id ${id}:`, error);
      throw error;
    }
  }
};
