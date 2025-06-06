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
          message: 'Vui lòng cung cấp ID giảm giá'
        });
      }
      
      console.log(`Fetching discount with ID: ${id}`);
      
      // Get discount from backend API
      const response = await axios.get(`${BACKEND_API_URL}/GiamGia/GetById`, {
        params: { id: Number(id) },
        timeout: 15000
      });

      console.log('Backend discount response:', response.data);

      if (response.data) {
        return res.status(200).json({
          success: true,
          data: response.data
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin giảm giá'
        });
      }
    } catch (error: any) {
      console.error('Error fetching discount:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin giảm giá'
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }
}
