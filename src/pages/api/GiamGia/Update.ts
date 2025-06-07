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
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ID mã giảm giá'
        });
      }

      console.log(`Updating discount with ID: ${id}`);
      console.log('Update data:', req.body);

      // Update discount via backend API
      const response = await axios.put(
        `${BACKEND_API_URL}/GiamGia/Update?id=${id}`,
        req.body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      console.log('Backend update response:', response.data);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật mã giảm giá thành công',
        data: response.data
      });

    } catch (error: any) {
      console.error('Error updating discount:', error);

      if (error.response) {
        // Backend returned an error response
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Lỗi từ server backend',
          data: error.response.data
        });
      } else if (error.request) {
        // Request timeout or network error
        return res.status(503).json({
          success: false,
          message: 'Không thể kết nối đến server backend'
        });
      } else {
        // Other errors
        return res.status(500).json({
          success: false,
          message: error.message || 'Lỗi không xác định'
        });
      }
    }
  } else {
    // Method not allowed
    return res.status(405).json({
      success: false,
      message: 'Phương thức không được hỗ trợ'
    });
  }
}
