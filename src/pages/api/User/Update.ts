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
  if (req.method === 'PUT') {
    try {
      // Log request body for debugging

      // Kiểm tra các trường bắt buộc
      const { TenTK, TenHienThi, Email, Phone, MatKhau } = req.body;

      if (!TenTK) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản là bắt buộc'
        });
      }

      // Chuẩn bị dữ liệu người dùng
      const userData: any = {
        TenTK
      };

      if (TenHienThi) userData.TenHienThi = TenHienThi;
      if (Email) userData.Email = Email;
      if (Phone) userData.Phone = Phone;
      if (MatKhau) userData.MatKhau = MatKhau;

      // Cập nhật người dùng thông qua API backend
      const response = await axios.put(`${BACKEND_API_URL}/User/Update`, userData);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật tài khoản thành công',
        data: response.data
      });
    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật tài khoản'
      });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
