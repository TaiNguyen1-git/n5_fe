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

  if (req.method === 'POST') {
    try {
      console.log('delete-multi API route called with body:', req.body);
      const { id } = req.body;

      console.log('Extracted ID:', id, 'Type:', typeof id);

      if (!id) {
        console.error('ID is missing in request body');
        return res.status(400).json({
          success: false,
          message: 'ID người dùng là bắt buộc'
        });
      }

      console.log(`API route delete-multi: Deleting user with id ${id}`);

      // Thử nhiều cách khác nhau để gọi API xóa
      let success = false;
      let responseData = null;
      let errorMessage = '';

      // Cách 1: Sử dụng GET
      try {
        console.log('Method 1: Using GET');
        const response = await axios.get(`${BACKEND_API_URL}/User/Delete?id=${id}`);
        console.log('Method 1 response:', response.data);
        success = true;
        responseData = response.data;
        return res.status(200).json({
          success: true,
          message: 'Xóa người dùng thành công (GET)',
          data: responseData
        });
      } catch (error1) {
        console.error('Method 1 failed:', error1);
        errorMessage += 'GET failed; ';

        // Cách 2: Sử dụng POST
        try {
          console.log('Method 2: Using POST');
          const response = await axios.post(`${BACKEND_API_URL}/User/Delete?id=${id}`);
          console.log('Method 2 response:', response.data);
          success = true;
          responseData = response.data;
          return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công (POST)',
            data: responseData
          });
        } catch (error2) {
          console.error('Method 2 failed:', error2);
          errorMessage += 'POST failed; ';

          // Cách 3: Sử dụng DELETE
          try {
            console.log('Method 3: Using DELETE');
            const response = await axios.delete(`${BACKEND_API_URL}/User/Delete?id=${id}`);
            console.log('Method 3 response:', response.data);
            success = true;
            responseData = response.data;
            return res.status(200).json({
              success: true,
              message: 'Xóa người dùng thành công (DELETE)',
              data: responseData
            });
          } catch (error3) {
            console.error('Method 3 failed:', error3);
            errorMessage += 'DELETE failed; ';
          }
        }
      }

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Xóa người dùng thành công',
          data: responseData
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Không thể xóa người dùng: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi xóa người dùng'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
