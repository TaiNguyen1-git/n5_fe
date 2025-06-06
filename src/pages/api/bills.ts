import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Forward the request to the actual API
      const response = await axios.get(`${API_URL}/HoaDon/GetAll`, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        },
        timeout: 15000, // 15 second timeout
        validateStatus: function (status) {
          // Accept all status codes to handle them manually
          return true;
        }
      });

      // Check if the response status is successful
      if (response.status >= 200 && response.status < 300) {
        // Return the response data
        return res.status(200).json(response.data);
      } else {
        // Return empty array with 200 status to prevent frontend errors
        return res.status(200).json([]);
      }
    } catch (error: any) {
      // Return empty array with 200 status to prevent frontend errors
      return res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      // Create new bill
      const response = await axios.post(`${API_URL}/HoaDon/Create`, req.body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000, // 15 second timeout
      });

      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo hóa đơn'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }
}
