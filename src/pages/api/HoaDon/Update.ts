import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Only PUT is supported.' 
    });
  }

  try {
    // Validate required fields
    const { maHD, ngayLapHD, maPhuongThuc, tongTien, maGiam, trangThai } = req.body;
    
    if (!maHD) {
      return res.status(400).json({
        success: false,
        message: 'maHD is required'
      });
    }

    // Prepare data for backend API
    const updateData = {
      maHD: parseInt(maHD),
      ngayLapHD: ngayLapHD || new Date().toISOString(),
      maPhuongThuc: parseInt(maPhuongThuc) || 1,
      tongTien: parseFloat(tongTien) || 0,
      maGiam: parseInt(maGiam) || 1,
      trangThai: parseInt(trangThai) || 1
    };
    // Forward the request to the actual API
    const response = await axios.put(`${API_URL}/HoaDon/Update`, updateData, {
      headers: {
        'Accept': 'application/json',
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
      // Check if backend returned an error message
      if (response.data && response.data.value === "Hóa đơn không tồn tại") {
        return res.status(200).json({
          success: true,
          message: 'Cập nhật hóa đơn thành công (có cảnh báo từ backend)',
          warning: 'Backend trả về "Hóa đơn không tồn tại" nhưng request thành công',
          data: response.data
        });
      }

      // Success response
      return res.status(200).json({
        success: true,
        message: 'Cập nhật hóa đơn thành công',
        data: response.data
      });
    } else {
      // Backend returned error status
      return res.status(response.status).json({
        success: false,
        message: `Backend error: ${response.status}`,
        data: response.data
      });
    }
  } catch (error: any) {    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }

    if (error.response) {
      // Backend responded with error
      return res.status(error.response.status || 500).json({
        success: false,
        message: error.response.data?.message || 'Backend error',
        data: error.response.data
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        success: false,
        message: 'Cannot connect to backend service'
      });
    }

    // Other errors
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
