import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
      // Get employees from backend API
      const response = await axios.get(`${BACKEND_API_URL}/NhanVien/GetAll`, {
        timeout: 15000 // 15 second timeout
      });

      // Log response for debugging
      console.log('API NhanVien/GetAll response:', JSON.stringify(response.data).substring(0, 500) + '...');

      // Transform data for frontend if needed
      let employees = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          employees = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          employees = response.data.items;
        }
      }

      // Log processed employees
      console.log(`Processed ${employees.length} employees`);

      // Đảm bảo dữ liệu nhân viên có các trường cần thiết
      const formattedEmployees = employees.map((employee: any) => ({
        id: employee.maNV || employee.id || employee.maNV_,
        maNV: employee.maNV || employee.id || employee.maNV_,
        hoTen: employee.hoTen || employee.hoTen_,
        hoTen_: employee.hoTen_ || employee.hoTen,
        chucVu: employee.chucVu || employee.chucVu_,
        chucVu_: employee.chucVu_ || employee.chucVu,
        taiKhoan: employee.taiKhoan || employee.taiKhoan_,
        taiKhoan_: employee.taiKhoan_ || employee.taiKhoan,
        luongCoBan: employee.luongCoBan || employee.luong || 0,
        trangThai: employee.trangThai !== undefined ? employee.trangThai : true,
        // Thêm các trường mới
        chucVuId: employee.chucVuId,
        caLamId: employee.caLamId,
        maVaiTro: employee.maVaiTro,
        vaiTro: employee.vaiTro,
        caLam: employee.caLam
      }));

      console.log('Formatted employees sample:', formattedEmployees.length > 0 ? formattedEmployees[0] : 'No employees');

      return res.status(200).json({
        success: true,
        data: formattedEmployees
      });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách nhân viên'
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Log request body for debugging
      console.log('POST /api/employees - Request body:', req.body);

      // Kiểm tra các trường bắt buộc theo cấu trúc API
      const {
        hoTen_, chucVu_, taiKhoan_, matKhau_, luongCoBan, trangThai
      } = req.body;

      if (!hoTen_) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp họ tên nhân viên'
        });
      }

      // Chuẩn bị dữ liệu nhân viên theo cấu trúc API - chuyển trực tiếp từ request
      // Không thay đổi cấu trúc dữ liệu để tránh lỗi
      const employeeData = {
        hoTen_,
        chucVu_,
        taiKhoan_,
        matKhau_,
        luongCoBan: Number(luongCoBan) || 0,
        trangThai: trangThai !== undefined ? trangThai : true
      };

      console.log('Sending to API:', employeeData);

      // Tạo nhân viên thông qua API backend
      const response = await axios.post(`${BACKEND_API_URL}/NhanVien/Create`, employeeData);

      console.log('API response:', response.data);

      return res.status(201).json({
        success: true,
        message: 'Tạo nhân viên thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo nhân viên mới'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
