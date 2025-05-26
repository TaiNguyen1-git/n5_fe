import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Gọi API lấy danh sách vai trò
      const response = await axios.get(`${BACKEND_API_URL}/VaiTro/GetAll`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });

      // Trả về dữ liệu vai trò
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {

      // Log chi tiết lỗi
      if (error.response) {

      } else {

      }

      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy danh sách vai trò',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
