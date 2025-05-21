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
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản là bắt buộc'
        });
      }

      console.log(`Checking if username ${username} exists...`);
      
      // Gọi API kiểm tra tài khoản
      try {
        const response = await axios.get(`${BACKEND_API_URL}/User/GetByUsername`, {
          params: { username },
          timeout: 15000 // 15 second timeout
        });

        console.log(`API response for username ${username}:`, response.data);

        // Nếu có dữ liệu, tài khoản đã tồn tại
        if (response.data) {
          return res.status(200).json({
            success: true,
            message: 'Tài khoản đã tồn tại',
            data: response.data
          });
        }
        
        // Nếu không có dữ liệu, tài khoản chưa tồn tại
        return res.status(200).json({
          success: false,
          message: 'Tài khoản chưa tồn tại',
          data: null
        });
      } catch (error: any) {
        // Nếu API trả về lỗi 404, tài khoản chưa tồn tại
        if (error.response && error.response.status === 404) {
          return res.status(200).json({
            success: false,
            message: 'Tài khoản chưa tồn tại',
            data: null
          });
        }
        
        // Nếu có lỗi khác, trả về lỗi
        throw error;
      }
    } catch (error: any) {
      console.error('Error checking username:', error);
      
      // Log chi tiết lỗi để debug
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi kiểm tra tài khoản'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
