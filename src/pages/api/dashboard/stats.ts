import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  metadata?: any; // Thêm metadata để debug
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    try {


      // Gọi API để lấy thông tin phòng với pageSize lớn để lấy tất cả dữ liệu
      const roomsResponse = await axios.get(`${BACKEND_API_URL}/Phong/GetAll`, {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy nhiều để đảm bảo có tất cả phòng
        },
        timeout: 20000
      });

      // Gọi API để lấy thông tin đặt phòng
      const bookingsResponse = await axios.get(`${BACKEND_API_URL}/DatPhong/GetAll`, {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy nhiều để đảm bảo có tất cả đặt phòng
        },
        timeout: 20000
      });

      // Gọi API để lấy thông tin khách hàng
      const customersResponse = await axios.get(`${BACKEND_API_URL}/KhachHang/GetAll`, {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy nhiều để đảm bảo có tất cả khách hàng
        },
        timeout: 20000
      });

      // Gọi API để lấy thông tin nhân viên
      const employeesResponse = await axios.get(`${BACKEND_API_URL}/NhanVien/GetAll`, {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy nhiều để đảm bảo có tất cả nhân viên
        },
        timeout: 20000
      });

      // Gọi API để lấy thông tin hóa đơn
      const billsResponse = await axios.get(`${BACKEND_API_URL}/HoaDon/GetAll`, {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy nhiều để đảm bảo có tất cả hóa đơn
        },
        timeout: 20000
      });

      // Xử lý dữ liệu phòng
      let rooms = [];
      let totalRoomsFromAPI = 0;
      if (roomsResponse.data) {
        if (Array.isArray(roomsResponse.data)) {
          rooms = roomsResponse.data;
          totalRoomsFromAPI = rooms.length;
        } else if (roomsResponse.data.items && Array.isArray(roomsResponse.data.items)) {
          rooms = roomsResponse.data.items;
          // Sử dụng totalItems từ API nếu có, nếu không thì dùng length
          totalRoomsFromAPI = roomsResponse.data.totalItems || rooms.length;
        }
      }

      // Xử lý dữ liệu đặt phòng
      let bookings = [];
      let totalBookingsFromAPI = 0;
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
          totalBookingsFromAPI = bookings.length;
        } else if (bookingsResponse.data.items && Array.isArray(bookingsResponse.data.items)) {
          bookings = bookingsResponse.data.items;
          // Sử dụng totalItems từ API nếu có, nếu không thì dùng length
          totalBookingsFromAPI = bookingsResponse.data.totalItems || bookings.length;
        }
      }

      // Xử lý dữ liệu khách hàng
      let customers = [];
      let totalCustomersFromAPI = 0;
      if (customersResponse.data) {
        if (Array.isArray(customersResponse.data)) {
          customers = customersResponse.data;
          totalCustomersFromAPI = customers.length;
        } else if (customersResponse.data.items && Array.isArray(customersResponse.data.items)) {
          customers = customersResponse.data.items;
          // Sử dụng totalItems từ API nếu có, nếu không thì dùng length
          totalCustomersFromAPI = customersResponse.data.totalItems || customers.length;
        }
      }

      // Xử lý dữ liệu nhân viên
      let employees = [];
      let totalEmployeesFromAPI = 0;
      if (employeesResponse.data) {
        if (Array.isArray(employeesResponse.data)) {
          employees = employeesResponse.data;
          totalEmployeesFromAPI = employees.length;
        } else if (employeesResponse.data.items && Array.isArray(employeesResponse.data.items)) {
          employees = employeesResponse.data.items;
          // Sử dụng totalItems từ API nếu có, nếu không thì dùng length
          totalEmployeesFromAPI = employeesResponse.data.totalItems || employees.length;
        }
      }

      // Xử lý dữ liệu hóa đơn
      let bills = [];
      let totalBillsFromAPI = 0;
      if (billsResponse.data) {
        if (Array.isArray(billsResponse.data)) {
          bills = billsResponse.data;
          totalBillsFromAPI = bills.length;
        } else if (billsResponse.data.items && Array.isArray(billsResponse.data.items)) {
          bills = billsResponse.data.items;
          // Sử dụng totalItems từ API nếu có, nếu không thì dùng length
          totalBillsFromAPI = billsResponse.data.totalItems || bills.length;
        }
      }



      // Tính toán thống kê chi tiết
      // Sử dụng tổng số thực tế từ API thay vì chỉ đếm items trong response
      const totalRooms = totalRoomsFromAPI;

      // Tính phòng trống - kiểm tra nhiều trường hợp từ dữ liệu có sẵn
      const availableRooms = rooms.filter((room: any) => {
        // Kiểm tra theo mã trạng thái
        if (room.maTT === 1) return true;
        if (room.trangThai === 1) return true;

        // Kiểm tra theo tên trạng thái
        if (room.trangThaiPhong?.tenTT === 'Trống' || room.trangThaiPhong?.tenTT === 'Phòng trống') return true;
        if (room.tenTrangThai === 'Trống' || room.tenTrangThai === 'Phòng trống') return true;

        return false;
      }).length;

      // Tính phòng đang sử dụng
      const occupiedRooms = rooms.filter((room: any) => {
        // Kiểm tra theo mã trạng thái
        if (room.maTT === 3) return true; // Có khách
        if (room.trangThai === 3) return true;

        // Kiểm tra theo tên trạng thái
        if (room.trangThaiPhong?.tenTT === 'Có khách' || room.trangThaiPhong?.tenTT === 'Đang sử dụng') return true;
        if (room.tenTrangThai === 'Có khách' || room.tenTrangThai === 'Đang sử dụng') return true;

        return false;
      }).length;

      // Sử dụng tổng số thực tế từ API
      const totalBookings = totalBookingsFromAPI;
      const totalCustomers = totalCustomersFromAPI;
      const totalEmployees = totalEmployeesFromAPI;



      // Tính tổng doanh thu từ hóa đơn (chỉ tính những hóa đơn chưa bị xóa)
      let totalRevenue = 0;
      bills.forEach((bill: any) => {
        if (bill.tongTien && !bill.xoa) {
          const amount = Number(bill.tongTien);
          if (!isNaN(amount)) {
            totalRevenue += amount;
          }
        }
      });



      // Trả về dữ liệu thống kê
      return res.status(200).json({
        success: true,
        data: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          totalBookings,
          totalCustomers,
          totalEmployees,
          totalRevenue
        },
        // Thêm metadata để debug
        metadata: {
          timestamp: new Date().toISOString(),
          sampleSizes: {
            rooms: rooms.length,
            bookings: bookings.length,
            customers: customers.length,
            employees: employees.length,
            bills: bills.length
          },
          apiTotals: {
            totalRoomsFromAPI,
            totalBookingsFromAPI,
            totalCustomersFromAPI,
            totalEmployeesFromAPI,
            totalBillsFromAPI
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin thống kê'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
