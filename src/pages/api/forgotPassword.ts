import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle different HTTP methods
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }

  // Check which action is being accessed
  const { action } = req.query;
  
  try {
    if (action === 'forgot-password') {
      return handleForgotPassword(req, res);
    } else if (action === 'reset-password') {
      return handleResetPassword(req, res);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.' 
    });
  }
}

async function handleForgotPassword(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { email } = req.body;
    
    // Debug log
    console.log('Request to forgot-password API with email:', email);
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }
    
    try {
      // Call backend API
      const response = await axios.post(`${BACKEND_API_URL}/ForgotPassword/forgot-password`, {
        email
      });
      
      console.log('Backend response for forgot-password:', response.data);
      
      return res.status(200).json({
        success: true,
        message: 'Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn'
      });
    } catch (apiError: any) {
      console.error('API error in forgot-password:', apiError.message);
      if (apiError.response) {
        console.error('API response error:', apiError.response.data);
      }
      
      // Xử lý khi không thể gọi API - vẫn trả kết quả thành công cho client
      // để tránh leak thông tin về tài khoản tồn tại hay không
      return res.status(200).json({
        success: true,
        message: 'Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn nếu tài khoản tồn tại'
      });
    }
  } catch (error: any) {
    console.error('Forgot password general error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.' 
    });
  }
}

async function handleResetPassword(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { resetToken, password } = req.body;
    
    // Debug log
    console.log('Request to reset-password API with token length:', resetToken?.length);
    
    // Validate input
    if (!resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
      });
    }
    
    try {
      // Call backend API
      const response = await axios.post(`${BACKEND_API_URL}/ForgotPassword/reset-password`, {
        resetToken,
        password
      });
      
      console.log('Backend response for reset-password:', response.data);
      
      return res.status(200).json({
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      });
    } catch (apiError: any) {
      console.error('API error in reset-password:', apiError.message);
      if (apiError.response) {
        console.error('API response error:', apiError.response.data);
      }
      
      return res.status(500).json({
        success: false,
        message: apiError.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu'
      });
    }
  } catch (error: any) {
    console.error('Reset password general error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.' 
    });
  }
} 