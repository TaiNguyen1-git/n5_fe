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
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }

  try {
    // Lấy token xác thực từ request
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    // Giải mã JWT token để lấy thông tin người dùng
    // Hàm này sẽ giải mã phần payload của JWT
    function decodeJwtPayload(token: string): any {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        return payload;
      } catch (error) {
        console.error('Lỗi khi giải mã JWT:', error);
        return null;
      }
    }

    // Lấy username từ token
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.unique_name) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const username = payload.unique_name;

    // Gọi API GetAll để lấy danh sách người dùng
    const response = await fetch('https://ptud-web-1.onrender.com/api/User/GetAll', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'Không thể lấy thông tin người dùng'
      });
    }

    // Phân tích danh sách người dùng
    const users = await response.json();
    
    // Tìm người dùng hiện tại theo username
    const currentUser = users.find((user: any) => user.tenTK === username);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    console.log('API user-profile - Thông tin người dùng trả về:', {
      tenTK: currentUser.tenTK,
      tenHienThi: currentUser.tenHienThi,
      phone: currentUser.phone,
      email: currentUser.email
    });

    // Trả về thông tin người dùng
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: currentUser
    });
  } catch (error) {
    console.error('User Profile handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    });
  }
} 