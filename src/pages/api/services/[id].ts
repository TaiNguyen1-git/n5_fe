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
      message: 'ID dịch vụ không hợp lệ'
    });
  }

  if (req.method === 'GET') {
    try {
      console.log('API: Getting service with ID:', id);

      // Validate ID
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID dịch vụ không hợp lệ'
        });
      }

      // Use GetById API (confirmed to exist)
      console.log('API: Using GetById method for service ID:', id);

      const response = await axios.get(`${BACKEND_API_URL}/DichVu/GetById?id=${id}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('API: GetById response status:', response.status);
      console.log('API: GetById response data:', response.data);

      const serviceData = response.data;

      if (!serviceData) {
        console.log('API: No service data found');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }

      // Transform data for frontend
      const service = {
        id: serviceData.maDichVu,
        maDichVu: serviceData.maDichVu,
        ten: serviceData.ten,
        moTa: serviceData.moTa,
        hinhAnh: serviceData.hinhAnh,
        gia: serviceData.gia,
        trangThai: serviceData.trangThai
      };

      console.log('API: Transformed service data:', service);

      return res.status(200).json({
        success: true,
        data: service
      });
    } catch (error: any) {
      console.error('API: Error getting service:', error.message);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Full error:', error);

      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi lấy thông tin dịch vụ'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check for required fields
      const { ten, moTa, hinhAnh, gia, trangThai } = req.body;

      if (!ten || !moTa || !gia) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin dịch vụ'
        });
      }

      // Prepare service data
      const serviceData = {
        maDichVu: id,
        ten,
        moTa,
        hinhAnh,
        gia: Number(gia),
        trangThai: trangThai !== undefined ? Number(trangThai) : 1
      };

      // Log dữ liệu trước khi gọi API
      // Update service through backend API
      const response = await axios.put(`${BACKEND_API_URL}/DichVu/Update`, serviceData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return res.status(200).json({
        success: true,
        message: 'Cập nhật dịch vụ thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật dịch vụ'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete service through backend API
      await axios.delete(`${BACKEND_API_URL}/DichVu/Delete?id=${id}`);

      return res.status(200).json({
        success: true,
        message: 'Xóa dịch vụ thành công'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa dịch vụ'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }
}