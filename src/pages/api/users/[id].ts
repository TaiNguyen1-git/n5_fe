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
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID người dùng không hợp lệ'
    });
  }

  if (req.method === 'GET') {
    try {
      // Get specific user from backend API
      const response = await axios.get(`${BACKEND_API_URL}/User/GetById?id=${id}`);

      if (!response.data) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin người dùng'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Log request body for debugging
      // Update user
      const userData = req.body;

      // Update user through backend API
      const response = await axios.put(`${BACKEND_API_URL}/User/Update`, userData);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật người dùng thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin người dùng'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete user through backend API
      const response = await axios.delete(`${BACKEND_API_URL}/User/Delete?id=${id}`);
      return res.status(200).json({
        success: true,
        message: 'Xóa người dùng thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa người dùng'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
