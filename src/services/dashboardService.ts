import axios from 'axios';

const BASE_URL = '/api'; // Using Next.js API routes

// Define interface for dashboard statistics
export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalBookings: number;
  totalCustomers: number;
  totalEmployees: number;
  totalRevenue: number;
}

// Define interface for recent bookings
export interface RecentBooking {
  id: number;
  roomNumber: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

// API services for dashboard
export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/dashboard/stats`, {
        timeout: 15000 // 15 second timeout
      });

      console.log('Dashboard stats API response:', response.data);

      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent bookings
  getRecentBookings: async (): Promise<RecentBooking[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/dashboard/recent-bookings`, {
        timeout: 15000 // 15 second timeout
      });

      console.log('Recent bookings API response:', response.data);

      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      throw error;
    }
  }
};

export default dashboardService;
