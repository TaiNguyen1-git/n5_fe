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
      // Get services from backend API with pagination
      const response = await axios.get(`${BACKEND_API_URL}/DichVu/GetAll`, {
        params: {
          PageNumber: Number(pageNumber),
          PageSize: Number(pageSize)
        },
        timeout: 15000 // 15 second timeout
      });

      // Log response for debugging
      // Transform data for frontend if needed
      let services: any[] = [];
      let paginationInfo = {
        totalItems: 0,
        pageNumber: Number(pageNumber),
        pageSize: Number(pageSize),
        totalPages: 0
      };

      if (response.data) {
        // Check if response has pagination structure
        if (response.data.items && Array.isArray(response.data.items)) {
          services = response.data.items;
          paginationInfo = {
            totalItems: response.data.totalItems || response.data.items.length,
            pageNumber: response.data.pageNumber || Number(pageNumber),
            pageSize: response.data.pageSize || Number(pageSize),
            totalPages: response.data.totalPages || Math.ceil((response.data.totalItems || response.data.items.length) / Number(pageSize))
          };
        } else if (Array.isArray(response.data)) {
          // If response is directly an array (fallback)
          services = response.data;
          paginationInfo = {
            totalItems: response.data.length,
            pageNumber: Number(pageNumber),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(response.data.length / Number(pageSize))
          };
        }
      }

      // Log processed services
      // Transform services data for frontend
      const formattedServices = services.map((service: any) => ({
        id: service.maDichVu,
        maDichVu: service.maDichVu,
        ten: service.ten,
        moTa: service.moTa,
        hinhAnh: service.hinhAnh,
        gia: service.gia,
        trangThai: service.trangThai
      }));
      return res.status(200).json({
        success: true,
        data: {
          items: formattedServices,
          ...paginationInfo
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách dịch vụ'
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Check for required fields
      const { ten, moTa, hinhAnh, gia } = req.body;

      if (!ten || !moTa || !gia) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin dịch vụ'
        });
      }

      // Prepare service data
      const serviceData = {
        ten,
        moTa,
        hinhAnh,
        gia: Number(gia),
        trangThai: 1 // 1 = Active
      };

      // Create service through backend API
      const response = await axios.post(`${BACKEND_API_URL}/DichVu/Create`, serviceData);

      return res.status(201).json({
        success: true,
        message: 'Tạo dịch vụ thành công',
        data: response.data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi tạo dịch vụ'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }
}