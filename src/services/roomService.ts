// Room and booking service for API calls

import axios from 'axios';

// Room interface
export interface Room {
  id?: string;
  maPhong?: number;
  tenPhong: string;
  moTa: string;
  hinhAnh: string;
  giaTien: number;
  soLuongKhach: number;
  trangThai: number;
  loaiPhong?: string;
  images?: string[];
  features?: string[];
  soPhong?: string;
  beds?: {
    type: string;
    count: number;
  }[];
}

// Booking interface
export interface Booking {
  maHD?: number;
  maPhong: number;
  maKH?: number | string | null;
  tenKH?: string;
  email?: string;
  soDienThoai?: string;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  soLuongKhach?: number;
  tongTien?: number;
  trangThai?: number;
  ngayTao?: string;
  ngayDat?: string;
  checkIn?: string;
  checkOut?: string;
  xoa?: boolean;
}

// Response interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const BASE_URL = 'https://ptud-web-1.onrender.com/api';

/**
 * Get all rooms with optional filtering
 */
export const getRooms = async (
  filters?: { giaMin?: number; giaMax?: number; soLuongKhach?: number }
): Promise<ApiResponse<Room[]>> => {
  try {
    let url = '/api/rooms';

    // Add query parameters if filters exist
    if (filters) {
      const params = new URLSearchParams();
      if (filters.giaMin) params.append('giaMin', filters.giaMin.toString());
      if (filters.giaMax) params.append('giaMax', filters.giaMax.toString());
      if (filters.soLuongKhach) params.append('soLuongKhach', filters.soLuongKhach.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

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
      console.warn('Frontend proxy API failed, trying direct backend call:', error);

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
    console.error('Error fetching rooms:', error);

    // Không sử dụng cache fallback

    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.',
      data: []
    };
  }
};

/**
 * Get a room by ID
 */
export const getRoomById = async (id: string) => {
  console.log(`Fetching room with ID: ${id}`);
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
      console.log(`Gọi API với mã phòng: ${id}`);

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

      // Chuyển đổi dữ liệu từ backend sang định dạng frontend cần
      const formattedData = {
        id: roomData.maPhong?.toString() || '0',
        maPhong: roomData.maPhong || 0,
        tenPhong: roomData.ten || '',
        moTa: roomData.moTa || '',
        hinhAnh: roomData.hinhAnh || '',
        giaTien: roomData.giaTien || 0,
        soLuongKhach: roomData.soLuongKhach || 1,
        trangThai: roomData.trangThai || 0,
        loaiPhong: roomData.loaiPhong || '',
        images: roomData.hinhAnh ? [roomData.hinhAnh] : [],
        features: roomData.moTa ? roomData.moTa.split(',').map((item: string) => item.trim()) : []
      };

      // Không lưu cache

      return {
        success: true,
        data: formattedData
      };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;

      if (retryCount < maxRetries) {
        // Chờ trước khi thử lại (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  }

  console.log('All fetch attempts failed, trying axios as fallback');

  // Thử sử dụng axios với API route trung gian
  try {
    // Sử dụng mã phòng nguyên bản
    console.log(`Fallback: Gọi API với mã phòng: ${id}`);

    // Sử dụng API route trung gian để tránh lỗi CORS
    const axiosResponse = await axios.get(`/api/room-detail?roomNumber=${id}`, {
      timeout: 20000 // 20 giây timeout
    });

    const roomData = axiosResponse.data;

    // Chuyển đổi dữ liệu từ backend sang định dạng frontend cần
    const formattedData = {
      id: roomData.maPhong.toString(),
      maPhong: roomData.maPhong,
      tenPhong: roomData.ten,
      moTa: roomData.moTa,
      hinhAnh: roomData.hinhAnh,
      giaTien: roomData.giaTien,
      soLuongKhach: roomData.soLuongKhach,
      trangThai: roomData.trangThai,
      loaiPhong: roomData.loaiPhong,
      images: [roomData.hinhAnh],
      features: roomData.moTa.split(',').map((item: string) => item.trim())
    };

    // Không lưu cache

    return {
      success: true,
      data: formattedData
    };
  } catch (axiosError) {
    console.error('Direct backend call also failed:', axiosError);

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
    console.log('Original booking data:', JSON.stringify(bookingData, null, 2));

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
      ngayBD: bookingData.checkIn || bookingData.ngayBatDau, // Sử dụng ngayBD thay vì checkIn
      ngayKT: bookingData.checkOut || bookingData.ngayKetThuc, // Sử dụng ngayKT thay vì checkOut
      trangThai: 1, // Đang xử lý
      xoa: false
    };

    // Log thông tin đặt phòng để debug
    console.log('Sending booking data to API:', serverData);

    // Gọi API proxy thay vì gọi trực tiếp
    console.log('Calling booking API with data:', JSON.stringify(serverData, null, 2));

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
          console.log(`Trying to book room with URL: ${url}`);
          response = await axios.post(url, serverData, {
            timeout: 15000, // 15 giây timeout
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*'
            }
          });

          // Nếu thành công, thoát khỏi vòng lặp
          if (response && response.status >= 200 && response.status < 300) {
            console.log(`Successfully booked room with URL: ${url}`);
            break;
          }
        } catch (err: any) {
          console.error(`Error booking room with URL ${url}:`, err.message);
          error = err;
          // Tiếp tục thử URL tiếp theo
        }
      }

      // Nếu không có response thành công, ném lỗi cuối cùng
      if (!response) {
        throw error || new Error('Failed to book room with all available URLs');
      }

      console.log('Booking response status:', response.status);
      console.log('Booking response data:', JSON.stringify(response.data, null, 2));

      // Kiểm tra xem response có chứa dữ liệu đặt phòng không
      if (!response.data) {
        console.warn('API response missing data:', response.data);
      }

      // Xử lý dữ liệu phản hồi từ proxy API
      const responseData = response.data?.data || response.data;

      console.log('Processed response data:', responseData);

      return {
        success: true,
        message: 'Đặt phòng thành công',
        data: responseData
      };
    } catch (error: any) {
      console.error('Error in booking API call:', error);

      // Trả về response lỗi
      return {
        success: false,
        message: error.message || 'Không thể đặt phòng. Vui lòng thử lại sau.'
      };
    }
  } catch (error) {
    console.error('Error booking room:', error);

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
    console.log(`Fetching bookings for user ID: ${userId}`);

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

    console.log('Booking API response:', response.status);

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
      console.warn('Unexpected API response format:', response.data);
      return {
        success: false,
        message: 'Định dạng dữ liệu không hợp lệ',
        data: []
      };
    }
  } catch (error) {
    console.error('Error fetching user bookings:', error);

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
    console.error('Error canceling booking:', error);

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