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
      // Get all discounts from backend API
      const response = await axios.get(`${BACKEND_API_URL}/GiamGia/GetAll`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        return res.status(200).json({
          success: true,
          data: response.data
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh sách mã giảm giá'
        });
      }

    } catch (error: any) {

      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Lỗi từ server backend',
          data: error.response.data
        });
      } else if (error.request) {
        return res.status(503).json({
          success: false,
          message: 'Không thể kết nối đến server backend'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: error.message || 'Lỗi không xác định'
        });
      }
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Phương thức không được hỗ trợ'
    });
  }
}
