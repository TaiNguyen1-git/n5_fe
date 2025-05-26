import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Forward the request to the actual API
    const response = await axios.get(`${API_URL}/KhachHang/GetById?id=${id}`, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      },
      timeout: 8000, // 8 second timeout
      validateStatus: function (status) {
        // Accept all status codes to handle them manually
        return true;
      }
    });

    // Check if the response status is successful and data exists
    if (response.status >= 200 && response.status < 300 && response.data && Object.keys(response.data).length > 0) {
      // Return the response data
      return res.status(200).json(response.data);
    } else {
      return res.status(response.status || 404).json({
        success: false,
        message: 'Không tìm thấy thông tin khách hàng'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kết nối đến máy chủ'
    });
  }
}

