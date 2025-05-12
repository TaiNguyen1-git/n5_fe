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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'DELETE') {
    try {
      // Lấy tham số TenTK từ query
      let { TenTK } = req.query;
      
      // Nếu tham số là array, lấy phần tử đầu tiên
      if (Array.isArray(TenTK)) {
        TenTK = TenTK[0];
      }

      if (!TenTK) {
        return res.status(400).json({
          success: false,
          message: 'TenTK là bắt buộc'
        });
      }

      // Xử lý TenTK
      const tenTKString = String(TenTK);

      // Gọi API backend với tham số chính xác
      try {
        // Thử cả hai cách gọi API
        let response;
        try {
          // Cách 1: Sử dụng params
          response = await axios.delete(`${BACKEND_API_URL}/User/Delete`, {
            params: { TenTK: tenTKString },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 15000 // 15 giây
          });
        } catch (error1: any) {
          // Cách 2: Sử dụng query string trong URL
          response = await axios.delete(`${BACKEND_API_URL}/User/Delete?TenTK=${encodeURIComponent(tenTKString)}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 15000 // 15 giây
          });
        }
        
        // Kiểm tra phản hồi từ backend
        if (response && response.data) {
          return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công',
            data: response.data
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'API trả về phản hồi rỗng'
          });
        }
      } catch (error: any) {
        // Trả về lỗi từ backend nếu có
        if (error.response) {
          return res.status(error.response.status).json({
            success: false,
            message: error.response.data?.message || 'Lỗi từ backend API',
            data: error.response.data
          });
        }
        
        // Thử phương pháp POST với _method=DELETE
        try {
          const postResponse = await axios.post(`${BACKEND_API_URL}/User/Delete`,
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
            message: 'Xóa người dùng thành công (phương pháp fallback)',
            data: postResponse.data
          });
        } catch (postError: any) {
          // Trả về lỗi chung nếu không có response
          return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gọi backend API'
          });
        }
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi xóa người dùng'
      });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
