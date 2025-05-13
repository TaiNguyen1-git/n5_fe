import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';

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
      // Gọi API để lấy thông tin đặt phòng
      const bookingsResponse = await axios.get(`${BACKEND_API_URL}/DatPhong/GetAll`, {
        timeout: 15000
      });
      
      // Xử lý dữ liệu đặt phòng
      let bookings = [];
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        } else if (bookingsResponse.data.items && Array.isArray(bookingsResponse.data.items)) {
          bookings = bookingsResponse.data.items;
        }
      }
      
      // Lọc và định dạng dữ liệu đặt phòng gần đây
      const recentBookings = bookings
        .sort((a: any, b: any) => {
          // Sắp xếp theo ngày đặt phòng mới nhất
          const dateA = dayjs(a.ngayBatDau || a.ngayDat);
          const dateB = dayjs(b.ngayBatDau || b.ngayDat);
          return dateB.unix() - dateA.unix();
        })
        .slice(0, 5) // Lấy 5 đặt phòng gần nhất
        .map((booking: any) => {
          // Xác định trạng thái đặt phòng
          let status = 'pending';
          if (booking.trangThai === 2) {
            status = 'confirmed';
          } else if (booking.trangThai === 3) {
            status = 'cancelled';
          } else if (dayjs().isAfter(dayjs(booking.ngayBatDau)) && dayjs().isBefore(dayjs(booking.ngayKetThuc))) {
            status = 'checked_in';
          } else if (dayjs().isAfter(dayjs(booking.ngayKetThuc))) {
            status = 'checked_out';
          }
          
          return {
            id: booking.maDatPhong || booking.id,
            roomNumber: booking.maPhong || booking.soPhong || 'N/A',
            customerName: booking.tenKH || 'Khách hàng',
            checkIn: booking.ngayBatDau || dayjs().format('YYYY-MM-DD'),
            checkOut: booking.ngayKetThuc || dayjs().add(1, 'day').format('YYYY-MM-DD'),
            status: status,
            totalPrice: booking.tongTien || 0
          };
        });
      
      // Trả về dữ liệu đặt phòng gần đây
      return res.status(200).json({
        success: true,
        data: recentBookings
      });
    } catch (error: any) {
      console.error('Error fetching recent bookings:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin đặt phòng gần đây'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
