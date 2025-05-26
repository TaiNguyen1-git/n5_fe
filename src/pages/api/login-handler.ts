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
      // Log dữ liệu gốc từ API
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý phản hồi từ server'
      });
    }
    // Kiểm tra trực tiếp trường loaiTK (nếu có)
    if (data && data.loaiTK === 2) {
    }

    // Kiểm tra xem kết quả trả về có phải là JWT token không (ASP.NET 8 thường trả về chuỗi token trực tiếp)
    const isJwtToken = typeof data === 'string' &&
      data.split('.').length === 3 &&
      data.startsWith('eyJ');

    if (isJwtToken) {
      // Tạo đối tượng dữ liệu từ JWT token
      const token = data;

      // Xử lý xác thực dựa vào token
      try {
        // Giải mã phần payload của JWT để lấy thông tin
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(decodeBase64(parts[1]));
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
          } else if (role === 'Staff' || role === 'staff') {
            vaiTro = 2;
            loaiTK = 2;
            roleName = 'staff';
            redirectPath = '/staff';
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
      }
    }

    // Kiểm tra token dạng object - nếu có token tức là đăng nhập thành công
    if (data && data.token) {
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
        }
      }

      // Kiểm tra các trường hợp đặc biệt
      if (data.tenTK === 'nhanvien2' || data.username === 'nhanvien2') {
        loaiTK = 2;
        vaiTro = 2;
      }

      // Xử lý đặc biệt cho tài khoản admin
      if (tenDangNhap === 'admin' && matKhau === 'admin') {
        loaiTK = 1;
        vaiTro = 1;
      }

      // Logic chuyển hướng dựa vào vai trò
      if (loaiTK === 1 || vaiTro === 1) {
        // Admin (id = 1)
        role = 'admin';
        redirectPath = '/admin';
        vaiTro = 1;
        loaiTK = 1; // Đảm bảo đồng bộ
      } else if (loaiTK === 2 || vaiTro === 2) {
        // Nhân viên (id = 2)
        role = 'staff';
        redirectPath = '/staff';
        vaiTro = 2;
        loaiTK = 2; // Đảm bảo đồng bộ
      } else {
        // Khách hàng hoặc mặc định (id = 3)
        role = 'customer';
        redirectPath = '/';
        vaiTro = 3;
        loaiTK = 3; // Đảm bảo đồng bộ
      }

      // Trả về token và thông tin người dùng, đảm bảo đồng bộ tất cả các trường liên quan đến phân quyền
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          ...data,
          token: data.token,
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

      // Xử lý thông báo lỗi từ API
      let errorMessage = 'Đăng nhập thất bại';

      // Kiểm tra nếu data là string (thông báo lỗi trực tiếp từ API)
      if (typeof data === 'string') {
        errorMessage = data;
      }
      // Kiểm tra các trường hợp lỗi khác
      else if (data) {
        if (data.message) errorMessage = data.message;
        else if (data.title) errorMessage = data.title;
        else if (data.value) errorMessage = data.value;
      }



      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    } else {
      // Trường hợp server không trả về token nhưng response vẫn OK
      return res.status(400).json({
        success: false,
        message: 'Đăng nhập thất bại - không nhận được token xác thực'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
}