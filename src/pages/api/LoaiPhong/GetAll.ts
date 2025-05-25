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
      // Get room types from backend API
      const response = await axios.get(`${BACKEND_API_URL}/LoaiPhong/GetAll`, {
        timeout: 15000 // 15 second timeout
      });

      // Transform data for frontend if needed
      let roomTypes = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          roomTypes = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          roomTypes = response.data.items;
        }
      }

      return res.status(200).json({
        success: true,
        data: roomTypes
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách loại phòng',
        data: []
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
