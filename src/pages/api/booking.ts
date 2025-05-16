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

// Hàm xử lý lỗi từ axios
const handleAxiosError = (error: any): ResponseData => {
  console.error('API Error:', error);

  if (axios.isAxiosError(error)) {
    // Lỗi timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Kết nối đến máy chủ quá thời gian chờ. Vui lòng thử lại sau.'
      };
    }

    // Lỗi mạng
    if (error.code === 'ERR_NETWORK') {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.'
      };
    }

    // Lỗi có response từ server
    if (error.response) {
      const status = error.response.status;

      // Lỗi 404 - Không tìm thấy
      if (status === 404) {
        return {
          success: true,
          message: 'Không tìm thấy dữ liệu',
          data: []
        };
      }

      // Lỗi 401 - Không có quyền
      if (status === 401) {
        return {
          success: false,
          message: 'Bạn không có quyền truy cập thông tin này.'
        };
      }

      // Lỗi 400 - Dữ liệu không hợp lệ
      if (status === 400) {
        return {
          success: false,
          message: error.response.data?.message || 'Dữ liệu không hợp lệ.'
        };
      }

      // Lỗi server khác
      return {
        success: false,
        message: error.response.data?.message || `Lỗi máy chủ: ${status}`
      };
    }
  }

  // Lỗi chung
  return {
    success: false,
    message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    // Thiết lập CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  // Handle POST request for creating a booking
  else if (req.method === 'POST') {
    // Thiết lập CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    try {
      const bookingData = req.body;
      console.log('API handler: Received booking data:', bookingData);

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

      // Call the backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 giây timeout

      try {
        console.log(`API handler: Calling ${BACKEND_API_URL}/DatPhong/Create`);
        // Send booking data to the backend API
        const response = await axios.post(`${BACKEND_API_URL}/DatPhong/Create`, apiBookingData, {
          signal: controller.signal,
          timeout: 20000, // 20 giây timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        clearTimeout(timeoutId);
        console.log('API handler: Booking successful, response:', response.data);

        return res.status(201).json({
          success: true,
          message: 'Đặt phòng thành công',
          data: response.data
        });
      } catch (axiosError) {
        clearTimeout(timeoutId);
        throw axiosError;
      }
    } catch (error) {
      console.error('Booking error:', error);

      // Sử dụng hàm xử lý lỗi chung
      const errorResponse = handleAxiosError(error);
      const statusCode = errorResponse.success ? 200 : 500;

      return res.status(statusCode).json(errorResponse);
    }
  }
  // Handle GET request for retrieving bookings
  else if (req.method === 'GET') {
    // Thiết lập CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Get query parameters
    const { userId, maPhong } = req.query;

    try {
      let url;

      // Determine which API endpoint to call based on the provided parameters
      if (userId && typeof userId === 'string') {
        console.log(`API handler: Fetching bookings for user ID: ${userId}`);
        url = `${BACKEND_API_URL}/DatPhong/GetByUser?id=${userId}`;
      } else if (maPhong && typeof maPhong === 'string') {
        console.log(`API handler: Fetching bookings for room ID: ${maPhong}`);
        url = `${BACKEND_API_URL}/DatPhong/GetByRoom?id=${maPhong}`;
      } else {
        console.log('API handler: Fetching all bookings');
        url = `${BACKEND_API_URL}/DatPhong/GetAll`;
      }

      // Call the backend API with timeout và retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 giây timeout

      try {
        console.log(`API handler: Calling ${url}`);
        const response = await axios.get(url, {
          signal: controller.signal,
          timeout: 20000, // 20 giây timeout
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        // Format the response data
        let bookings = [];

        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log(`API handler: Received ${response.data.length} bookings (array)`);
            bookings = response.data.map((booking: any) => ({
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
            }));
          } else if (response.data.items && Array.isArray(response.data.items)) {
            console.log(`API handler: Received ${response.data.items.length} bookings (items)`);
            bookings = response.data.items.map((booking: any) => ({
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
            }));
          } else {
            console.warn('API handler: Unexpected response format:', response.data);
          }
        }

        return res.status(200).json({
          success: true,
          data: bookings
        });
      } catch (axiosError) {
        clearTimeout(timeoutId);
        throw axiosError;
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);

      // Sử dụng hàm xử lý lỗi chung
      const errorResponse = handleAxiosError(error);
      const statusCode = errorResponse.success ? 200 : 500;

      return res.status(statusCode).json(errorResponse);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }
}