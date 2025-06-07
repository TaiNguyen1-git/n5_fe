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
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ID mã giảm giá'
        });
      }

      console.log(`Deleting discount with ID: ${id}`);

      // Delete discount via backend API
      const response = await axios.delete(
        `${BACKEND_API_URL}/GiamGia/Delete?id=${id}`,
        {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      console.log('Backend delete response:', response.data);

      return res.status(200).json({
        success: true,
        message: 'Xóa mã giảm giá thành công',
        data: response.data
      });

    } catch (error: any) {
      console.error('Error deleting discount:', error);

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
