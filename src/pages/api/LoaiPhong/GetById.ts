import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

interface ResponseData {
  success: boolean;
  data?: any;
  message?: string;
}

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
          message: 'ID loại phòng là bắt buộc'
        });
      }

      // Get room type by ID from backend API
      const response = await axios.get(`${BACKEND_API_URL}/LoaiPhong/GetById`, {
        params: { id },
        timeout: 15000 // 15 second timeout
      });

      // Return the room type data directly
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin loại phòng'
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
