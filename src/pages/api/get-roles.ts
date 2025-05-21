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
      console.log('Fetching roles from API...');
      
      // Gọi API lấy danh sách vai trò
      const response = await axios.get(`${BACKEND_API_URL}/VaiTro/GetAll`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });
      
      console.log('Roles API response:', response.data);
      
      // Trả về dữ liệu vai trò
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      
      // Log chi tiết lỗi
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
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
