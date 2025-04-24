import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define types
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
  // Handle POST request for creating a booking
  if (req.method === 'POST') {
    try {
      const bookingData = req.body;

      // Validate required fields
      const requiredFields = ['maPhong', 'tenKH', 'email', 'ngayBatDau', 'ngayKetThuc', 'soLuongKhach', 'tongTien'];
      const missingFields = requiredFields.filter(field => !bookingData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Các trường sau là bắt buộc: ${missingFields.join(', ')}`
        });
      }

      // Format data for the backend API
      const apiBookingData = {
        maPhong: bookingData.maPhong,
        maKH: bookingData.maKH || null,
        tenKH: bookingData.tenKH,
        email: bookingData.email,
        soDienThoai: bookingData.soDienThoai || '',
        ngayBatDau: bookingData.ngayBatDau,
        ngayKetThuc: bookingData.ngayKetThuc,
        soLuongKhach: bookingData.soLuongKhach,
        tongTien: bookingData.tongTien,
        trangThai: 1 // Mặc định trạng thái là đã đặt
      };

      // Send booking data to the backend API
      const response = await axios.post(`${BACKEND_API_URL}/DatPhong/Create`, apiBookingData);
      
      return res.status(201).json({
        success: true,
        message: 'Đặt phòng thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý đặt phòng'
      });
    }
  } 
  // Handle GET request for retrieving bookings
  else if (req.method === 'GET') {
    // Get query parameters
    const { userId, maPhong } = req.query;
    
    try {
      let url;
      
      // Determine which API endpoint to call based on the provided parameters
      if (userId && typeof userId === 'string') {
        url = `${BACKEND_API_URL}/DatPhong/GetByUser?id=${userId}`;
      } else if (maPhong && typeof maPhong === 'string') {
        url = `${BACKEND_API_URL}/DatPhong/GetByRoom?id=${maPhong}`;
      } else {
        url = `${BACKEND_API_URL}/DatPhong/GetAll`;
      }
      
      // Call the backend API
      const response = await axios.get(url);
      
      // Format the response data
      const bookings = Array.isArray(response.data) ? response.data.map((booking: any) => ({
        maHD: booking.maHD,
        maPhong: booking.maPhong,
        maKH: booking.maKH,
        tenKH: booking.tenKH,
        email: booking.email,
        soDienThoai: booking.soDienThoai,
        ngayBatDau: booking.ngayBatDau,
        ngayKetThuc: booking.ngayKetThuc,
        soLuongKhach: booking.soLuongKhach,
        tongTien: booking.tongTien,
        trangThai: booking.trangThai,
        ngayTao: booking.ngayTao
      })) : [];
      
      return res.status(200).json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Không thể lấy thông tin đặt phòng. Vui lòng thử lại sau.' 
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ 
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ` 
    });
  }
} 