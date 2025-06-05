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
      // Gọi API để lấy thông tin đặt phòng với pageSize lớn để lấy tất cả
      const bookingsResponse = await axios.get(`${BACKEND_API_URL}/DatPhong/GetAll`, {
        params: {
          pageSize: 1000 // Lấy nhiều bookings để đảm bảo có booking mới nhất
        },
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

      // Lọc và sắp xếp dữ liệu đặt phòng
      const filteredBookings = bookings
        .filter((booking: any) => !booking.xoa) // Chỉ lấy những đặt phòng chưa bị xóa
        .sort((a: any, b: any) => {
          // Sắp xếp theo ngày đặt phòng mới nhất (ngayDat)
          const dateA = dayjs(a.ngayDat);
          const dateB = dayjs(b.ngayDat);
          return dateB.unix() - dateA.unix();
        })
        .slice(0, 10); // Lấy 10 đặt phòng gần nhất

      // Fetch thông tin khách hàng cho từng đặt phòng
      const recentBookings = await Promise.all(
        filteredBookings.map(async (booking: any) => {
          // Xác định trạng thái đặt phòng theo mã trạng thái API
          let status = 'pending';
          switch(booking.trangThai) {
            case 1:
              status = 'pending'; // Chờ xác nhận
              break;
            case 2:
              status = 'confirmed'; // Đã xác nhận
              break;
            case 3:
              status = 'checked_in'; // Đã nhận phòng
              break;
            case 4:
              status = 'checked_out'; // Đã trả phòng
              break;
            case 5:
              status = 'cancelled'; // Đã hủy
              break;
            case 6:
              status = 'cancelled'; // Không đến
              break;
            default:
              // Xác định trạng thái dựa trên thời gian nếu không có mã trạng thái rõ ràng
              if (booking.checkOut && dayjs().isAfter(dayjs(booking.checkOut))) {
                status = 'checked_out';
              } else if (booking.checkIn && dayjs().isAfter(dayjs(booking.checkIn)) &&
                         booking.checkOut && dayjs().isBefore(dayjs(booking.checkOut))) {
                status = 'checked_in';
              } else {
                status = 'pending';
              }
          }

          // Lấy tên khách hàng từ API nếu có maKH
          let customerName = 'Khách hàng';
          if (booking.maKH) {
            try {
              const customerResponse = await axios.get(`${BACKEND_API_URL}/KhachHang/GetById/${booking.maKH}`, {
                timeout: 5000
              });

              if (customerResponse.data && customerResponse.data.value && customerResponse.data.value.tenKH) {
                customerName = customerResponse.data.value.tenKH;
              }
            } catch (error) {
              // Fallback to existing name fields
              customerName = booking.tenKH || booking.khachHang?.tenKH || `Khách hàng ${booking.maKH}`;
            }
          } else {
            // Sử dụng tên có sẵn nếu không có maKH
            customerName = booking.tenKH || booking.khachHang?.tenKH || 'Khách hàng';
          }

          // Lấy thông tin phòng từ API nếu có maPhong
          let roomNumber = booking.maPhong?.toString() || booking.soPhong || 'N/A';
          if (booking.maPhong) {
            try {
              const roomResponse = await axios.get(`${BACKEND_API_URL}/Phong/GetById/${booking.maPhong}`, {
                timeout: 5000
              });

              if (roomResponse.data && roomResponse.data.value) {
                const room = roomResponse.data.value;
                roomNumber = room.soPhong || room.maPhong?.toString() || booking.maPhong.toString();
              }
            } catch (error) {
              // Fallback to existing room fields
              roomNumber = booking.soPhong || booking.maPhong?.toString() || 'N/A';
            }
          }

          return {
            id: booking.maDatPhong || booking.id || Math.random(),
            roomNumber: roomNumber,
            customerName: customerName,
            checkIn: booking.checkIn || dayjs(booking.ngayDat).format('YYYY-MM-DD'),
            checkOut: booking.checkOut || dayjs(booking.ngayDat).add(1, 'day').format('YYYY-MM-DD'),
            status: status,
            totalPrice: booking.tongTien || booking.giaTien || 0,
            bookingDate: booking.ngayDat // Thêm ngày đặt phòng để hiển thị
          };
        })
      );

      // Trả về dữ liệu đặt phòng gần đây
      return res.status(200).json({
        success: true,
        data: recentBookings
      });
    } catch (error: any) {
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
