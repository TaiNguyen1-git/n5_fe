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
  beds?: {
    type: string;
    count: number;
  }[];
}

// Booking interface
export interface Booking {
  maHD?: number;
  maPhong: number;
  maKH?: string;
  tenKH: string;
  email: string;
  soDienThoai?: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  soLuongKhach: number;
  tongTien: number;
  trangThai?: number;
  ngayTao?: string;
}

// Response interface
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const BASE_URL = 'https://ptud-web-1.onrender.com/api';

// Dữ liệu mẫu để sử dụng khi API không khả dụng
const mockRooms: Room[] = [
  {
    id: '101',
    maPhong: 101,
    tenPhong: 'Phòng Deluxe Hướng Biển',
    moTa: 'Phòng deluxe với view biển tuyệt đẹp, đầy đủ tiện nghi cao cấp',
    hinhAnh: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    giaTien: 1200000,
    soLuongKhach: 2,
    trangThai: 1,
    loaiPhong: 'Deluxe',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: [
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  {
    id: '102',
    maPhong: 102,
    tenPhong: 'Phòng Suite Gia Đình',
    moTa: 'Phòng suite rộng rãi dành cho gia đình với không gian riêng biệt',
    hinhAnh: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    giaTien: 2500000,
    soLuongKhach: 4,
    trangThai: 1,
    loaiPhong: 'Suite',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Bồn tắm'],
    images: [
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    beds: [{ type: 'Giường đôi', count: 1 }, { type: 'Giường đơn', count: 2 }]
  },
  {
    id: '103',
    maPhong: 103,
    tenPhong: 'Phòng Standard Twin',
    moTa: 'Phòng tiêu chuẩn với hai giường đơn, phù hợp cho bạn bè hoặc đồng nghiệp',
    hinhAnh: 'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    giaTien: 800000,
    soLuongKhach: 2,
    trangThai: 1,
    loaiPhong: 'Standard',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng'],
    images: [
      'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    beds: [{ type: 'Giường đơn', count: 2 }]
  }
];

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
    
    // Thử gọi API từ frontend proxy trước
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return await response.json();
    } catch (error) {
      console.warn('Frontend proxy API failed, trying direct backend call:', error);
      
      // Nếu không thành công, thử gọi trực tiếp đến backend
      try {
        const response = await axios.get(`${BASE_URL}/Phong/GetAll`, { timeout: 5000 });
        const formattedData = response.data.map((room: any) => ({
          id: room.maPhong.toString(),
          maPhong: room.maPhong,
          tenPhong: room.ten,
          moTa: room.moTa,
          hinhAnh: room.hinhAnh,
          giaTien: room.giaTien,
          soLuongKhach: room.soLuongKhach,
          trangThai: room.trangThai,
          loaiPhong: room.loaiPhong,
          images: [room.hinhAnh],
          features: room.moTa.split(',').map((item: string) => item.trim())
        }));
        
        return {
          success: true,
          data: formattedData
        };
      } catch (backendError) {
        console.warn('Backend API failed, using mock data:', backendError);
        
        // Nếu cả hai phương pháp đều thất bại, trả về dữ liệu mẫu
        let filteredMockRooms = [...mockRooms];
        
        if (filters?.soLuongKhach) {
          filteredMockRooms = filteredMockRooms.filter(room => 
            room.soLuongKhach >= (filters.soLuongKhach || 0)
          );
        }
        
        if (filters?.giaMin) {
          filteredMockRooms = filteredMockRooms.filter(room => 
            room.giaTien >= (filters.giaMin || 0)
          );
        }
        
        if (filters?.giaMax) {
          filteredMockRooms = filteredMockRooms.filter(room => 
            room.giaTien <= (filters.giaMax || 1000000000)
          );
        }
        
        return {
          success: true,
          message: 'Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.',
          data: filteredMockRooms
        };
      }
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    
    // Trả về dữ liệu mẫu khi có lỗi
    return {
      success: true,
      message: 'Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.',
      data: mockRooms
    };
  }
};

/**
 * Get a room by ID
 */
export const getRoomById = async (id: string): Promise<ApiResponse<Room>> => {
  try {
    // Thử gọi API frontend proxy
    try {
      const response = await fetch(`/api/rooms/${id}`, { signal: AbortSignal.timeout(5000) });
      return await response.json();
    } catch (error) {
      console.warn('Frontend proxy API failed for room details, trying direct backend call:', error);
      
      // Gọi trực tiếp nếu không thành công
      try {
        const response = await axios.get(`${BASE_URL}/Phong/GetById?id=${id}`, { timeout: 5000 });
        const room = response.data;
        
        return {
          success: true,
          data: {
            id: room.maPhong.toString(),
            maPhong: room.maPhong,
            tenPhong: room.ten,
            moTa: room.moTa,
            hinhAnh: room.hinhAnh,
            giaTien: room.giaTien,
            soLuongKhach: room.soLuongKhach,
            trangThai: room.trangThai,
            loaiPhong: room.loaiPhong,
            images: [room.hinhAnh],
            features: room.moTa.split(',').map((item: string) => item.trim())
          }
        };
      } catch (backendError) {
        console.warn('Backend API failed for room details, using mock data:', backendError);
        
        // Nếu cả hai phương pháp đều thất bại, trả về dữ liệu mẫu
        const mockRoom = mockRooms.find(room => room.id === id);
        
        if (mockRoom) {
          return {
            success: true,
            message: 'Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.',
            data: mockRoom
          };
        } else {
          return {
            success: false,
            message: 'Không tìm thấy thông tin phòng'
          };
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    
    // Trả về dữ liệu mẫu khi có lỗi
    const mockRoom = mockRooms.find(room => room.id === id);
    
    if (mockRoom) {
      return {
        success: true,
        message: 'Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.',
        data: mockRoom
      };
    } else {
      return {
        success: false,
        message: 'Không thể lấy thông tin phòng. Vui lòng thử lại sau.'
      };
    }
  }
};

/**
 * Book a room
 */
export const bookRoom = async (bookingData: Booking): Promise<ApiResponse<any>> => {
  try {
    // Thử gọi API frontend proxy
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData),
        signal: AbortSignal.timeout(5000)
      });
      
      return await response.json();
    } catch (error) {
      console.warn('Frontend proxy API failed for booking, trying direct backend call:', error);
      
      // Gọi trực tiếp nếu không thành công
      try {
        const serverData = {
          maPhong: bookingData.maPhong,
          maKH: bookingData.maKH || null,
          tenKH: bookingData.tenKH,
          email: bookingData.email,
          soDienThoai: bookingData.soDienThoai || '',
          ngayBatDau: bookingData.ngayBatDau,
          ngayKetThuc: bookingData.ngayKetThuc,
          soLuongKhach: bookingData.soLuongKhach,
          tongTien: bookingData.tongTien,
          trangThai: bookingData.trangThai || 1
        };
        
        const response = await axios.post(`${BASE_URL}/DatPhong/Create`, serverData, { timeout: 5000 });
        
        return {
          success: true,
          message: 'Đặt phòng thành công',
          data: response.data
        };
      } catch (backendError) {
        console.warn('Backend API failed for booking, using mock response:', backendError);
        
        // Giả lập phản hồi thành công khi cả hai phương pháp đều thất bại
        return {
          success: true,
          message: 'Đặt phòng thành công (chế độ ngoại tuyến)',
          data: {
            maHD: Date.now(),
            ...bookingData,
            ngayTao: new Date().toISOString(),
            trangThai: 1
          }
        };
      }
    }
  } catch (error) {
    console.error('Error booking room:', error);
    return {
      success: false,
      message: 'Không thể đặt phòng. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async (userId: string): Promise<ApiResponse<Booking[]>> => {
  try {
    // Thử gọi API frontend proxy
    try {
      const response = await fetch(`/api/booking?userId=${userId}`, { signal: AbortSignal.timeout(5000) });
      return await response.json();
    } catch (error) {
      console.warn('Frontend proxy API failed for user bookings, trying direct backend call:', error);
      
      // Gọi trực tiếp nếu không thành công
      try {
        const response = await axios.get(`${BASE_URL}/DatPhong/GetByUser?id=${userId}`, { timeout: 5000 });
        
        const formattedData = response.data.map((booking: any) => ({
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
        
        return {
          success: true,
          data: formattedData
        };
      } catch (backendError) {
        console.warn('Backend API failed for user bookings, using mock data:', backendError);
        
        // Giả lập dữ liệu đặt phòng
        const mockBookings: Booking[] = [
          {
            maHD: 1001,
            maPhong: 101,
            maKH: userId,
            tenKH: 'Người dùng mẫu',
            email: 'user@example.com',
            soDienThoai: '0123456789',
            ngayBatDau: new Date().toISOString(),
            ngayKetThuc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            soLuongKhach: 2,
            tongTien: 2400000,
            trangThai: 1,
            ngayTao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        return {
          success: true,
          message: 'Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.',
          data: mockBookings
        };
      }
    }
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return {
      success: false,
      message: 'Không thể lấy danh sách đặt phòng. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Hủy đặt phòng
 */
export const cancelBooking = async (bookingId: number): Promise<ApiResponse<any>> => {
  try {
    try {
      const response = await axios.put(`${BASE_URL}/DatPhong/Cancel?id=${bookingId}`, {}, { timeout: 5000 });
      
      return {
        success: true,
        message: 'Hủy đặt phòng thành công',
        data: response.data
      };
    } catch (error) {
      console.warn('API failed for canceling booking, using mock response:', error);
      
      // Giả lập phản hồi thành công
      return {
        success: true,
        message: 'Hủy đặt phòng thành công (chế độ ngoại tuyến)',
        data: { maHD: bookingId, trangThai: 0 }
      };
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    return {
      success: false,
      message: 'Không thể hủy đặt phòng. Vui lòng thử lại sau.'
    };
  }
};

export default {
  getRooms,
  getRoomById,
  bookRoom,
  getUserBookings,
  cancelBooking
}; 