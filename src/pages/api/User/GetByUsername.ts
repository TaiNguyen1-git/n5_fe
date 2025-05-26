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

      // Gọi API kiểm tra tài khoản
      try {
        const response = await axios.get(`${BACKEND_API_URL}/User/GetByUsername`, {
          params: { username },
          timeout: 15000 // 15 second timeout
        });

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

      // Log chi tiết lỗi để debug
      if (error.response) {


      } else if (error.request) {

      } else {

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
