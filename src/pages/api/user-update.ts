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
  // Chỉ cho phép phương thức PUT
  if (req.method !== 'PUT') {
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

    // Lấy thông tin cần cập nhật từ body
    const userData = req.body;
    // Sử dụng phương án đã thành công (phương án 1 với query parameter)
    try {
      // Phương án Query Parameter với tham số TenTK
      const queryParams = new URLSearchParams({
        TenTK: userData.tenTK
      }).toString();
      
      const requestUrl = `https://ptud-web-1.onrender.com/api/User/Update?${queryParams}`;
      // Gọi API với query parameter
      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tenHienThi: userData.tenHienThi,
          phone: userData.phone,
          email: userData.email
        }) // Gửi dữ liệu đầy đủ
      });
      
      // Kiểm tra kết quả
      if (response.ok) {
        return res.status(200).json({
          success: true,
          message: 'Cập nhật thông tin thành công'
        });
      } else {
        // Xử lý lỗi
        let errorMessage = 'Cập nhật thông tin thất bại';
        try {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (e) {
            // Không phải JSON, sử dụng errorText làm message
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (e) {
        }
        
        return res.status(response.status).json({
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi gọi API cập nhật thông tin'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng'
    });
  }
} 