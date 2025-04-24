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
  if (req.method === 'POST') {
    try {
      const { hoTen, email, soDienThoai, tieuDe, noiDung } = req.body;
      
      // Validate required fields
      if (!hoTen || !email || !tieuDe || !noiDung) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không đúng định dạng'
        });
      }
      
      // Prepare contact data for the backend API
      const contactData = {
        hoTen,
        email,
        soDienThoai,
        tieuDe,
        noiDung,
        trangThai: 0 // Mặc định trạng thái là chưa phản hồi
      };
      
      // Send contact data to the backend API
      const response = await axios.post(`${BACKEND_API_URL}/LienHe/Create`, contactData);
      
      return res.status(200).json({
        success: true,
        message: 'Gửi liên hệ thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi gửi biểu mẫu liên hệ'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ 
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ` 
    });
  }
} 