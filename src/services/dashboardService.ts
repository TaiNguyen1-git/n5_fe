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

      // Return default values if response format is invalid
      console.warn('Invalid response format from dashboard stats API, using default values');
      return {
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        totalBookings: 0,
        totalCustomers: 0,
        totalEmployees: 0,
        totalRevenue: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values on error
      return {
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        totalBookings: 0,
        totalCustomers: 0,
        totalEmployees: 0,
        totalRevenue: 0
      };
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

      // Return empty array if response format is invalid
      console.warn('Invalid response format from recent bookings API, using empty array');
      return [];
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      // Return empty array on error
      return [];
    }
  }
};

export default dashboardService;
