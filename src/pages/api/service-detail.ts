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
      // Validate ID
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID dịch vụ không hợp lệ'
        });
      }

      // Use GetAll and filter by ID (more reliable data structure)

      const response = await axios.get(`${BACKEND_API_URL}/DichVu/GetAll`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Find service by ID in the list
      let services = [];
      if (response.data?.items) {
        services = response.data.items;
      } else if (Array.isArray(response.data)) {
        services = response.data;
      }

      const serviceData = services.find((service: any) => {
        return service.maDichVu === Number(id);
      });

      if (!serviceData) {
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
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }
}
