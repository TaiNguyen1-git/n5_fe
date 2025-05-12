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

  if (req.method === 'DELETE') {
    try {
      // Lấy tham số TenTK từ query
      const { TenTK } = req.query;

      console.log('direct-delete API route called with TenTK:', TenTK);

      if (!TenTK) {
        console.error('TenTK is missing in query parameters');
        return res.status(400).json({
          success: false,
          message: 'TenTK là bắt buộc'
        });
      }

      // Gọi API backend với tham số chính xác
      try {
        console.log(`Calling backend API: DELETE ${BACKEND_API_URL}/User/Delete?TenTK=${TenTK}`);
        
        const response = await axios.delete(`${BACKEND_API_URL}/User/Delete`, {
          params: { TenTK },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('Backend API response:', response.status, response.data);
        
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
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
