import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// API backend URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    // Lấy dữ liệu đặt phòng từ request body
    const bookingData = req.body;

    // Kiểm tra dữ liệu cần thiết
    if (!bookingData.maPhong || !bookingData.ngayBatDau || !bookingData.ngayKetThuc || !bookingData.soLuongKhach) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đặt phòng cần thiết'
      });
    }

    // Đảm bảo các trường thông tin cá nhân không bị null hoặc undefined
    bookingData.tenKH = bookingData.tenKH || 'Khách hàng';
    bookingData.email = bookingData.email || 'guest@example.com';
    bookingData.soDienThoai = bookingData.soDienThoai || '';

    // Log thông tin đặt phòng để debug
    console.log('Booking data:', {
      maPhong: bookingData.maPhong,
      maKH: bookingData.maKH,
      tenKH: bookingData.tenKH,
      email: bookingData.email,
      soDienThoai: bookingData.soDienThoai,
      ngayBatDau: bookingData.ngayBatDau,
      ngayKetThuc: bookingData.ngayKetThuc,
      soLuongKhach: bookingData.soLuongKhach,
      tongTien: bookingData.tongTien,
      trangThai: bookingData.trangThai || 1
    });

    // Gọi API backend để đặt phòng
    const response = await axios.post(`${BACKEND_API_URL}/DatPhong/Create`, bookingData, {
      timeout: 20000, // 20s timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      }
    });

    // Trả về kết quả từ API backend
    return res.status(200).json({
      success: true,
      message: 'Đặt phòng thành công',
      data: response.data
    });
  } catch (error: any) {
    console.error('Error booking room:', error);

    // Xử lý lỗi cụ thể
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server trả về lỗi
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Không thể đặt phòng. Vui lòng kiểm tra thông tin và thử lại.'
        });
      } else if (error.request) {
        // Không nhận được response từ server
        return res.status(503).json({
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Không thể đặt phòng. Vui lòng thử lại sau.'
    });
  }
}