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
      // Get positions from backend API
      const response = await axios.get(`${BACKEND_API_URL}/ChucVu/GetAll`, {
        timeout: 15000 // 15 second timeout
      });

      // Transform data for frontend if needed
      let positions = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          positions = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          positions = response.data.items;
        }
      }



      return res.status(200).json({
        success: true,
        data: positions
      });
    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách chức vụ'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
