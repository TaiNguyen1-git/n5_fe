import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type LoginData = {
  username: string;
  password: string;
}

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

type ChangePasswordData = {
  username: string;
  currentPassword: string;
  newPassword: string;
}

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
}

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'POST':
      // Check which auth endpoint is being accessed
      const { action } = req.query;
      
      if (action === 'login') {
        return handleLogin(req, res);
      } else if (action === 'register') {
        return handleRegister(req, res);
      } else if (action === 'change-password') {
        return handleChangePassword(req, res);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
      });
    }

    // Call backend API for authentication
    const response = await axios.post(`${BACKEND_API_URL}/Auth/Login`, {
      username,
      password
    });
    
    // Return success response with user data and token
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: response.data
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific error responses from backend
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false, 
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.' 
    });
  }
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, password, email, fullName, phoneNumber } = req.body;
    
    // Validate input
    if (!username || !password || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }
    
    // Call backend API for user registration
    const response = await axios.post(`${BACKEND_API_URL}/Auth/Register`, {
      username,
      password,
      email,
      hoTen: fullName,
      soDienThoai: phoneNumber || ''
    });
    
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: response.data
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific error from backend
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.response.data.message || 'Thông tin đăng ký không hợp lệ'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.' 
    });
  }
}

async function handleChangePassword(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }
    
    // Call backend API to change password
    const response = await axios.post(`${BACKEND_API_URL}/Auth/ChangePassword`, {
      username,
      oldPassword: currentPassword,
      newPassword
    });
    
    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    
    // Handle specific error responses from backend
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.' 
    });
  }
} 