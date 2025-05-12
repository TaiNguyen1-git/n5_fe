import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Thêm CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Chỉ cho phép phương thức DELETE
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ 
      success: false, 
      message: `Phương thức ${req.method} không được hỗ trợ` 
    });
  }

  try {
    // Lấy tham số tenTK hoặc username từ query
    const tenTK = req.query.tenTK || req.query.username;

    if (!tenTK) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số tenTK hoặc username'
      });
    }

    // Đảm bảo tenTK là chuỗi
    const tenTKString = Array.isArray(tenTK) ? tenTK[0] : String(tenTK);

    try {
      // Cách 1: Sử dụng tham số TenTK
      const response = await axios.delete(`${BACKEND_API_URL}/User/Delete`, {
        params: { TenTK: tenTKString },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      return res.status(200).json({
        success: true,
        message: 'Xóa người dùng thành công',
        data: response.data
      });
    } catch (error1: any) {
      try {
        // Cách 2: Sử dụng URL query parameter
        const response = await axios.delete(`${BACKEND_API_URL}/User/Delete?TenTK=${encodeURIComponent(tenTKString)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });
        
        return res.status(200).json({
          success: true,
          message: 'Xóa người dùng thành công',
          data: response.data
        });
      } catch (error2: any) {
        try {
          // Cách 3: Thử endpoint khác và tham số tenTK (lowercase)
          const response = await axios.delete(`${BACKEND_API_URL}/User/DeleteUser`, {
            params: { tenTK: tenTKString },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 15000
          });
          
          return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công',
            data: response.data
          });
        } catch (error3: any) {
          // Phương pháp 4: Thử với phương thức POST với _method=DELETE
          try {
            const response = await axios.post(`${BACKEND_API_URL}/User/Delete`, 
              { TenTK: tenTKString },
              { 
                headers: { 
                  'X-HTTP-Method-Override': 'DELETE',
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                timeout: 15000
              }
            );
            
            return res.status(200).json({
              success: true,
              message: 'Xóa người dùng thành công',
              data: response.data
            });
          } catch (error4: any) {
            // Thất bại với tất cả các phương pháp
            const errorMessage = error4.response?.data?.message || error4.message;
            
            return res.status(500).json({
              success: false,
              message: `Không thể xóa người dùng: ${errorMessage}`
            });
          }
        }
      }
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi không mong muốn khi xóa người dùng'
    });
  }
}
