import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const {
        hoTen, chucVuId, caLamId, luongCoBan, maVaiTro, trangThai
      } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên không được để trống'
        });
      }

      // Kiểm tra các trường bắt buộc
      if (!chucVuId) {
        return res.status(400).json({
          success: false,
          message: 'Chức vụ không được để trống'
        });
      }

      if (!caLamId) {
        return res.status(400).json({
          success: false,
          message: 'Ca làm không được để trống'
        });
      }

      if (!luongCoBan && luongCoBan !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Lương cơ bản không được để trống'
        });
      }

      // Đảm bảo maVaiTro luôn là 2 (nhân viên) khi tạo mới
      if (maVaiTro !== 2) {

      }

      // Chuẩn bị dữ liệu nhân viên theo đúng cấu trúc API
      const employeeData = {
        hoTen: hoTen.trim(),
        chucVuId: Number(chucVuId),
        caLamId: Number(caLamId),
        luongCoBan: Number(luongCoBan),
        maVaiTro: 2, // Luôn là 2 (nhân viên) khi tạo mới
        trangThai: trangThai !== undefined ? trangThai : true
      };

      // Gọi API tạo nhân viên
      const employeeResponse = await axios.post(`${BACKEND_API_URL}/NhanVien/Create`, employeeData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo nhân viên thành công',
        data: employeeResponse.data
      });
    } catch (error: any) {

      // Log chi tiết lỗi
      if (error.response) {



      } else if (error.request) {

      } else {

      }

      // Xác định loại lỗi và trả về thông báo phù hợp
      let errorMessage = 'Đã xảy ra lỗi khi tạo nhân viên';
      let errorDetails = null;

      if (error.response?.data) {
        errorDetails = error.response.data;
        errorMessage = error.response.data.message || errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }

      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: errorDetails || error.message,
        stack: error.stack
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
