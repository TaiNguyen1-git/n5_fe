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
      // Log request body for debugging

      // Kiểm tra các trường bắt buộc
      const { tenKH, email } = req.body;

      if (!tenKH) {
        return res.status(400).json({
          success: false,
          message: 'Tên khách hàng là bắt buộc'
        });
      }

      // Chuẩn bị dữ liệu khách hàng theo đúng cấu trúc API yêu cầu
      const customerData = {
        tenKH: tenKH || "Khách hàng",
        email: email || "guest@example.com",
        phone: req.body.phone || "",
        maVaiTro: req.body.maVaiTro || 3, // Mặc định là 3 (khách hàng)
        xoa: false
      };



      // Gọi API backend để tạo khách hàng
      try {
        const response = await axios.post(`${BACKEND_API_URL}/KhachHang/Create`, customerData, {
          timeout: 20000, // 20s timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });

        // Kiểm tra xem response có chứa dữ liệu khách hàng không
        if (!response.data || !response.data.maKH) {

        }

        // Trả về kết quả từ API backend
        return res.status(201).json({
          success: true,
          message: 'Tạo khách hàng thành công',
          data: response.data
        });
      } catch (apiError: any) {

        if (axios.isAxiosError(apiError) && apiError.response) {

        }
        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (error: any) {

      // Xử lý lỗi cụ thể
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server trả về lỗi
          return res.status(error.response.status).json({
            success: false,
            message: error.response.data?.message || 'Không thể tạo khách hàng. Vui lòng kiểm tra thông tin và thử lại.'
          });
        } else if (error.request) {
          // Không nhận được response từ server
          return res.status(503).json({
            success: false,
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.'
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Không thể tạo khách hàng. Vui lòng thử lại sau.'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
