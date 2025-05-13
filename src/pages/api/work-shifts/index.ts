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
  if (req.method === 'GET') {
    try {
      // Get work shifts from backend API
      const response = await axios.get(`${BACKEND_API_URL}/CaLam/GetAll`, {
        timeout: 15000 // 15 second timeout
      });

      // Log response for debugging
      console.log('API CaLam/GetAll response:', JSON.stringify(response.data).substring(0, 500) + '...');

      // Transform data for frontend if needed
      let workShifts = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          workShifts = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          workShifts = response.data.items;
        }
      }

      return res.status(200).json({
        success: true,
        data: workShifts
      });
    } catch (error: any) {
      console.error('Error fetching work shifts:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách ca làm'
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Log request body for debugging
      console.log('POST /api/work-shifts - Request body:', req.body);

      // Check for required fields
      const { tenCa, gioBatDau, gioKetThuc, ngayLamViec, maNV, ghiChu } = req.body;

      if (!tenCa || !gioBatDau || !gioKetThuc || !ngayLamViec) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin ca làm'
        });
      }

      // Prepare work shift data
      const workShiftData = {
        tenCa,
        gioBatDau,
        gioKetThuc,
        ngayLamViec,
        maNV: maNV || null,
        ghiChu: ghiChu || '',
        trangThai: 1 // Default active status
      };

      console.log('Sending to API:', workShiftData);

      // Create work shift through backend API
      const response = await axios.post(`${BACKEND_API_URL}/CaLam/Create`, workShiftData);

      console.log('API response:', response.data);

      return res.status(201).json({
        success: true,
        message: 'Tạo ca làm thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error('Error creating work shift:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo ca làm mới'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
