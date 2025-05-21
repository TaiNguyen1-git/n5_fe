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
      console.log('Fetching shifts from API...');
      
      // Gọi API lấy danh sách ca làm
      const response = await axios.get(`${BACKEND_API_URL}/CaLam/GetAll`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });
      
      console.log('Shifts API response:', response.data);
      
      // Trả về dữ liệu ca làm
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error fetching shifts:', error);
      
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
        message: 'Đã xảy ra lỗi khi lấy danh sách ca làm',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
