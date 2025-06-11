// Room and booking service for API calls

import axios from 'axios';

// Room interface
export interface Room {
  id?: string;              // ID phòng
  maPhong?: number;         // Mã phòng
  tenPhong: string;         // Tên phòng
  moTa: string;             // Mô tả phòng
  hinhAnh: string;          // Hình ảnh phòng
  giaTien: number;          // Giá tiền
  soLuongKhach: number;     // Số lượng khách
  trangThai: number;        // Trạng thái phòng
  loaiPhong?: string;       // Loại phòng
  images?: string[];        // Danh sách hình ảnh
  features?: string[];      // Các tiện nghi
  soPhong?: string;         // Số phòng
  beds?: {                  // Thông tin giường
    type: string;           // Loại giường
    count: number;          // Số lượng giường
  }[];
}

// Booking interface
export interface Booking {
  maHD?: number;            // Mã hóa đơn
  maPhong: number;          // Mã phòng
  maKH?: number | string | null; // Mã khách hàng
  tenKH?: string;           // Tên khách hàng
  email?: string;           // Email
  soDienThoai?: string;     // Số điện thoại
  ngayBatDau?: string;      // Ngày bắt đầu
  ngayKetThuc?: string;     // Ngày kết thúc
  soLuongKhach?: number;    // Số lượng khách
  tongTien?: number;        // Tổng tiền
  trangThai?: number;       // Trạng thái
  ngayTao?: string;         // Ngày tạo
  ngayDat?: string;         // Ngày đặt
  checkIn?: string;         // Ngày nhận phòng
  checkOut?: string;        // Ngày trả phòng
  xoa?: boolean;            // Trạng thái xóa
}

// Response interface
export interface ApiResponse<T> {
  success: boolean;         // Trạng thái thành công
  message?: string;         // Thông báo
  data?: T;                 // Dữ liệu
}

// Sử dụng proxy thay vì direct API call
const BASE_URL = '/api';

// Define interface for paginated response
export interface PaginatedRoomResponse {
  items: Room[];            // Danh sách phòng
  totalItems: number;       // Tổng số phòng
  pageNumber: number;       // Số trang hiện tại
  pageSize: number;         // Số phòng mỗi trang
  totalPages: number;       // Tổng số trang
}

/**
 * Get all rooms with optional filtering and pagination
 */
export const getRooms = async (
  filters?: { giaMin?: number; giaMax?: number; soLuongKhach?: number },
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedRoomResponse>> => {
  try {
    let url = '/api/rooms';

    // Add query parameters for pagination and filters
    const params = new URLSearchParams();

    // Add pagination parameters
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    // Add filter parameters if they exist
    if (filters) {
      if (filters.giaMin) params.append('giaMin', filters.giaMin.toString());
      if (filters.giaMax) params.append('giaMax', filters.giaMax.toString());
      if (filters.soLuongKhach) params.append('soLuongKhach', filters.soLuongKhach.toString());
    }

    url += `?${params.toString()}`;

    // Không sử dụng cache

    // Thử gọi API từ frontend proxy trước
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),  // Tăng timeout lên 15 giây
        headers: { 'Cache-Control': 'no-store' }
      });
      const data = await response.json();

      // Không lưu cache

      return data;
    } catch (error) {


      // Nếu không thành công, thử gọi trực tiếp đến backend
      const response = await axios.get(`${BASE_URL}/Phong/GetAll`, {
        timeout: 20000, // Tăng timeout lên 20 giây
        headers: { 'Cache-Control': 'no-store' }
      });
      const formattedData = response.data.map((room: any) => {
        // Lấy giá từ loaiPhong.giaPhong nếu có
        const roomPrice = room.giaTien || (room.loaiPhong && room.loaiPhong.giaPhong) || null;

        return {
          id: room.maPhong.toString(),
          maPhong: room.maPhong,
          tenPhong: room.ten || (room.soPhong ? `Phòng ${room.soPhong}` : ''),
          moTa: room.moTa || 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản',
          hinhAnh: room.hinhAnh || '/images/rooms/default-room.jpg',
          giaTien: roomPrice,
          soLuongKhach: room.soNguoi || room.soLuongKhach || 2,
          trangThai: room.trangThai || 1,
          loaiPhong: room.tenLoaiPhong || (room.loaiPhong && room.loaiPhong.tenLoai) || 'Standard',
          images: [room.hinhAnh || '/images/rooms/default-room.jpg'],
          features: room.moTa ? room.moTa.split(',').map((item: string) => item.trim()) : ['Wi-Fi miễn phí', 'Điều hòa', 'TV', 'Tủ lạnh']
        };
      });

      // Không lưu cache

      return {
        success: true,
        data: formattedData
      };
    }
  } catch (error) {

    // Không sử dụng cache fallback

    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.',
      data: {
        items: [],
        totalItems: 0,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: 0
      }
    };
  }
};

/**
 * Get all rooms without pagination (for backward compatibility)
 */
export const getRoomsNoPagination = async (
  filters?: { giaMin?: number; giaMax?: number; soLuongKhach?: number }
): Promise<ApiResponse<Room[]>> => {
  try {
    const response = await getRooms(filters, 1, 1000); // Get a large page

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch rooms',
      data: []
    };
  } catch (error) {
    return {
      success: false,
      message: 'Không thể lấy danh sách phòng',
      data: []
    };
  }
};

/**
 * Get a room by ID
 */
export const getRoomById = async (id: string) => {
  let retryCount = 0;
  const maxRetries = 3;

  const fetchWithTimeout = async (url: string, options: any, timeout: number) => {
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Không sử dụng cache

  while (retryCount < maxRetries) {
    try {
      // Sử dụng mã phòng nguyên bản

      // Sử dụng API route trung gian để tránh lỗi CORS
      const response = await fetchWithTimeout(`/api/room-detail?roomNumber=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, 15000); // 15 giây timeout

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const roomData = await response.json();

      // API trả về có cấu trúc { success: true, data: {...} }
      const actualRoomData = roomData.data || roomData;

      // Chuyển đổi dữ liệu từ backend sang định dạng frontend cần
      const formattedData = {
        id: actualRoomData.maPhong?.toString() || actualRoomData.id?.toString() || '0',
        maPhong: actualRoomData.maPhong || actualRoomData.id || 0,
        tenPhong: actualRoomData.tenPhong || actualRoomData.ten || '',
        moTa: actualRoomData.moTa || '',
        hinhAnh: actualRoomData.hinhAnh || '/images/rooms/default-room.jpg',
        giaTien: actualRoomData.giaTien || 0,
        soLuongKhach: actualRoomData.soLuongKhach || 1,
        trangThai: actualRoomData.trangThai || 0,
        loaiPhong: actualRoomData.loaiPhong || '',
        images: actualRoomData.hinhAnh ? [actualRoomData.hinhAnh] : ['/images/rooms/default-room.jpg'],
        features: actualRoomData.features || (actualRoomData.moTa ? actualRoomData.moTa.split(',').map((item: string) => item.trim()) : [])
      };

      // Không lưu cache

      return {
        success: true,
        data: formattedData
      };
    } catch (error) {
      retryCount++;

      if (retryCount < maxRetries) {
        // Chờ trước khi thử lại (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  }

  // Thử sử dụng axios với API route trung gian
  try {
    // Sử dụng mã phòng nguyên bản

    // Sử dụng API route trung gian để tránh lỗi CORS
    const axiosResponse = await axios.get(`/api/room-detail?roomNumber=${id}`, {
      timeout: 20000 // 20 giây timeout
    });

    const roomData = axiosResponse.data;

    // API trả về có cấu trúc { success: true, data: {...} }
    const actualRoomData = roomData.data || roomData;

    // Chuyển đổi dữ liệu từ backend sang định dạng frontend cần
    const formattedData = {
      id: actualRoomData.maPhong?.toString() || actualRoomData.id?.toString() || '0',
      maPhong: actualRoomData.maPhong || actualRoomData.id || 0,
      tenPhong: actualRoomData.tenPhong || actualRoomData.ten || '',
      moTa: actualRoomData.moTa || '',
      hinhAnh: actualRoomData.hinhAnh || '/images/rooms/default-room.jpg',
      giaTien: actualRoomData.giaTien || 0,
      soLuongKhach: actualRoomData.soLuongKhach || 1,
      trangThai: actualRoomData.trangThai || 0,
      loaiPhong: actualRoomData.tenLoaiPhong || actualRoomData.loaiPhong?.tenLoai || actualRoomData.loaiPhong || '',
      images: actualRoomData.hinhAnh ? [actualRoomData.hinhAnh] : ['/images/rooms/default-room.jpg'],
      features: actualRoomData.features || (actualRoomData.moTa ? actualRoomData.moTa.split(',').map((item: string) => item.trim()) : [])
    };



    // Không lưu cache

    return {
      success: true,
      data: formattedData
    };
  } catch (axiosError) {

    // Không sử dụng cache fallback

    return {
      success: false,
      message: 'Không thể kết nối tới máy chủ sau nhiều lần thử. Vui lòng kiểm tra kết nối mạng và thử lại sau.'
    };
  }
};

/**
 * Book a room
 * API đặt phòng: POST https://ptud-web-1.onrender.com/api/DatPhong/Create
 * Format dữ liệu POST:
 * {
 *   "maPhong": number,
 *   "maKH": number | null,
 *   "tenKH": string,
 *   "email": string,
 *   "soDienThoai": string,
 *   "ngayBatDau": string, // Format: "YYYY-MM-DD"
 *   "ngayKetThuc": string, // Format: "YYYY-MM-DD"
 *   "soLuongKhach": number,
 *   "tongTien": number,
 *   "trangThai": number // 1: Đang xử lý, 2: Đã xác nhận, 3: Đã hủy
 * }
 */
export const bookRoom = async (bookingData: Booking): Promise<ApiResponse<any>> => {
  try {
    // Kiểm tra dữ liệu đầu vào

    // Đảm bảo maPhong là số hợp lệ
    let roomId = 0;
    if (bookingData.maPhong) {
      roomId = typeof bookingData.maPhong === 'string' ? parseInt(bookingData.maPhong) : bookingData.maPhong;
    }

    // Đảm bảo roomId không phải là NaN hoặc 0
    if (isNaN(roomId) || roomId === 0) {
      throw new Error('Mã phòng không hợp lệ');
    }

    // Cấu trúc dữ liệu đặt phòng theo đúng cấu trúc API yêu cầu
    const serverData = {
      maKH: bookingData.maKH ? (typeof bookingData.maKH === 'string' ? parseInt(bookingData.maKH) : bookingData.maKH) : 0,
      maPhong: roomId,
      ngayDat: new Date().toISOString(),
      ngayBD: bookingData.ngayBD || bookingData.checkIn || bookingData.ngayBatDau, // Hỗ trợ nhiều tên field
      ngayKT: bookingData.ngayKT || bookingData.checkOut || bookingData.ngayKetThuc, // Hỗ trợ nhiều tên field
      trangThai: 1, // Đang xử lý
      xoa: false
    };

    console.log('🔍 [BookRoom] Booking data sent to API:', serverData);



    try {
      // Thử nhiều URL API khác nhau - ưu tiên sử dụng proxy API
      const API_URLS = [
        '/api/proxy?url=https://ptud-web-1.onrender.com/api/DatPhong/Create', // Proxy API - ưu tiên cao nhất
        '/api/proxy?url=https://ptud-web-3.onrender.com/api/DatPhong/Create', // Proxy API thứ hai
        '/api/book-room', // API handler tùy chỉnh
        '/api/bookings/create', // API handler thứ ba
        '/api/booking' // Sử dụng proxy Next.js
      ];

      let response;
      let error;

      // Thử từng URL cho đến khi thành công
      for (const url of API_URLS) {
        try {
          response = await axios.post(url, serverData, {
            timeout: 15000, // 15 giây timeout
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*'
            }
          });

          // Nếu thành công, thoát khỏi vòng lặp
          if (response && response.status >= 200 && response.status < 300) {
            break;
          }
        } catch (err: any) {
          error = err;
          // Tiếp tục thử URL tiếp theo
        }
      }

      // Nếu không có response thành công, ném lỗi cuối cùng
      if (!response) {
        throw error || new Error('Failed to book room with all available URLs');
      }

      // Xử lý dữ liệu phản hồi từ proxy API
      const responseData = response.data?.data || response.data;

      return {
        success: true,
        message: 'Đặt phòng thành công',
        data: responseData
      };
    } catch (error: any) {

      // Trả về response lỗi
      return {
        success: false,
        message: error.message || 'Không thể đặt phòng. Vui lòng thử lại sau.'
      };
    }
  } catch (error) {

    // Xử lý lỗi cụ thể
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Có response từ server nhưng status code là lỗi
        return {
          success: false,
          message: error.response.data?.message || 'Không thể đặt phòng. Vui lòng kiểm tra thông tin và thử lại.'
        };
      } else if (error.request) {
        // Không nhận được response từ server
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
        };
      }
    }

    return {
      success: false,
      message: 'Không thể đặt phòng. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Get user bookings
 * API lấy danh sách đặt phòng của người dùng: GET /api/booking?userId={userId}
 */
export const getUserBookings = async (userId: string): Promise<ApiResponse<Booking[]>> => {
  try {

    // Sử dụng API handler của Next.js thay vì gọi trực tiếp
    const response = await axios.get(`/api/booking`, {
      params: { userId },
      timeout: 20000, // Tăng timeout lên 20 giây
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });



    // Kiểm tra dữ liệu trả về
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data
      };
    } else if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: 'Định dạng dữ liệu không hợp lệ',
        data: []
      };
    }
  } catch (error) {

    // Xử lý lỗi chi tiết
    if (axios.isAxiosError(error)) {
      // Lỗi mạng
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Kết nối đến máy chủ quá thời gian chờ. Vui lòng thử lại sau.',
          data: []
        };
      }

      // Lỗi không có kết nối
      if (error.code === 'ERR_NETWORK') {
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.',
          data: []
        };
      }

      // Lỗi 404 - Không tìm thấy
      if (error.response?.status === 404) {
        return {
          success: true,
          message: 'Không tìm thấy đặt phòng nào',
          data: []
        };
      }

      // Lỗi 401 - Không có quyền
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Bạn không có quyền truy cập thông tin này. Vui lòng đăng nhập lại.',
          data: []
        };
      }

      // Lỗi khác có response
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`,
          data: []
        };
      }
    }

    // Lỗi chung
    return {
      success: false,
      message: 'Không thể lấy danh sách đặt phòng. Vui lòng thử lại sau.',
      data: []
    };
  }
};

/**
 * Hủy đặt phòng
 * API hủy đặt phòng: PUT https://ptud-web-1.onrender.com/api/DatPhong/Cancel?id={bookingId}
 */
export const cancelBooking = async (bookingId: number): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(`${BASE_URL}/DatPhong/Cancel?id=${bookingId}`, {}, {
      timeout: 15000, // 15 giây timeout
      headers: {
        'Accept': '*/*'
      }
    });

    return {
      success: true,
      message: 'Hủy đặt phòng thành công',
      data: response.data
    };
  } catch (error) {

    // Xử lý lỗi cụ thể
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Không thể hủy đặt phòng. Vui lòng thử lại sau.'
        };
      }
    }

    return {
      success: false,
      message: 'Không thể hủy đặt phòng. Vui lòng thử lại sau.'
    };
  }
};

// API lấy chi tiết phòng: GET https://ptud-web-1.onrender.com/api/Phong/GetById?id={roomId}
// API lấy danh sách phòng: GET https://ptud-web-1.onrender.com/api/Phong/GetAll
// API lấy danh sách phòng theo loại: GET https://ptud-web-1.onrender.com/api/Phong/GetByLoai?id={loaiId}
// API tìm kiếm phòng trống: GET https://ptud-web-1.onrender.com/api/Phong/SearchEmpty?ngayBD={ngayBD}&ngayKT={ngayKT}

export default {
  getRooms,
  getRoomById,
  bookRoom
};