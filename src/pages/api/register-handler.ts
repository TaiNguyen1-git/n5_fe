import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
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
    const { userName, password, confirmPassword, email, fullName, phone } = req.body;
    
    // Định dạng dữ liệu đúng cho API
    const registerData = {
      MaTK: 0,                 // MaTK sẽ được tạo tự động bởi server
      TenTK: userName,         // TenTK là tên đăng nhập
      MatKhau: password,       // MatKhau là mật khẩu
      ReMatKhau: confirmPassword || password, // ReMatKhau là xác nhận mật khẩu
      TenHienThi: fullName,    // TenHienThi là họ tên đầy đủ
      Email: email,            // Email
      Phone: phone || ""       // Số điện thoại
    };

    console.log('Register handler - Đang gửi dữ liệu đăng ký:', registerData);

    // Tạo form data
    const formData = new URLSearchParams();
    formData.append('MaTK', registerData.MaTK.toString());
    formData.append('TenTK', registerData.TenTK);
    formData.append('MatKhau', registerData.MatKhau);
    formData.append('ReMatKhau', registerData.ReMatKhau);
    formData.append('TenHienThi', registerData.TenHienThi);
    formData.append('Email', registerData.Email);
    formData.append('Phone', registerData.Phone);

    // Gọi API đăng ký từ backend
    const response = await fetch('https://ptud-web-1.onrender.com/api/User/RegisterUser', {
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
      console.error('Register handler - Lỗi khi parse JSON response:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý phản hồi từ server'
      });
    }

    console.log('Register handler - Kết quả đăng ký:', data);
    console.log('Register handler - HTTP status:', response.status);

    // Kiểm tra status code và dữ liệu trả về
    if (!response.ok) {
      const errorMessage = data.message || data.title || 'Đăng ký thất bại';
      console.error('Register handler - Lỗi từ server:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      
      return res.status(response.status).json({
        success: false,
        message: errorMessage,
        error: data
      });
    }

    // Trả về kết quả thành công cho client
    return res.status(200).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: data
    });
  } catch (error) {
    console.error('Register handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
    });
  }
} 