import axios from 'axios';
import dayjs from 'dayjs';

// Sử dụng proxy thay vì direct API call
const BASE_URL = '/api';

export interface Discount {
  id: number;
  hoaDons: any[];
  tenMa: string | null;
  loaiGiam: string | null;
  giaTri: number | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: boolean;
}

export interface DiscountStats {
  totalDiscounts: number;
  activeDiscounts: number;
  expiredDiscounts: number;
  expiringSoonDiscounts: number;
  invalidDiscounts: number;
}

export interface DiscountChartData {
  name: string;
  value: number;
  color: string;
}

class DiscountService {
  // Lấy tất cả mã giảm giá
  async getAllDiscounts(): Promise<Discount[]> {
    try {
      const response = await axios.get(`${BASE_URL}/GiamGia/GetAll`);

      // Thử nhiều cấu trúc response khác nhau
      let data = [];
      if (response.data?.items) {
        // Cấu trúc paginated response với items array
        data = response.data.items;
      } else if (response.data?.value?.data) {
        data = response.data.value.data;
      } else if (response.data?.value) {
        data = response.data.value;
      } else if (response.data?.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else {
        data = [];
      }

      return data;
    } catch (error) {
      return [];
    }
  }

  // Tính toán thống kê mã giảm giá
  async getDiscountStats(): Promise<DiscountStats> {
    try {
      const discounts = await this.getAllDiscounts();
      const now = dayjs();
      const soonThreshold = now.add(7, 'day');

      const stats = {
        totalDiscounts: discounts.length,
        activeDiscounts: 0,
        expiredDiscounts: 0,
        expiringSoonDiscounts: 0,
        invalidDiscounts: 0
      };

      discounts.forEach(discount => {
        // Kiểm tra dữ liệu hợp lệ
        if (!discount.tenMa || !discount.loaiGiam || !discount.giaTri) {
          stats.invalidDiscounts++;
          return;
        }

        const endDate = dayjs(discount.ngayKetThuc);
        
        if (!discount.trangThai) {
          // Mã đã tắt
          return;
        }

        if (endDate.isBefore(now)) {
          stats.expiredDiscounts++;
        } else if (endDate.isBefore(soonThreshold)) {
          stats.expiringSoonDiscounts++;
        } else {
          stats.activeDiscounts++;
        }
      });

      return stats;
    } catch (error) {

      return {
        totalDiscounts: 0,
        activeDiscounts: 0,
        expiredDiscounts: 0,
        expiringSoonDiscounts: 0,
        invalidDiscounts: 0
      };
    }
  }

  // Lấy data cho biểu đồ
  async getDiscountChartData(): Promise<DiscountChartData[]> {
    try {
      const stats = await this.getDiscountStats();
      
      return [
        {
          name: 'Đang hoạt động',
          value: stats.activeDiscounts,
          color: '#52c41a'
        },
        {
          name: 'Sắp hết hạn',
          value: stats.expiringSoonDiscounts,
          color: '#faad14'
        },
        {
          name: 'Đã hết hạn',
          value: stats.expiredDiscounts,
          color: '#ff4d4f'
        },
        {
          name: 'Dữ liệu lỗi',
          value: stats.invalidDiscounts,
          color: '#d9d9d9'
        }
      ].filter(item => item.value > 0); // Chỉ hiển thị những mục có giá trị > 0
    } catch (error) {
      return [];
    }
  }

  // Lấy mã sắp hết hạn
  async getExpiringSoonDiscounts(): Promise<Discount[]> {
    try {
      const discounts = await this.getAllDiscounts();
      const now = dayjs();
      const soonThreshold = now.add(7, 'day');

      return discounts.filter(discount => {
        if (!discount.trangThai) return false;

        const endDate = dayjs(discount.ngayKetThuc);
        return endDate.isAfter(now) && endDate.isBefore(soonThreshold);
      });
    } catch (error) {
      return [];
    }
  }

  // Kiểm tra mã giảm giá hợp lệ (cho client)
  async validateDiscountCode(code: string): Promise<{
    valid: boolean;
    discount?: Discount;
    message?: string;
  }> {
    try {
      const discounts = await this.getAllDiscounts();
      const now = dayjs();

      // Tìm mã giảm giá theo tên mã
      const discount = discounts.find(d =>
        d.tenMa && d.tenMa.toLowerCase() === code.toLowerCase()
      );

      if (!discount) {
        return {
          valid: false,
          message: 'Mã giảm giá không tồn tại'
        };
      }

      if (!discount.trangThai) {
        return {
          valid: false,
          message: 'Mã giảm giá đã bị vô hiệu hóa'
        };
      }

      const startDate = dayjs(discount.ngayBatDau);
      const endDate = dayjs(discount.ngayKetThuc);

      if (now.isBefore(startDate)) {
        return {
          valid: false,
          message: 'Mã giảm giá chưa có hiệu lực'
        };
      }

      if (now.isAfter(endDate)) {
        return {
          valid: false,
          message: 'Mã giảm giá đã hết hạn'
        };
      }

      if (!discount.giaTri || discount.giaTri <= 0) {
        return {
          valid: false,
          message: 'Mã giảm giá không hợp lệ'
        };
      }

      return {
        valid: true,
        discount,
        message: 'Mã giảm giá hợp lệ'
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Có lỗi xảy ra khi kiểm tra mã giảm giá'
      };
    }
  }

  // Tính toán số tiền giảm giá
  calculateDiscountAmount(originalPrice: number, discount: Discount): number {
    if (!discount.giaTri || discount.giaTri <= 0) return 0;

    if (discount.loaiGiam === 'percent' || discount.loaiGiam === '%') {
      // Giảm theo phần trăm
      return Math.round(originalPrice * (discount.giaTri / 100));
    } else {
      // Giảm theo số tiền cố định
      return Math.min(discount.giaTri, originalPrice);
    }
  }
}

export const discountService = new DiscountService();
