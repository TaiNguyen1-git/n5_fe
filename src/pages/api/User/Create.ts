import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import FormData from 'form-data';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
  details?: any;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    try {
      // Log request body for debugging

      // Kiểm tra các trường bắt buộc
      const { TenTK, MatKhau, TenHienThi, Email, Phone, LoaiTK, CreateAt } = req.body;

      if (!TenTK || !MatKhau) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản và mật khẩu là bắt buộc'
        });
      }

      // Chuẩn bị dữ liệu người dùng - đảm bảo tất cả trường đều có giá trị hợp lệ
      const userData = {
        TenTK: TenTK?.trim() || '',
        MatKhau: MatKhau?.trim() || '',
        TenHienThi: TenHienThi?.trim() || TenTK?.trim() || '',
        Email: Email?.trim() || '',
        Phone: Phone?.trim() || '',
        LoaiTK: Number(LoaiTK) || 2, // Mặc định là tài khoản nhân viên
        CreateAt: CreateAt || new Date().toISOString()
      };

      // Kiểm tra lại các trường bắt buộc sau khi trim
      if (!userData.TenTK || !userData.MatKhau) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản và mật khẩu không được để trống sau khi xử lý'
        });
      }

      // Log chi tiết dữ liệu

      // Tạo FormData để gửi đến backend API (backend yêu cầu multipart/form-data)
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        formData.append(key, userData[key as keyof typeof userData]);
      });

      // Tạo người dùng thông qua API backend với form-data
      const response = await axios.post(`${BACKEND_API_URL}/User/Create`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 30000
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        data: response.data
      });
    } catch (error: any) {

      // Log chi tiết lỗi để debug
      if (error.response) {



      } else if (error.request) {

      } else {

      }

      // Trả về thông báo lỗi chi tiết hơn
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo tài khoản',
        error: error.message,
        details: error.response?.data || 'Không có thông tin chi tiết'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
