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

    // Lấy username từ query parameter
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số username'
      });
    }

    console.log(`Proxy user info - Tìm thông tin người dùng với username: ${username}`);

    // Giải pháp không hardcode, sử dụng API backend để tìm thông tin người dùng
    try {
      // Có thể backend của bạn có endpoint để tìm người dùng theo tên đăng nhập
      // Nếu không có, thì cần phải tạo endpoint này hoặc gọi API khác để lấy dữ liệu
      
      // Gọi API để lấy danh sách người dùng và tìm người dùng phù hợp
      const response = await fetch('https://ptud-web-1.onrender.com/api/User', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      // Xác định thông tin người dùng dựa trên kết quả
      let userInfo = null;
      
      if (response.ok) {
        const data = await response.json();
        let users = [];
        
        if (data && data.value && Array.isArray(data.value)) {
          users = data.value;
        } else if (Array.isArray(data)) {
          users = data;
        }
        
        console.log(`Proxy user info - Nhận được ${users.length} người dùng từ API`);
        
        // Tìm người dùng có tenTK hoặc username khớp
        const userFound = users.find((user: any) => 
          user.tenTK === username || user.username === username);
          
        if (userFound) {
          userInfo = userFound;
          console.log(`Proxy user info - Tìm thấy người dùng với ID: ${userInfo.maTK}`);
        } else {
          console.log(`Proxy user info - Không tìm thấy người dùng với username: ${username}`);
        }
      } else {
        console.log(`Proxy user info - Không thể gọi API, status: ${response.status}`);
      }
      
      // Nếu không tìm thấy thông tin người dùng, trả về lỗi
      if (!userInfo) {
        // Thử cách khác: gọi API /api/User/GetbyId/username (một số hệ thống cho phép dùng username thay cho ID)
        try {
          console.log(`Proxy user info - Thử gọi API GetbyId với username: ${username}`);
          
          const idResponse = await fetch(`https://ptud-web-1.onrender.com/api/User/GetbyId/${username}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (idResponse.ok) {
            const userData = await idResponse.json();
            if (userData && userData.value) {
              userInfo = userData.value;
              console.log(`Proxy user info - Tìm thấy thông tin người dùng với GetbyId: ${userInfo.maTK}`);
            }
          } else {
            console.log(`Proxy user info - Không thể gọi API GetbyId, status: ${idResponse.status}`);
          }
        } catch (error) {
          console.error('Proxy user info - Lỗi khi gọi API GetbyId:', error);
        }
      }
      
      // Nếu vẫn không tìm thấy người dùng, dùng thông tin từ phía client
      if (!userInfo) {
        // Trong trường hợp không tìm thấy dữ liệu, cần triển khai cách khác để lấy thông tin 
        // hoặc cải thiện hệ thống lưu trữ
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng',
          data: null
        });
      }
      
      // Trả về thông tin người dùng
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin người dùng thành công',
        data: userInfo
      });
      
    } catch (error) {
      console.error('Proxy user info - Lỗi:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi tìm thông tin người dùng'
      });
    }
  } catch (error) {
    console.error('Proxy user info - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
    });
  }
} 