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
    // Cấu trúc dữ liệu đăng nhập đúng format
    const loginData = {
      tenDangNhap: username,
      matKhau: password
    };

    // Thử kết nối API qua fetch
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 giây timeout

      const response = await fetch(`${BACKEND_API_URL}/Auth/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          return res.status(401).json({
            success: false,
            message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
          });
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API trả về lỗi ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: data
      });
    }
    catch (fetchError: any) {
      // Nếu fetch thất bại, thử lại với axios
      try {
        // Call backend API for authentication
        const response = await axios.post(`${BACKEND_API_URL}/Auth/Login`, loginData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 60000 // 60 giây timeout
        });

        return res.status(200).json({
          success: true,
          message: 'Đăng nhập thành công',
          data: response.data
        });
      } catch (axiosError: any) {
        // Handle specific error responses from backend
        if (axiosError.response?.status === 401) {
          return res.status(401).json({
            success: false,
            message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
          });
        }

        // Lỗi mạng
        if (axiosError.message && axiosError.message.includes('Network Error')) {
          return res.status(503).json({
            success: false,
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
          });
        }

        throw axiosError;
      }
    }
  } catch (error: any) {
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

    // Cấu trúc lại dữ liệu theo đúng format của backend API
    const userData = {
      tenDangNhap: username,
      matKhau: password,
      email: email,
      hoTen: fullName,
      soDienThoai: phoneNumber || '',
      vaiTro: 'customer'
    };
    // Thử gọi API register thông qua fetch để có thêm tùy chọn
    try {
      // Sử dụng fetch API với timeout dài hơn
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 giây timeout

      const backendResponse = await fetch(`${BACKEND_API_URL}/Auth/Register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await backendResponse.json();
      if (backendResponse.ok) {
        return res.status(201).json({
          success: true,
          message: 'Đăng ký tài khoản thành công',
          data: responseData
        });
      } else {
        throw new Error(responseData.message || 'Đăng ký thất bại');
      }
    } catch (fetchError: any) {
      // Nếu lỗi fetch, thử lại với axios
      try {
        const axiosResponse = await axios.post(`${BACKEND_API_URL}/Auth/Register`, userData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 60000 // 60 giây timeout
        });
        return res.status(201).json({
          success: true,
          message: 'Đăng ký tài khoản thành công',
          data: axiosResponse.data
        });
      } catch (axiosError: any) {
        if (axiosError.response?.status === 400) {
          return res.status(400).json({
            success: false,
            message: axiosError.response.data.message || 'Thông tin đăng ký không hợp lệ'
          });
        }

        throw axiosError;
      }
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
    });
  }
}

async function handleChangePassword(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    // Call backend API to change password using new endpoint
    const response = await axios.put(`${BACKEND_API_URL}/User/DoiMatKhau/${encodeURIComponent(username)}`, {
      matKhauCu: currentPassword,
      matKhauMoi: newPassword,
      reMatKhau: confirmPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error: any) {
    // Handle specific error responses from backend
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác hoặc dữ liệu không hợp lệ'
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.'
    });
  }
}