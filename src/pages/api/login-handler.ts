import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }

  try {
    const { tenDangNhap, matKhau } = req.body;
    
    // Đổi tên các trường để phù hợp với API
    const loginData = {
      TenTK: tenDangNhap,     // Sử dụng TenTK thay vì tenDangNhap
      password: matKhau      // Sử dụng password thay vì matKhau
    };

    console.log('Login handler - Đang cố gắng đăng nhập với:', loginData);

    // Tạo form data
    const formData = new URLSearchParams();
    formData.append('TenTK', loginData.TenTK);
    formData.append('password', loginData.password);

    // Gọi API đăng nhập từ backend
    const response = await fetch('https://ptud-web-1.onrender.com/api/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString(),
    });

    // Lấy dữ liệu từ response
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Login handler - Lỗi khi parse JSON response:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý phản hồi từ server'
      });
    }

    console.log('Login handler - Kết quả đăng nhập:', data);

    if (!response.ok) {
      // Xử lý các lỗi cụ thể từ API
      if (response.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      return res.status(response.status).json({
        success: false,
        message: data.message || data.title || 'Đăng nhập thất bại'
      });
    }

    // Trả về kết quả thành công cho client
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        ...data,
        token: data.token || 'temporary-token',
        tenTK: data.tenTK || loginData.TenTK,
        tenHienThi: data.tenHienThi || data.hoTen || loginData.TenTK
      }
    });
  } catch (error) {
    console.error('Login handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
} 