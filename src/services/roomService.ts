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
      const data = await response.json();
      
      // Cache the rooms data in localStorage
      if (data.success && data.data && data.data.length > 0) {
        try {
          localStorage.setItem('cached_rooms', JSON.stringify(data.data));
          localStorage.setItem('rooms_cache_time', new Date().toISOString());
        } catch (cacheError) {
          console.warn('Error caching rooms data:', cacheError);
        }
      }
      
      return data;
    } catch (error) {
      console.warn('Frontend proxy API failed, trying direct backend call:', error);
      
      // Nếu không thành công, thử gọi trực tiếp đến backend
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
      
      // Cache the rooms data in localStorage
      try {
        localStorage.setItem('cached_rooms', JSON.stringify(formattedData));
        localStorage.setItem('rooms_cache_time', new Date().toISOString());
      } catch (cacheError) {
        console.warn('Error caching rooms data:', cacheError);
      }
      
      return {
        success: true,
        data: formattedData
      };
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    
    // Try to get cached data if available
    if (typeof window !== 'undefined') {
      try {
        const cachedRoomsStr = localStorage.getItem('cached_rooms');
        const cacheTime = localStorage.getItem('rooms_cache_time');
        
        if (cachedRoomsStr) {
          const cachedRooms = JSON.parse(cachedRoomsStr);
          
          // Apply filters to cached data if needed
          let filteredRooms = cachedRooms;
          if (filters) {
            filteredRooms = cachedRooms.filter((room: Room) => {
              let matches = true;
              if (filters.giaMin) matches = matches && room.giaTien >= filters.giaMin;
              if (filters.giaMax) matches = matches && room.giaTien <= filters.giaMax;
              if (filters.soLuongKhach) matches = matches && room.soLuongKhach >= filters.soLuongKhach;
              return matches;
            });
          }
          
          return {
            success: true,
            data: filteredRooms,
            message: cacheTime ? 
              `Dữ liệu được tải từ bộ nhớ đệm (cập nhật lần cuối: ${new Date(cacheTime).toLocaleString()}).` : 
              'Dữ liệu được tải từ bộ nhớ đệm.'
          };
        }
      } catch (cacheError) {
        console.error('Error reading from cache:', cacheError);
      }
    }
    
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
export const getRoomById = async (id: string): Promise<ApiResponse<Room>> => {
  let retryCount = 0;
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second
  
  const attemptFetch = async (): Promise<ApiResponse<Room>> => {
    try {
      // Thử gọi API frontend proxy
      try {
        const response = await fetch(`/api/rooms/${id}`, { 
          signal: AbortSignal.timeout(5000),
          headers: { 'Cache-Control': 'no-cache' }
        });
        return await response.json();
      } catch (error) {
        console.warn('Frontend proxy API failed for room details, trying direct backend call:', error);
        
        // Gọi trực tiếp nếu không thành công
        try {
          const response = await axios.get(`${BASE_URL}/Phong/GetById?id=${id}`, { 
            timeout: 8000,
            headers: { 'Cache-Control': 'no-cache' }
          });
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
        } catch (axiosError) {
          console.error('Both API calls failed:', axiosError);
          throw axiosError;
        }
      }
    } catch (error) {
      // Check if we should retry
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} for room ${id}...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptFetch();
      }
      
      console.error(`Error fetching room ${id} after ${retryCount} retries:`, error);
      
      // If we've run out of retries, check if we have this room cached in localStorage
      if (typeof window !== 'undefined') {
        try {
          const cachedRoomsStr = localStorage.getItem('cached_rooms');
          if (cachedRoomsStr) {
            const cachedRooms = JSON.parse(cachedRoomsStr);
            const cachedRoom = cachedRooms.find((room: Room) => room.id === id || room.maPhong === parseInt(id));
            
            if (cachedRoom) {
              console.log('Found cached room data:', cachedRoom);
              return {
                success: true,
                data: cachedRoom,
                message: 'Dữ liệu phòng đang được tải từ bộ nhớ đệm. Một số thông tin có thể không được cập nhật.'
              };
            }
          }
        } catch (cacheError) {
          console.error('Error reading from cache:', cacheError);
        }
      }
      
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
      };
    }
  };
  
  return attemptFetch();
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
      
      const response = await axios.post(`${BASE_URL}/DatPhong/Create`, serverData, { timeout: 8000 });
      
      return {
        success: true,
        message: 'Đặt phòng thành công',
        data: response.data
      };
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
      const response = await axios.get(`${BASE_URL}/DatPhong/GetByUser?id=${userId}`, { timeout: 8000 });
      
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
    }
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return {
      success: false,
      message: 'Không thể lấy danh sách đặt phòng. Vui lòng kiểm tra kết nối internet và thử lại sau.',
      data: []
    };
  }
};

/**
 * Hủy đặt phòng
 */
export const cancelBooking = async (bookingId: number): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(`${BASE_URL}/DatPhong/Cancel?id=${bookingId}`, {}, { timeout: 8000 });
    
    return {
      success: true,
      message: 'Hủy đặt phòng thành công',
      data: response.data
    };
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