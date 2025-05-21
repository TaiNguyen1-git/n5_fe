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
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID chức vụ là bắt buộc'
        });
      }

      console.log(`Fetching position with ID ${id} from backend API...`);
      
      // Get position from backend API
      const response = await axios.get(`${BACKEND_API_URL}/ChucVu/GetById`, {
        params: { id },
        timeout: 15000 // 15 second timeout
      });

      // Log response for debugging
      console.log(`API ChucVu/GetById response for ID ${id}:`, response.data);

      // Return the position data directly
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error fetching position:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin chức vụ'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
