import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

interface ResponseData {
  success: boolean;
  message?: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    try {
      // Get pagination parameters from query
      const { pageNumber = '1', pageSize = '10' } = req.query;

      console.log(`Fetching customers with pagination: page ${pageNumber}, size ${pageSize}`);

      // Get customers from backend API with pagination
      const response = await axios.get(`${BACKEND_API_URL}/KhachHang/GetAll`, {
        params: {
          PageNumber: Number(pageNumber),
          PageSize: Number(pageSize)
        },
        timeout: 15000 // 15 second timeout
      });

      // Log response for debugging
      console.log('API KhachHang/GetAll response:', JSON.stringify(response.data).substring(0, 500) + '...');

      // Transform data for frontend if needed
      let customers: any[] = [];
      let paginationInfo = {
        totalItems: 0,
        pageNumber: Number(pageNumber),
        pageSize: Number(pageSize),
        totalPages: 0
      };

      if (response.data) {
        // Check if response has pagination structure
        if (response.data.items && Array.isArray(response.data.items)) {
          customers = response.data.items;
          paginationInfo = {
            totalItems: response.data.totalItems || response.data.items.length,
            pageNumber: response.data.pageNumber || Number(pageNumber),
            pageSize: response.data.pageSize || Number(pageSize),
            totalPages: response.data.totalPages || Math.ceil((response.data.totalItems || response.data.items.length) / Number(pageSize))
          };
        } else if (Array.isArray(response.data)) {
          // If response is directly an array (fallback)
          customers = response.data;
          paginationInfo = {
            totalItems: response.data.length,
            pageNumber: Number(pageNumber),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(response.data.length / Number(pageSize))
          };
        }
      }

      // Log processed customers
      console.log(`Processed ${customers.length} customers`);
      console.log('Pagination info:', paginationInfo);

      // Đảm bảo dữ liệu khách hàng có các trường cần thiết
      const formattedCustomers = customers.map((customer: any) => ({
        maKH: customer.maKH || customer.id,
        tenKH: customer.tenKH || customer.hoTen,
        email: customer.email,
        phone: customer.phone || customer.soDienThoai,
        maVaiTro: customer.maVaiTro,
        vaiTro: customer.vaiTro,
        xoa: customer.xoa !== undefined ? customer.xoa : false,
        trangThai: customer.trangThai !== undefined ? customer.trangThai : true
      }));

      console.log('Formatted customers sample:', formattedCustomers.length > 0 ? formattedCustomers[0] : 'No customers');

      return res.status(200).json({
        success: true,
        data: {
          items: formattedCustomers,
          ...paginationInfo
        }
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách khách hàng'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
