import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define response type
type ResponseData = {
  success?: boolean;
  message?: string;
  value?: any;
  statusCode?: number;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    const { thang, nam } = req.query;
    
    if (!thang || !nam) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số tháng hoặc năm',
        statusCode: 400
      });
    }
    
    try {
      // Call the backend API
      const response = await axios.get(`${BACKEND_API_URL}/DoanhThu/TheoThang`, {
        params: { thang, nam },
        timeout: 15000 // 15 second timeout
      });
      
      // Return the response data
      return res.status(200).json(response.data);
    } catch (error: any) {

      // Return error response
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Không thể lấy dữ liệu doanh thu theo tháng',
        value: { tongDoanhThu: 0, thang, nam },
        statusCode: 500
      });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`,
      statusCode: 405
    });
  }
}
