import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
};

// Backend API URLs
const API_URLS = [
  'https://ptud-web-1.onrender.com/api/DatPhong/Create',
  'https://ptud-web-3.onrender.com/api/DatPhong/Create'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only accept POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    // Get booking data from request body
    const bookingData = req.body;

    // Check for required fields
    if (!bookingData.maPhong) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin phòng cần thiết'
      });
    }

    // Kiểm tra và đảm bảo maPhong là số hợp lệ
    if (bookingData.maPhong === 0 || isNaN(bookingData.maPhong)) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng không hợp lệ'
      });
    }

    // Kiểm tra và đảm bảo có ngày check-in và check-out
    if (!bookingData.checkIn || !bookingData.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày nhận/trả phòng'
      });
    }

    // Log the booking data for debugging

    // Try multiple API endpoints
    let lastError = null;
    let apiResponse = null;

    for (const apiUrl of API_URLS) {
      try {
        // Đảm bảo dữ liệu đặt phòng đúng định dạng
        const validatedData = {
          maKH: bookingData.maKH || 0,
          maPhong: bookingData.maPhong || 0,
          ngayDat: bookingData.ngayDat || new Date().toISOString(),
          checkIn: bookingData.checkIn || '',
          checkOut: bookingData.checkOut || '',
          trangThai: bookingData.trangThai || 1,
          xoa: bookingData.xoa !== undefined ? bookingData.xoa : false
        };

        // Call the backend API with timeout
        const response = await axios.post(apiUrl, validatedData, {
          timeout: 20000, // 20s timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        // If successful, save the response and break the loop
        apiResponse = response;
        break;
      } catch (error: any) {

        lastError = error;
        // Continue to the next API URL
      }
    }

    // If no API call was successful, throw the last error
    if (!apiResponse) {
      throw lastError || new Error('All API endpoints failed');
    }

    // Return the successful response
    return res.status(200).json({
      success: true,
      message: 'Đặt phòng thành công',
      data: apiResponse.data
    });
  } catch (error: any) {

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Không thể đặt phòng. Vui lòng kiểm tra thông tin và thử lại.'
        });
      } else if (error.request) {
        // The request was made but no response was received
        return res.status(503).json({
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'Không thể đặt phòng. Vui lòng thử lại sau.'
    });
  }
}
