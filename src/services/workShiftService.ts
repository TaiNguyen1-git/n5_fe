import axios from 'axios';

const BASE_URL = '/api'; // Using Next.js API routes

// Define interface for work shift data
export interface WorkShift {
  id?: number;
  maCa?: number;
  tenCa?: string;
  gioBatDau?: string;
  gioKetThuc?: string;
  ngayLamViec?: string;
  maNV?: number;
  tenNV?: string;
  ghiChu?: string;
  trangThai?: number;
}

// API services for work shifts
export const workShiftService = {
  // Get all work shifts
  getAllWorkShifts: async (): Promise<WorkShift[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/work-shifts`, {
        timeout: 15000 // 15 second timeout
      });

      if (response.data && response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  // Get work shift by ID
  getWorkShiftById: async (id: number | string): Promise<WorkShift> => {
    try {
      const response = await axios.get(`${BASE_URL}/work-shifts/${id}`);

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error('Work shift not found');
    } catch (error) {
      throw error;
    }
  },

  // Create new work shift
  createWorkShift: async (workShift: WorkShift): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/work-shifts`, workShift);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update work shift
  updateWorkShift: async (id: number | string, workShift: Partial<WorkShift>): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/work-shifts/${id}`, workShift);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete work shift
  deleteWorkShift: async (id: number | string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/work-shifts/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default workShiftService;
