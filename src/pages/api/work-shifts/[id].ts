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
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID ca làm không hợp lệ'
    });
  }

  if (req.method === 'GET') {
    try {
      // Get specific work shift from backend API
      const response = await axios.get(`${BACKEND_API_URL}/CaLam/GetById?id=${id}`);

      if (!response.data) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ca làm'
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin ca làm'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Log request body for debugging
      // Update work shift using API structure
      const { tenCa, gioBatDau, gioKetThuc, ngayLamViec, maNV, ghiChu, trangThai } = req.body;

      // Prepare work shift data according to API structure
      const workShiftData: any = {
        id: parseInt(id)
      };
      
      if (tenCa) workShiftData.tenCa = tenCa;
      if (gioBatDau) workShiftData.gioBatDau = gioBatDau;
      if (gioKetThuc) workShiftData.gioKetThuc = gioKetThuc;
      if (ngayLamViec) workShiftData.ngayLamViec = ngayLamViec;
      if (maNV !== undefined) workShiftData.maNV = maNV;
      if (ghiChu !== undefined) workShiftData.ghiChu = ghiChu;
      if (trangThai !== undefined) workShiftData.trangThai = trangThai;
      // Update work shift through backend API
      const response = await axios.put(`${BACKEND_API_URL}/CaLam/Update`, workShiftData);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật ca làm thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin ca làm'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete work shift through backend API
      const response = await axios.delete(`${BACKEND_API_URL}/CaLam/Delete?id=${id}`);

      return res.status(200).json({
        success: true,
        message: 'Xóa ca làm thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa ca làm'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
