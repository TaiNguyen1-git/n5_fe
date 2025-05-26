import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Định nghĩa kiểu dữ liệu phản hồi
type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username } = req.query;

  // Kiểm tra tham số username
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {

    // Gọi API backend để lấy thông tin người dùng theo tên tài khoản
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ptud-web-1.onrender.com/api';
    const response = await axios.get(`${backendUrl}/User/GetByUsername`, {
      params: { tenTK: username },
      timeout: 15000 // 15 giây
    });

    // Kiểm tra phản hồi từ backend
    if (response.data && response.data.success) {
      return res.status(200).json({
        success: true,
        message: 'User found',
        data: response.data.data
      });
    } else if (response.data) {
      return res.status(200).json({
        success: false,
        message: response.data.message || 'User not found',
        data: null
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }
  } catch (error: any) {

    // Trả về lỗi chi tiết
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
      data: null
    });
  }
}
