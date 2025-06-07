import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define response type
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
  if (req.method === 'POST') {
    try {
      // Validate required fields
      const { tenMa, loaiGiam, giaTri, ngayBatDau, ngayKetThuc, trangThai } = req.body;

      if (!tenMa || !loaiGiam || giaTri === undefined || !ngayBatDau || !ngayKetThuc) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: tenMa, loaiGiam, giaTri, ngayBatDau, ngayKetThuc',
          receivedData: req.body
        });
      }

      // Additional validation
      if (tenMa === 'string' || loaiGiam === 'string') {
        return res.status(400).json({
          success: false,
          message: 'tenMa và loaiGiam không được là "string", cần giá trị thực tế'
        });
      }

      if (Number(giaTri) < 1000) {
        return res.status(400).json({
          success: false,
          message: 'giaTri phải lớn hơn hoặc bằng 1000'
        });
      }

      // Create discount via backend API
      const response = await axios.post(
        `${BACKEND_API_URL}/GiamGia/Create`,
        req.body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Tạo mã giảm giá thành công',
        data: response.data
      });

    } catch (error: any) {

      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Lỗi từ server backend',
          data: error.response.data,
          backendStatus: error.response.status,
          backendUrl: `${BACKEND_API_URL}/GiamGia/Create`
        });
      } else if (error.request) {
        return res.status(503).json({
          success: false,
          message: 'Không thể kết nối đến server backend',
          backendUrl: `${BACKEND_API_URL}/GiamGia/Create`
        });
      } else {
        return res.status(500).json({
          success: false,
          message: error.message || 'Lỗi không xác định'
        });
      }
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Phương thức không được hỗ trợ'
    });
  }
}
