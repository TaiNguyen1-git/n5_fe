import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// API backend URLs
const BACKEND_API_URLS = [
  'https://ptud-web-1.onrender.com/api',
  'https://ptud-web-3.onrender.com/api'
];
const BACKEND_API_URL = BACKEND_API_URLS[0];

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
    if (!bookingData.maPhong) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã phòng'
      });
    }

    // Kiểm tra mã phòng hợp lệ
    if (bookingData.maPhong === 0 || isNaN(bookingData.maPhong)) {
      console.error('Invalid room ID:', bookingData.maPhong);
      return res.status(400).json({
        success: false,
        message: 'Mã phòng không hợp lệ'
      });
    }

    // Log thông tin phòng
    console.log('Room ID:', bookingData.maPhong, 'Type:', typeof bookingData.maPhong);

    // Kiểm tra ngày check-in và check-out
    if (!bookingData.ngayBD && !bookingData.checkIn && !bookingData.ngayBatDau) {
      console.error('Missing check-in date');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày nhận phòng'
      });
    }

    if (!bookingData.ngayKT && !bookingData.checkOut && !bookingData.ngayKetThuc) {
      console.error('Missing check-out date');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày trả phòng'
      });
    }

    // Log thông tin ngày
    console.log('Check-in date:', bookingData.ngayBD || bookingData.checkIn || bookingData.ngayBatDau);
    console.log('Check-out date:', bookingData.ngayKT || bookingData.checkOut || bookingData.ngayKetThuc);

    // Đảm bảo soLuongKhach có giá trị
    bookingData.soLuongKhach = bookingData.soLuongKhach || 1;

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

    // Nếu không có maKH hoặc maKH là null, tạo khách hàng mới
    if (!bookingData.maKH || bookingData.maKH === null) {
      try {
        console.log('Không có maKH, tạo khách hàng mới');

        // Chuẩn bị dữ liệu khách hàng theo đúng cấu trúc API yêu cầu
        const customerData = {
          tenKH: bookingData.tenKH || "Khách hàng",
          email: bookingData.email || "guest@example.com",
          phone: bookingData.soDienThoai || "",
          maVaiTro: 3, // Khách hàng
          xoa: false
        };

        console.log('Customer data being sent to API:', JSON.stringify(customerData, null, 2));
        console.log('Customer API URL:', `${BACKEND_API_URL}/KhachHang/Create`);

        // Gọi API tạo khách hàng
        const customerResponse = await axios.post(`${BACKEND_API_URL}/KhachHang/Create`, customerData, {
          timeout: 15000, // 15s timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        console.log('Customer API response status:', customerResponse.status);
        console.log('Customer API response data:', JSON.stringify(customerResponse.data, null, 2));

        // Nếu tạo khách hàng thành công, lấy ID khách hàng
        if (customerResponse.data && customerResponse.data.maKH) {
          bookingData.maKH = customerResponse.data.maKH;
          console.log('Đã tạo khách hàng mới với ID:', bookingData.maKH);
        } else {
          console.warn('Customer API response does not contain maKH:', customerResponse.data);

          // Kiểm tra cấu trúc dữ liệu phản hồi khác
          if (customerResponse.data && typeof customerResponse.data === 'object') {
            // Tìm kiếm trường có thể chứa ID khách hàng
            const possibleIdFields = ['id', 'maKH', 'customerId', 'customerID', 'customer_id'];
            for (const field of possibleIdFields) {
              if (customerResponse.data[field]) {
                bookingData.maKH = customerResponse.data[field];
                console.log(`Found customer ID in field '${field}':`, bookingData.maKH);
                break;
              }
            }
          }
        }
      } catch (customerError) {
        console.error('Lỗi khi tạo khách hàng mới:', customerError);
        if (axios.isAxiosError(customerError) && customerError.response) {
          console.error('Customer API error response:', customerError.response.status, customerError.response.data);
        }
        // Tiếp tục đặt phòng mà không có maKH
      }
    }

    // Chuẩn bị dữ liệu đặt phòng cuối cùng theo đúng cấu trúc API yêu cầu
    const finalBookingData = {
      maKH: bookingData.maKH ? (typeof bookingData.maKH === 'string' ? parseInt(bookingData.maKH) : bookingData.maKH) : 0,
      maPhong: parseInt(bookingData.maPhong.toString()),
      ngayDat: new Date().toISOString(),
      ngayBD: bookingData.checkIn || bookingData.ngayBatDau, // Sử dụng ngayBD thay vì checkIn
      ngayKT: bookingData.checkOut || bookingData.ngayKetThuc, // Sử dụng ngayKT thay vì checkOut
      trangThai: 1, // Đang xử lý
      xoa: false
    };

    console.log('Final booking data being sent to API:', JSON.stringify(finalBookingData, null, 2));

    // Gọi API backend để đặt phòng - thử nhiều URL
    let lastError = null;
    let bookingResponse = null;

    // Thử từng URL API
    for (const baseUrl of BACKEND_API_URLS) {
      try {
        console.log(`Trying booking API with URL: ${baseUrl}/DatPhong/Create`);

        const response = await axios.post(`${baseUrl}/DatPhong/Create`, finalBookingData, {
          timeout: 30000, // 30s timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        console.log(`Booking API response from ${baseUrl}:`, response.status);

        // Nếu thành công, lưu response và thoát vòng lặp
        bookingResponse = response;
        break;
      } catch (bookingError: any) {
        console.error(`Error from booking API ${baseUrl}:`, bookingError.message);
        if (axios.isAxiosError(bookingError) && bookingError.response) {
          console.error('Booking API error response:', bookingError.response.status, bookingError.response.data);
        }
        lastError = bookingError;
        // Tiếp tục thử URL tiếp theo
      }
    }

    // Nếu không có API call nào thành công, ném lỗi cuối cùng
    if (!bookingResponse) {
      throw lastError || new Error('Tất cả các API endpoint đều thất bại');
    }

    // Trả về kết quả từ API backend thành công
    return res.status(200).json({
      success: true,
      message: 'Đặt phòng thành công',
      data: bookingResponse.data
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