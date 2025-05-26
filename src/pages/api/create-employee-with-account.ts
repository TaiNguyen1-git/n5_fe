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
        tenTK, matKhau, hoTen, email, phone,
        chucVuId, caLamId, luongCoBan, maVaiTro, trangThai
      } = req.body;

      // Bước 1: Tạo tài khoản người dùng

      // Kiểm tra dữ liệu đầu vào
      if (!tenTK || !tenTK.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên tài khoản không được để trống'
        });
      }

      if (!matKhau || !matKhau.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu không được để trống'
        });
      }

      // Chuẩn bị dữ liệu tài khoản theo đúng định dạng API
      const accountData = {
        tenTK: tenTK.trim(),
        matKhau: matKhau.trim(),
        tenHienThi: hoTen || tenTK,
        email: email || '',
        phone: phone || '',
        loaiTK: 2, // Nhân viên
        createAt: new Date().toISOString()
      };

      // Log dữ liệu chi tiết

      // Kiểm tra xem tài khoản đã tồn tại chưa
      try {

        const checkUserResponse = await axios.get(`${BACKEND_API_URL}/User/GetByUsername?username=${tenTK}`, {
          timeout: 10000
        });

        // Nếu API trả về dữ liệu, tài khoản đã tồn tại
        if (checkUserResponse.data && checkUserResponse.data.tenTK) {
          throw new Error(`Tài khoản "${tenTK}" đã tồn tại trong hệ thống. Vui lòng chọn tên tài khoản khác.`);
        }
      } catch (checkError: any) {
        // Nếu lỗi là do không tìm thấy tài khoản, đó là điều tốt
        if (checkError.response && checkError.response.status === 404) {

        }
        // Nếu lỗi là do tài khoản đã tồn tại, ném lỗi
        else if (checkError.message && checkError.message.includes('đã tồn tại')) {
          throw checkError;
        }
        // Nếu là lỗi khác, bỏ qua và tiếp tục tạo tài khoản
        else {

        }
      }

      // Gọi API tạo tài khoản

      const accountResponse = await axios.post(`${BACKEND_API_URL}/User/Create`, accountData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });

      // Bước 2: Tạo nhân viên

      // Chuẩn bị dữ liệu nhân viên theo đúng cấu trúc API
      const employeeData = {
        hoTen: hoTen,
        chucVuId: Number(chucVuId) || 2,
        caLamId: Number(caLamId) || 1,
        luongCoBan: Number(luongCoBan) || 0,
        maVaiTro: Number(maVaiTro) || 2,
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
        message: 'Tạo nhân viên và tài khoản thành công',
        data: {
          account: accountResponse.data,
          employee: employeeResponse.data
        }
      });
    } catch (error: any) {

      // Log chi tiết lỗi
      if (error.response) {



      } else if (error.request) {

      } else {

      }

      // Xác định loại lỗi và trả về thông báo phù hợp
      let errorMessage = 'Đã xảy ra lỗi khi tạo nhân viên và tài khoản';
      let errorDetails = null;

      if (error.response?.data) {
        errorDetails = error.response.data;

        // Kiểm tra xem lỗi có phải từ API tạo tài khoản không
        if (error.message.includes('User/Create') ||
            (error.response.data.message && error.response.data.message.toLowerCase().includes('tài khoản'))) {
          errorMessage = 'Lỗi khi tạo tài khoản: ' + (error.response.data.message || error.message);
        }
        // Kiểm tra xem lỗi có phải từ API tạo nhân viên không
        else if (error.message.includes('NhanVien/Create') ||
                (error.response.data.message && error.response.data.message.toLowerCase().includes('nhân viên'))) {
          errorMessage = 'Lỗi khi tạo thông tin nhân viên: ' + (error.response.data.message || error.message);
        }
        // Lỗi khác
        else {
          errorMessage = error.response.data.message || errorMessage;
        }
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
