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

      console.log('Creating employee with account - Request data:', req.body);

      // Bước 1: Tạo tài khoản người dùng
      console.log('Step 1: Creating user account...');

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
      console.log('Account data with exact field names and types:', {
        tenTK: typeof accountData.tenTK,
        matKhau: typeof accountData.matKhau,
        tenHienThi: typeof accountData.tenHienThi,
        email: typeof accountData.email,
        phone: typeof accountData.phone,
        loaiTK: typeof accountData.loaiTK,
        createAt: typeof accountData.createAt
      });

      console.log('Account data:', accountData);

      // Kiểm tra xem tài khoản đã tồn tại chưa
      try {
        console.log(`Checking if username ${tenTK} already exists...`);
        const checkUserResponse = await axios.get(`${BACKEND_API_URL}/User/GetByUsername?username=${tenTK}`, {
          timeout: 10000
        });

        console.log('Check user response:', checkUserResponse.data);

        // Nếu API trả về dữ liệu, tài khoản đã tồn tại
        if (checkUserResponse.data && checkUserResponse.data.tenTK) {
          throw new Error(`Tài khoản "${tenTK}" đã tồn tại trong hệ thống. Vui lòng chọn tên tài khoản khác.`);
        }
      } catch (checkError: any) {
        // Nếu lỗi là do không tìm thấy tài khoản, đó là điều tốt
        if (checkError.response && checkError.response.status === 404) {
          console.log(`Username ${tenTK} is available.`);
        }
        // Nếu lỗi là do tài khoản đã tồn tại, ném lỗi
        else if (checkError.message && checkError.message.includes('đã tồn tại')) {
          throw checkError;
        }
        // Nếu là lỗi khác, bỏ qua và tiếp tục tạo tài khoản
        else {
          console.warn('Error checking username, proceeding anyway:', checkError.message);
        }
      }

      // Gọi API tạo tài khoản
      console.log('Sending account data to API:', JSON.stringify(accountData));

      const accountResponse = await axios.post(`${BACKEND_API_URL}/User/Create`, accountData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });

      console.log('Account created successfully:', accountResponse.data);

      // Bước 2: Tạo nhân viên
      console.log('Step 2: Creating employee...');

      // Chuẩn bị dữ liệu nhân viên theo đúng cấu trúc API
      const employeeData = {
        hoTen: hoTen,
        chucVuId: Number(chucVuId) || 2,
        caLamId: Number(caLamId) || 1,
        luongCoBan: Number(luongCoBan) || 0,
        maVaiTro: Number(maVaiTro) || 2,
        trangThai: trangThai !== undefined ? trangThai : true
      };

      console.log('Employee data:', employeeData);

      // Gọi API tạo nhân viên
      const employeeResponse = await axios.post(`${BACKEND_API_URL}/NhanVien/Create`, employeeData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      });

      console.log('Employee created successfully:', employeeResponse.data);

      return res.status(201).json({
        success: true,
        message: 'Tạo nhân viên và tài khoản thành công',
        data: {
          account: accountResponse.data,
          employee: employeeResponse.data
        }
      });
    } catch (error: any) {
      console.error('Error creating employee with account:', error);

      // Log chi tiết lỗi
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
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
