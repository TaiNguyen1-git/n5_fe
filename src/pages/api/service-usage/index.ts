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
      // Get pagination parameters from query
      const { pageNumber = '1', pageSize = '10' } = req.query;
      
      // Get service usage history from backend API
      const response = await axios.get(`${BACKEND_API_URL}/SuDungDichVu/GetAll`, {
        params: {
          PageNumber: Number(pageNumber),
          PageSize: Number(pageSize)
        },
        timeout: 15000 // 15 second timeout
      });

      // Transform data for frontend if needed
      let serviceUsages: any[] = [];
      let paginationInfo = {
        totalItems: 0,
        pageNumber: Number(pageNumber),
        pageSize: Number(pageSize),
        totalPages: 0
      };

      if (response.data) {
        if (response.data.items && Array.isArray(response.data.items)) {
          // If response has pagination structure
          serviceUsages = response.data.items;
          paginationInfo = {
            totalItems: response.data.totalItems || 0,
            pageNumber: response.data.pageNumber || Number(pageNumber),
            pageSize: response.data.pageSize || Number(pageSize),
            totalPages: response.data.totalPages || 0
          };
        } else if (Array.isArray(response.data)) {
          // If response is directly an array (fallback)
          serviceUsages = response.data;
          paginationInfo = {
            totalItems: response.data.length,
            pageNumber: Number(pageNumber),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(response.data.length / Number(pageSize))
          };
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          items: serviceUsages,
          ...paginationInfo
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy lịch sử sử dụng dịch vụ'
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Check for required fields
      const { maKH, maDV, ngaySD, soLuong, thanhTien, trangThai } = req.body;

      if (!maKH || !maDV || !ngaySD || !soLuong || !thanhTien) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin đặt dịch vụ'
        });
      }

      // Prepare service usage data
      const serviceUsageData = {
        maKH: Number(maKH),
        maDV: Number(maDV),
        ngaySD,
        soLuong: Number(soLuong),
        thanhTien: Number(thanhTien),
        trangThai: trangThai || 'Đã đặt',
        xoa: false
      };

      // Create service usage through backend API
      const response = await axios.post(`${BACKEND_API_URL}/SuDungDichVu/Create`, serviceUsageData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Đặt dịch vụ thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi đặt dịch vụ'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check for required fields
      const { id, maKH, maDV, ngaySD, soLuong, thanhTien, trangThai } = req.body;

      if (!id || !maKH || !maDV || !ngaySD || !soLuong || !thanhTien) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin cập nhật dịch vụ'
        });
      }

      // Prepare service usage data for update
      const serviceUsageData = {
        maSDDV: Number(id),
        maKH: Number(maKH),
        maDV: Number(maDV),
        ngaySD,
        soLuong: Number(soLuong),
        thanhTien: Number(thanhTien),
        trangThai: trangThai || 'Đã đặt',
        xoa: false
      };

      // Update service usage through backend API
      const response = await axios.put(`${BACKEND_API_URL}/SuDungDichVu/Update`, serviceUsageData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật sử dụng dịch vụ thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật sử dụng dịch vụ'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ID sử dụng dịch vụ cần xóa'
        });
      }

      // Delete service usage through backend API
      const response = await axios.delete(`${BACKEND_API_URL}/SuDungDichVu/Delete?id=${id}`, {
        timeout: 15000
      });

      return res.status(200).json({
        success: true,
        message: 'Xóa sử dụng dịch vụ thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa sử dụng dịch vụ'
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }
}
