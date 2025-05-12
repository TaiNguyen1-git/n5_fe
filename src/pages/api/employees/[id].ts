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
      message: 'ID nhân viên không hợp lệ'
    });
  }

  if (req.method === 'GET') {
    try {
      // Get specific employee from backend API
      const response = await axios.get(`${BACKEND_API_URL}/NhanVien/GetById?id=${id}`);

      if (!response.data) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên'
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      console.error(`Error fetching employee with id ${id}:`, error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin nhân viên'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Log request body for debugging
      console.log(`PUT /api/employees/${id} - Request body:`, req.body);

      // Update employee using API structure
      const { hoTen_, chucVu_, taiKhoan_, matKhau_, luongCoBan, trangThai } = req.body;

      // Prepare employee data according to API structure
      const employeeData: any = {};
      if (hoTen_) employeeData.hoTen_ = hoTen_;
      if (chucVu_) employeeData.chucVu_ = chucVu_;
      if (taiKhoan_) employeeData.taiKhoan_ = taiKhoan_;
      if (matKhau_) employeeData.matKhau_ = matKhau_;
      if (luongCoBan !== undefined) employeeData.luongCoBan = Number(luongCoBan);
      if (trangThai !== undefined) employeeData.trangThai = trangThai;

      console.log(`Sending to API for update:`, employeeData);

      // Update employee through backend API - sử dụng đúng endpoint và cấu trúc API
      const response = await axios.put(`${BACKEND_API_URL}/NhanVien/Update`, employeeData);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật nhân viên thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error(`Error updating employee with id ${id}:`, error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin nhân viên'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete employee through backend API - sử dụng đúng endpoint với tham số query id
      console.log(`Deleting employee with id ${id}`);
      const response = await axios.delete(`${BACKEND_API_URL}/NhanVien/Delete?id=${id}`);

      return res.status(200).json({
        success: true,
        message: 'Xóa nhân viên thành công',
        data: response.data
      });
    } catch (error: any) {
      console.error(`Error deleting employee with id ${id}:`, error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa nhân viên'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
