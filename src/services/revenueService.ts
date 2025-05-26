import axios from 'axios';
import dayjs from 'dayjs';

const BASE_URL = '/api'; // Using Next.js API routes

// Define interfaces for revenue data
export interface RevenueData {
  tongDoanhThu: number;
  roomRevenue?: number;
  serviceRevenue?: number;
  ngay?: number;
  thang?: number;
  nam?: number;
}

// API services for revenue
export const revenueService = {
  // Get total revenue
  getTotalRevenue: async (): Promise<number> => {
    try {
      const response = await axios.get(`${BASE_URL}/DoanhThu/TongDoanhThu`, {
        timeout: 15000 // 15 second timeout
      });



      if (response.data && response.data.value && response.data.value.tongDoanhThu !== undefined) {
        return response.data.value.tongDoanhThu;
      }

      return 0;
    } catch (error) {

      return 0;
    }
  },

  // Get revenue by date
  getRevenueByDate: async (date: dayjs.Dayjs): Promise<RevenueData> => {
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await axios.get(`${BASE_URL}/DoanhThu/TheoNgay`, {
        params: { ngay: formattedDate },
        timeout: 15000 // 15 second timeout
      });

      if (response.data && response.data.value) {
        return response.data.value;
      }

      return { tongDoanhThu: 0 };
    } catch (error) {

      return { tongDoanhThu: 0 };
    }
  },

  // Get revenue by month
  getRevenueByMonth: async (month: number, year: number): Promise<RevenueData> => {
    try {
      const response = await axios.get(`${BASE_URL}/DoanhThu/TheoThang`, {
        params: {
          thang: month,
          nam: year
        },
        timeout: 15000 // 15 second timeout
      });

      if (response.data && response.data.value) {
        return response.data.value;
      }

      return { tongDoanhThu: 0, thang: month, nam: year };
    } catch (error) {

      return { tongDoanhThu: 0, thang: month, nam: year };
    }
  },

  // Get revenue by year
  getRevenueByYear: async (year: number): Promise<RevenueData> => {
    try {
      const response = await axios.get(`${BASE_URL}/DoanhThu/TheoNam`, {
        params: { nam: year },
        timeout: 15000 // 15 second timeout
      });

      if (response.data && response.data.value) {
        return response.data.value;
      }

      return { tongDoanhThu: 0, nam: year };
    } catch (error) {

      return { tongDoanhThu: 0, nam: year };
    }
  },

  // Get revenue data for a date range
  getRevenueForDateRange: async (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, reportType: string): Promise<RevenueData[]> => {
    try {
      const results: RevenueData[] = [];

      // Nếu không có dữ liệu thực từ API, tạo dữ liệu mẫu để hiển thị
      const createSampleData = (
        date: dayjs.Dayjs,
        roomRevenue: number = 0,
        serviceRevenue: number = 0
      ): RevenueData => {
        return {
          tongDoanhThu: roomRevenue + serviceRevenue,
          roomRevenue: roomRevenue,
          serviceRevenue: serviceRevenue,
          ngay: date.date(),
          thang: date.month() + 1,
          nam: date.year()
        };
      };

      // Tạo dữ liệu mẫu cho biểu đồ
      const generateSampleData = () => {
        // Tạo dữ liệu mẫu với một số ngày có doanh thu
        if (reportType === 'daily') {
          // Tạo dữ liệu mẫu cho các ngày trong tháng 5/2023 như trong ảnh
          const sampleDates = [
            { date: '2023-05-14', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-15', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-16', roomRevenue: 8000, serviceRevenue: 2000 }, // Tổng: 10000
            { date: '2023-05-17', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-18', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-19', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-20', roomRevenue: 0, serviceRevenue: 0 },
            { date: '2023-05-21', roomRevenue: 0, serviceRevenue: 0 }
          ];

          sampleDates.forEach(sample => {
            const sampleDate = dayjs(sample.date);
            if (sampleDate.isAfter(startDate) && sampleDate.isBefore(endDate) ||
                sampleDate.isSame(startDate, 'day') || sampleDate.isSame(endDate, 'day')) {
              results.push(createSampleData(sampleDate, sample.roomRevenue, sample.serviceRevenue));
            }
          });
        }
      };

      if (reportType === 'daily') {
        // For daily reports, get revenue for each day in the range
        let currentDate = startDate.clone();
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
          try {
            const dailyRevenue = await revenueService.getRevenueByDate(currentDate);
            results.push({
              ...dailyRevenue,
              ngay: currentDate.date(),
              thang: currentDate.month() + 1,
              nam: currentDate.year()
            });
          } catch (err) {

            // Không thêm dữ liệu mẫu nếu có lỗi
          }
          currentDate = currentDate.add(1, 'day');
        }
      } else if (reportType === 'monthly') {
        // For monthly reports, get revenue for each month in the range
        let currentMonth = startDate.clone().startOf('month');
        while (currentMonth.isBefore(endDate) || currentMonth.isSame(endDate, 'month')) {
          try {
            const monthlyRevenue = await revenueService.getRevenueByMonth(
              currentMonth.month() + 1,
              currentMonth.year()
            );
            results.push(monthlyRevenue);
          } catch (err) {

            // Không thêm dữ liệu mẫu nếu có lỗi
          }
          currentMonth = currentMonth.add(1, 'month');
        }
      } else if (reportType === 'yearly') {
        // For yearly reports, get revenue for each year in the range
        let currentYear = startDate.clone().startOf('year');
        while (currentYear.isBefore(endDate) || currentYear.isSame(endDate, 'year')) {
          try {
            const yearlyRevenue = await revenueService.getRevenueByYear(currentYear.year());
            results.push(yearlyRevenue);
          } catch (err) {

            // Không thêm dữ liệu mẫu nếu có lỗi
          }
          currentYear = currentYear.add(1, 'year');
        }
      } else if (reportType === 'thisYear') {
        // Đặc biệt xử lý cho trường hợp "Năm nay" - lấy dữ liệu theo tháng thay vì theo ngày
        try {
          const currentYear = dayjs().year();
          const yearlyRevenue = await revenueService.getRevenueByYear(currentYear);

          // Thêm dữ liệu từ API
          results.push(yearlyRevenue);
        } catch (err) {

          // Không thêm dữ liệu mẫu nếu có lỗi
        }
      }

      // Không tạo dữ liệu mẫu nữa, chỉ sử dụng dữ liệu từ API

      // Đảm bảo dữ liệu được sắp xếp theo ngày
      results.sort((a, b) => {
        const dateA = new Date(a.nam || 0, (a.thang || 1) - 1, a.ngay || 1);
        const dateB = new Date(b.nam || 0, (b.thang || 1) - 1, b.ngay || 1);
        return dateA.getTime() - dateB.getTime();
      });

      return results;
    } catch (error) {

      return [];
    }
  }
};

export default revenueService;
