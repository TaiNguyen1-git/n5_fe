import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

// Hàm giải mã Base64 cho môi trường Node.js
function decodeBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

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
    
    // Tạo form data cho API đăng nhập
    const formData = new URLSearchParams();
    formData.append('TenTK', tenDangNhap);
    formData.append('password', matKhau);

    console.log('Login handler - Đang cố gắng đăng nhập với:', tenDangNhap);

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

    // Kiểm tra xem kết quả trả về có phải là JWT token không (ASP.NET 8 thường trả về chuỗi token trực tiếp)
    const isJwtToken = typeof data === 'string' && 
      data.split('.').length === 3 && 
      data.startsWith('eyJ');
    
    if (isJwtToken) {
      console.log('Login handler - Nhận được JWT token trực tiếp từ ASP.NET 8');
      // Tạo đối tượng dữ liệu từ JWT token
      const token = data;
      
      // Xử lý xác thực dựa vào token
      try {
        // Giải mã phần payload của JWT để lấy thông tin
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(decodeBase64(parts[1]));
          console.log('Login handler - JWT payload:', payload);
          
          const role = payload.role || '';
          const username = payload.unique_name || tenDangNhap;
          
          
          let vaiTro = 3; // Mặc định là khách hàng
          let loaiTK = 3;
          let roleName = 'customer';
          let redirectPath = '/';
          
          
          if (role === 'Admin' || role === 'admin') {
            vaiTro = 1;
            loaiTK = 1;
            roleName = 'admin';
            redirectPath = '/admin';
            console.log('Login handler - Người dùng có vai trò ADMIN');
          } else if (role === 'Staff' || role === 'staff') {
            vaiTro = 2;
            loaiTK = 2;
            roleName = 'staff';
            redirectPath = '/staff';
            console.log('Login handler - Người dùng có vai trò STAFF');
          } else {
            console.log('Login handler - Người dùng có vai trò CUSTOMER');
          }
          
          // Tạo đối tượng kết quả để trả về
          return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
              token: token,
              tenTK: username,
              loaiTK: loaiTK,
              vaiTro: vaiTro,
              role: roleName,
              redirectPath: redirectPath
            }
          });
        }
      } catch (error) {
        console.error('Login handler - Lỗi khi xử lý JWT token:', error);
      }
    }

    // Kiểm tra token dạng object - nếu có token tức là đăng nhập thành công
    if (data && data.token) {
      console.log('Login handler - Đã nhận được token, xác thực thành công');

      // Xác định vai trò người dùng dựa vào loaiTK từ response
      let role = 'customer';
      let redirectPath = '/';
      let vaiTro = 3; // Mặc định là khách hàng
      let loaiTK = 3;
      
      // Xử lý loaiTK từ dữ liệu 
      if (data.loaiTK !== undefined && data.loaiTK !== null) {
        try {
          // Đảm bảo loaiTK là số
          if (typeof data.loaiTK === 'number') {
            loaiTK = data.loaiTK;
          } else if (typeof data.loaiTK === 'string') {
            loaiTK = parseInt(data.loaiTK, 10);
          }
          vaiTro = loaiTK; // Giá trị vaiTro tương ứng với loaiTK
        } catch (error) {
          console.error('Login handler - Lỗi khi xử lý loaiTK:', error);
        }
      }
      
      // Xử lý đặc biệt cho tài khoản admin
      if (tenDangNhap === 'admin' && matKhau === 'admin') {
        loaiTK = 1;
        vaiTro = 1;
        console.log('Login handler - Tài khoản admin đặc biệt');
      }
      
      // Logic chuyển hướng dựa vào vai trò
      if (loaiTK === 1 || vaiTro === 1) {
        // Admin (id = 1)
        role = 'admin';
        redirectPath = '/admin';
        vaiTro = 1;
        console.log('Login handler - Vai trò ADMIN, chuyển hướng đến:', redirectPath);
      } else if (loaiTK === 2 || vaiTro === 2) {
        // Nhân viên (id = 2)
        role = 'staff';
        redirectPath = '/staff';
        vaiTro = 2;
        console.log('Login handler - Vai trò STAFF, chuyển hướng đến:', redirectPath);
      } else {
        // Khách hàng hoặc mặc định (id = 3)
        role = 'customer';
        redirectPath = '/';
        vaiTro = 3;
        console.log('Login handler - Vai trò CUSTOMER, chuyển hướng đến:', redirectPath);
      }

      // Trả về token và thông tin người dùng
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          ...data,
          role: role,
          redirectPath: redirectPath,
          loaiTK: loaiTK,
          vaiTro: vaiTro
        }
      });
    }

    // Nếu không có token, xử lý trường hợp đăng nhập thất bại
    if (!response.ok) {
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
    } else {
      // Trường hợp server không trả về token nhưng response vẫn OK
      return res.status(400).json({
        success: false,
        message: 'Đăng nhập thất bại - không nhận được token xác thực'
      });
    }
  } catch (error) {
    console.error('Login handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
} 