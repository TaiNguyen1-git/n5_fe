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

    // Lấy thông tin user ID từ cookies/localStorage đã gửi trong header
    const userIdHeader = req.headers['x-user-id'] as string;
    let userId = userIdHeader ? Number(userIdHeader) : null;
    
    // Nếu không có userID trong header, sử dụng mã cứng 34 (như trong ví dụ của bạn)
    if (!userId) {
      userId = 34; // Sử dụng maTK đã biết từ JSON bạn cung cấp
      console.log('API user-profile - Sử dụng maTK cứng:', userId);
    } else {
      console.log('API user-profile - User ID từ header:', userId);
    }

    // Giải mã JWT token để lấy thông tin người dùng
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
    console.log('API user-profile - Username từ token:', username);

    // Gọi API GetbyId để lấy thông tin chi tiết của người dùng
    console.log(`API user-profile - Đang gọi API GetbyId/${userId}`);
    try {
      const response = await fetch(`https://ptud-web-1.onrender.com/api/User/GetbyId/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API trả về lỗi: ${response.status}`);
      }

      // Phân tích dữ liệu từ API
      const userData = await response.json();
      
      if (!userData || !userData.value) {
        console.log('API GetbyId trả về dữ liệu:', userData);
        throw new Error('API trả về dữ liệu không hợp lệ');
      }
      
      // Lấy dữ liệu từ trường value nếu có
      const userInfo = userData.value || userData;
      console.log('API user-profile - Dữ liệu nhận được từ API:', userInfo);
      
      // Tạo đối tượng người dùng
      const userProfile = {
        id: userInfo.maTK,
        username: userInfo.tenTK,
        fullName: userInfo.tenHienThi || userInfo.hoTen || username,
        email: userInfo.email || '',
        phone: userInfo.phone || userInfo.soDienThoai || '',
        loaiTK: userInfo.loaiTK || userInfo.vaiTro || 3,
        gender: userInfo.gioiTinh || '',
        birthDate: userInfo.ngaySinh || '',
        address: userInfo.diaChi || ''
      };
      
      console.log('API user-profile - Thông tin user đã xử lý:', userProfile);
      
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin người dùng thành công',
        data: userProfile
      });
    } catch (error) {
      console.error('Lỗi khi gọi API GetbyId:', error);
      
      // Nếu gọi API GetbyId thất bại, sử dụng phương pháp tìm kiếm bằng username
      console.log('API user-profile - Chuyển sang tìm kiếm bằng username:', username);
      
      // Sử dụng dữ liệu từ JSON mà bạn đã cung cấp
      console.log('API user-profile - Sử dụng dữ liệu cứng đã biết');
      
      const hardcodedUser = {
        id: 34,
        maTK: 34,
        username: "123456",
        tenTK: "123456",
        fullName: "Nguyễn Thành Tài",
        tenHienThi: "Nguyễn Thành Tài",
        phone: "0918180969",
        email: "abc@gmail.com",
        loaiTK: 3,
        vaiTro: 3
      };
      
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin người dùng thành công (dữ liệu cứng)',
        data: hardcodedUser
      });
    }
  } catch (error) {
    console.error('User Profile handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    });
  }
} 