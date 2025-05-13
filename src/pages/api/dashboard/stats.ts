import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    try {
      // Gọi API để lấy thông tin phòng
      const roomsResponse = await axios.get(`${BACKEND_API_URL}/Phong/GetAll`, {
        timeout: 15000
      });
      
      // Gọi API để lấy thông tin đặt phòng
      const bookingsResponse = await axios.get(`${BACKEND_API_URL}/DatPhong/GetAll`, {
        timeout: 15000
      });
      
      // Gọi API để lấy thông tin khách hàng
      const customersResponse = await axios.get(`${BACKEND_API_URL}/KhachHang/GetAll`, {
        timeout: 15000
      });
      
      // Gọi API để lấy thông tin nhân viên
      const employeesResponse = await axios.get(`${BACKEND_API_URL}/NhanVien/GetAll`, {
        timeout: 15000
      });
      
      // Gọi API để lấy thông tin hóa đơn
      const billsResponse = await axios.get(`${BACKEND_API_URL}/HoaDon/GetAll`, {
        timeout: 15000
      });
      
      // Xử lý dữ liệu phòng
      let rooms = [];
      if (roomsResponse.data) {
        if (Array.isArray(roomsResponse.data)) {
          rooms = roomsResponse.data;
        } else if (roomsResponse.data.items && Array.isArray(roomsResponse.data.items)) {
          rooms = roomsResponse.data.items;
        }
      }
      
      // Xử lý dữ liệu đặt phòng
      let bookings = [];
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        } else if (bookingsResponse.data.items && Array.isArray(bookingsResponse.data.items)) {
          bookings = bookingsResponse.data.items;
        }
      }
      
      // Xử lý dữ liệu khách hàng
      let customers = [];
      if (customersResponse.data) {
        if (Array.isArray(customersResponse.data)) {
          customers = customersResponse.data;
        } else if (customersResponse.data.items && Array.isArray(customersResponse.data.items)) {
          customers = customersResponse.data.items;
        }
      }
      
      // Xử lý dữ liệu nhân viên
      let employees = [];
      if (employeesResponse.data) {
        if (Array.isArray(employeesResponse.data)) {
          employees = employeesResponse.data;
        } else if (employeesResponse.data.items && Array.isArray(employeesResponse.data.items)) {
          employees = employeesResponse.data.items;
        }
      }
      
      // Xử lý dữ liệu hóa đơn
      let bills = [];
      if (billsResponse.data) {
        if (Array.isArray(billsResponse.data)) {
          bills = billsResponse.data;
        } else if (billsResponse.data.items && Array.isArray(billsResponse.data.items)) {
          bills = billsResponse.data.items;
        }
      }
      
      // Tính toán thống kê
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((room: any) => room.maTT === 1 || room.trangThaiPhong?.tenTT === 'Trống').length;
      const occupiedRooms = rooms.filter((room: any) => room.maTT === 2 || room.trangThaiPhong?.tenTT === 'Đang sử dụng').length;
      const totalBookings = bookings.length;
      const totalCustomers = customers.length;
      const totalEmployees = employees.length;
      
      // Tính tổng doanh thu từ hóa đơn
      let totalRevenue = 0;
      bills.forEach((bill: any) => {
        if (bill.tongTien) {
          totalRevenue += Number(bill.tongTien);
        }
      });
      
      // Trả về dữ liệu thống kê
      return res.status(200).json({
        success: true,
        data: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          totalBookings,
          totalCustomers,
          totalEmployees,
          totalRevenue
        }
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin thống kê'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
