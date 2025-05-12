import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
  // Thêm CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('delete-by-username API route called with body:', req.body);
      const { username } = req.body;

      console.log('Extracted username:', username, 'Type:', typeof username);

      if (!username) {
        console.error('Username is missing in request body');
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản là bắt buộc'
        });
      }

      console.log(`API route delete-by-username: Deleting user with username ${username}`);

      // Gọi API xóa người dùng
      try {
        console.log('Calling backend API with DELETE method');
        const response = await axios.delete(`${BACKEND_API_URL}/User/Delete`, {
          params: { TenTK: username }
        });
        
        console.log('Backend API response:', response.data);
        
        return res.status(200).json({
          success: true,
          message: 'Xóa người dùng thành công',
          data: response.data
        });
      } catch (error: any) {
        console.error('Error calling backend API:', error);
        
        // Trả về lỗi từ backend nếu có
        if (error.response) {
          return res.status(error.response.status).json({
            success: false,
            message: error.response.data?.message || 'Lỗi từ backend API',
            data: error.response.data
          });
        }
        
        // Trả về lỗi chung nếu không có response
        return res.status(500).json({
          success: false,
          message: error.message || 'Lỗi khi gọi backend API'
        });
      }
    } catch (error: any) {
      console.error('Error in API route:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi xóa người dùng'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
