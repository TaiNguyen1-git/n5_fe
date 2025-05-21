import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
      console.log('POST /api/User/Create - Request body:', req.body);

      // Kiểm tra các trường bắt buộc
      const { TenTK, MatKhau, TenHienThi, Email, Phone, LoaiTK, CreateAt } = req.body;

      if (!TenTK || !MatKhau) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản và mật khẩu là bắt buộc'
        });
      }

      // Chuẩn bị dữ liệu người dùng - chuyển đổi sang cấu trúc backend mong đợi
      const userData = {
        tenTK: TenTK,
        matKhau: MatKhau,
        tenHienThi: TenHienThi || TenTK,
        email: Email || '',
        phone: Phone || '',
        loaiTK: Number(LoaiTK) || 2, // Mặc định là tài khoản nhân viên
        createAt: CreateAt || new Date().toISOString()
      };

      // Log chi tiết dữ liệu
      console.log('User data structure:', {
        TenTK: typeof TenTK,
        MatKhau: typeof MatKhau,
        TenHienThi: typeof TenHienThi,
        Email: typeof Email,
        Phone: typeof Phone,
        LoaiTK: typeof LoaiTK,
        CreateAt: typeof CreateAt
      });

      console.log('Sending to API:', userData);

      // Tạo người dùng thông qua API backend
      const response = await axios.post(`${BACKEND_API_URL}/User/Create`, userData);

      console.log('API response:', response.data);

      return res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error('Error creating user:', error);

      // Log chi tiết lỗi để debug
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
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
