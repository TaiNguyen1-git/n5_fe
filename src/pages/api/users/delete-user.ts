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
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID người dùng là bắt buộc'
        });
      }
      // Thử nhiều cách khác nhau để gọi API xóa
      try {
        // Cách 1: Sử dụng query string
        const response = await axios.delete(`${BACKEND_API_URL}/User/Delete?id=${id}`);
        return res.status(200).json({
          success: true,
          message: 'Xóa người dùng thành công',
          data: response.data
        });
      } catch (error1) {
        try {
          // Cách 2: Sử dụng params
          const response = await axios.delete(`${BACKEND_API_URL}/User/Delete`, {
            params: { id }
          });
          return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công',
            data: response.data
          });
        } catch (error2) {
          try {
            // Cách 3: Sử dụng POST với _method=DELETE
            const response = await axios.post(`${BACKEND_API_URL}/User/Delete`, 
              { id },
              { headers: { 'X-HTTP-Method-Override': 'DELETE' } }
            );
            return res.status(200).json({
              success: true,
              message: 'Xóa người dùng thành công',
              data: response.data
            });
          } catch (error3) {
            throw error3;
          }
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi xóa người dùng'
      });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
