import axios from 'axios';
import dayjs from 'dayjs';
import { serviceApi } from './serviceApi';

// Interface cho thông tin tính toán hóa đơn
export interface BillCalculation {
  maKH: number;
  maDatPhong?: number;
  tienPhong: number;
  tienDichVu: number;
  tongTienTruocGiam: number;
  giaTriGiam: number;
  tongTien: number;
  soNgay: number;
  giaPhongMoiNgay: number;
  chiTietPhong: {
    maPhong: number;
    tenPhong: string;
    loaiPhong: string;
    checkIn: string;
    checkOut: string;
    soNgay: number;
    giaPhong: number;
  };
  chiTietDichVu: Array<{
    maSDDV: number;
    tenDichVu: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    ngaySD: string;
    trangThai: string;
  }>;
}

// Lấy giá phòng theo loại phòng (fallback khi API không có giá)
const getRoomPriceByType = (maLoaiPhong: number): number => {
  switch (maLoaiPhong) {
    case 1: // Single
      return 500000;
    case 2: // Double
      return 1000000;
    case 3: // Triple
      return 1500000;
    case 4: // VIP
      return 2000000;
    case 5: // Deluxe
      return 3000000;
    default:
      return 500000; // Giá mặc định
  }
};

// Lấy thông tin đặt phòng theo khách hàng
const getBookingByCustomer = async (maKH: number): Promise<any> => {
  try {
    const response = await axios.get('/api/booking', {
      params: { userId: maKH },
      timeout: 15000
    });

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      // Lấy booking có thể tính hóa đơn - bao gồm tất cả trạng thái trừ đã hủy
      const billableBookings = response.data.data.filter((booking: any) => {
        return !booking.xoa && booking.trangThai !== 5; // Loại trừ chỉ trạng thái 5 (đã hủy)
      });

      if (billableBookings.length > 0) {
        // Sắp xếp theo ngày đặt mới nhất
        const sortedBookings = billableBookings.sort((a: any, b: any) =>
          new Date(b.ngayDat || b.ngayTao || b.createdAt).getTime() - new Date(a.ngayDat || a.ngayTao || a.createdAt).getTime()
        );
        return sortedBookings[0];
      }

      // Nếu không có booking active, lấy booking gần nhất bất kể trạng thái
      if (response.data.data.length > 0) {
        const latestBooking = response.data.data.sort((a: any, b: any) =>
          new Date(b.ngayDat || b.ngayTao || b.createdAt).getTime() - new Date(a.ngayDat || a.ngayTao || a.createdAt).getTime()
        )[0];
        return latestBooking;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

// Lấy thông tin phòng
const getRoomInfo = async (maPhong: number): Promise<any> => {
  try {
    const response = await axios.get(`/api/rooms/${maPhong}`, {
      timeout: 15000
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching room info:', error);
    return null;
  }
};

// Lấy thông tin loại phòng
const getRoomTypeInfo = async (maLoaiPhong: number): Promise<any> => {
  try {
    const response = await axios.get('/api/LoaiPhong/GetById', {
      params: { id: maLoaiPhong },
      timeout: 15000
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching room type info:', error);
    return null;
  }
};

// Lấy dịch vụ đã sử dụng của khách hàng
const getServiceUsageByCustomer = async (maKH: number): Promise<any[]> => {
  try {
    // Lấy nhiều records để đảm bảo không bị thiếu
    const response = await serviceApi.getServiceUsageHistory(1, 1000);

    if (response.success && response.data?.items) {
      // Lọc theo khách hàng và chưa thanh toán
      const customerUsages = response.data.items.filter((usage: any) => {
        return usage.maKH === maKH && !usage.xoa;
      });

      console.log(`Found ${customerUsages.length} service usages for customer ${maKH}`);
      return customerUsages;
    }
    return [];
  } catch (error) {
    console.error('Error fetching service usage:', error);
    return [];
  }
};

// Tính toán hóa đơn hoàn chỉnh
export const calculateBill = async (maKH: number, maDatPhong?: number, maGiam?: number): Promise<BillCalculation | null> => {
  try {
    // 1. Lấy thông tin đặt phòng
    let booking = null;
    if (maDatPhong) {
      // Lấy theo mã đặt phòng cụ thể
      try {
        const response = await axios.get('/api/booking', {
          params: { id: maDatPhong },
          timeout: 15000
        });
        if (response.data && response.data.success && response.data.data) {
          booking = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
        }
      } catch (error) {
        console.error('Error fetching booking by ID:', error);
      }
    }
    
    if (!booking) {
      // Lấy theo khách hàng
      booking = await getBookingByCustomer(maKH);
    }

    if (!booking) {
      throw new Error(`Không tìm thấy thông tin đặt phòng cho khách hàng ${maKH}. Vui lòng kiểm tra lại dữ liệu.`);
    }

    // 2. Lấy thông tin phòng
    const roomInfo = await getRoomInfo(booking.maPhong);

    // 3. Lấy thông tin loại phòng để có giá
    let roomPrice = 0;
    let roomType = 'Standard';

    if (roomInfo) {
      // Nếu có thông tin phòng, lấy giá từ loaiPhong
      roomPrice = roomInfo.giaTien || roomInfo.loaiPhong?.giaPhong || 0;
      roomType = roomInfo.loaiPhong?.tenLoai || roomInfo.tenLoaiPhong || 'Standard';

      // Nếu vẫn chưa có giá, thử lấy từ API loại phòng
      if (!roomPrice && roomInfo.maLoaiPhong) {
        const roomTypeInfo = await getRoomTypeInfo(roomInfo.maLoaiPhong);
        roomPrice = roomTypeInfo?.giaPhong || getRoomPriceByType(roomInfo.maLoaiPhong);
      }
    } else {
      // Nếu không tìm thấy thông tin phòng, sử dụng giá mặc định
      roomPrice = getRoomPriceByType(1); // Giá Single mặc định
    }

    // 4. Tính số ngày ở
    const checkInDate = dayjs(booking.checkIn);
    const checkOutDate = dayjs(booking.checkOut);
    const soNgay = Math.max(1, checkOutDate.diff(checkInDate, 'day'));

    // 5. Tính tiền phòng
    const tienPhong = roomPrice * soNgay;

    // 6. Lấy dịch vụ đã sử dụng
    const serviceUsages = await getServiceUsageByCustomer(maKH);

    // 7. Tính tiền dịch vụ
    const tienDichVu = serviceUsages.reduce((total, usage) => total + (usage.thanhTien || 0), 0);

    // 8. Tính tổng tiền trước giảm giá
    const tongTienTruocGiam = tienPhong + tienDichVu;

    // 9. Áp dụng giảm giá (nếu có)
    let giaTriGiam = 0;
    if (maGiam && maGiam > 1) {
      try {
        const discountResponse = await axios.get('/api/GiamGia/GetById', {
          params: { id: maGiam },
          timeout: 10000
        });

        if (discountResponse.data && discountResponse.data.success) {
          giaTriGiam = discountResponse.data.data?.giaTriGiam || 0;
          console.log(`Applied discount: ${giaTriGiam} VND for customer ${maKH}`);
        }
      } catch (error) {
        console.error('Error fetching discount:', error);
      }
    }

    // 10. Tính tổng tiền cuối cùng
    const tongTien = Math.max(0, tongTienTruocGiam - giaTriGiam);

    // 11. Chuẩn bị chi tiết
    const chiTietPhong = {
      maPhong: booking.maPhong,
      tenPhong: roomInfo?.ten || roomInfo?.soPhong || `Phòng ${booking.maPhong}`,
      loaiPhong: roomType,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      soNgay,
      giaPhong: roomPrice
    };

    // 12. Lấy thông tin chi tiết dịch vụ
    const chiTietDichVu = await Promise.all(
      serviceUsages.map(async (usage) => {
        let tenDichVu = `Dịch vụ ${usage.maDV}`;
        let donGia = 0;

        // Lấy thông tin dịch vụ từ API
        try {
          const serviceResponse = await axios.get('/api/services', {
            params: { id: usage.maDV },
            timeout: 10000
          });

          if (serviceResponse.data && serviceResponse.data.success) {
            const serviceData = serviceResponse.data.data;
            tenDichVu = serviceData.ten || tenDichVu;
            donGia = serviceData.gia || 0;
          }
        } catch (error) {
          console.error(`Error fetching service ${usage.maDV}:`, error);
          // Fallback to hardcoded prices
          if (usage.maDV === 1) {
            tenDichVu = 'Giặt ủi';
            donGia = 100000;
          } else if (usage.maDV === 2) {
            tenDichVu = 'Buffet';
            donGia = 500000;
          }
        }

        return {
          maSDDV: usage.maSDDV,
          tenDichVu,
          soLuong: usage.soLuong,
          donGia,
          thanhTien: usage.thanhTien || (usage.soLuong * donGia),
          ngaySD: usage.ngaySD,
          trangThai: usage.trangThai
        };
      })
    );

    return {
      maKH,
      maDatPhong: booking.maDatPhong,
      tienPhong,
      tienDichVu,
      tongTienTruocGiam,
      giaTriGiam,
      tongTien,
      soNgay,
      giaPhongMoiNgay: roomPrice,
      chiTietPhong,
      chiTietDichVu
    };

  } catch (error) {
    console.error('Error calculating bill:', error);
    throw error; // Ném lỗi để có thể catch ở component
  }
};

// Tạo hóa đơn với tính toán đầy đủ
export const createCalculatedBill = async (
  maKH: number, 
  maPhuongThuc: number, 
  maGiam?: number,
  maDatPhong?: number
): Promise<any> => {
  try {
    // 1. Tính toán hóa đơn
    const calculation = await calculateBill(maKH, maDatPhong);
    if (!calculation) {
      throw new Error('Không thể tính toán hóa đơn');
    }

    // 2. Tạo hóa đơn
    const billData = {
      maKH,
      ngayLapHD: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      maPhuongThuc,
      tongTien: calculation.tongTien,
      maGiam: maGiam || 1,
      trangThai: 2 // Chưa thanh toán
    };

    const response = await axios.post('/api/bills', billData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data,
      calculation
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Không thể tạo hóa đơn',
      data: null
    };
  }
};

export default {
  calculateBill,
  createCalculatedBill
};
