import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  items?: any[];
};

const API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Extract pagination parameters from query
      const { PageNumber = 1, PageSize = 10 } = req.query;

      // Forward the request to the actual API with pagination
      const response = await axios.get(`${API_URL}/DatPhong/GetAll`, {
        params: {
          PageNumber: parseInt(PageNumber as string),
          PageSize: parseInt(PageSize as string)
        },
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      // Return the response data
      return res.status(200).json(response.data);
    } catch (error: any) {
      // Extract pagination parameters for mock data
      const pageNumber = parseInt(req.query.PageNumber as string) || 1;
      const pageSize = parseInt(req.query.PageSize as string) || 10;

      // Generate mock data as fallback
      const today = dayjs();
      const allMockBookings = [
        {
          maDatPhong: 1,
          maPhong: 101,
          tenKH: 'Nguyễn Văn A',
          phone: '0123456789',
          email: 'nguyenvana@email.com',
          checkIn: today.format('YYYY-MM-DD'),
          checkOut: today.add(2, 'day').format('YYYY-MM-DD'),
          tongTien: 1500000,
          soLuongKhach: 2,
          trangThai: 1,
          ngayTao: today.subtract(1, 'day').format('YYYY-MM-DD')
        },
        {
          maDatPhong: 2,
          maPhong: 102,
          tenKH: 'Trần Thị B',
          phone: '0987654321',
          email: 'tranthib@email.com',
          checkIn: today.subtract(2, 'day').format('YYYY-MM-DD'),
          checkOut: today.format('YYYY-MM-DD'),
          tongTien: 1200000,
          soLuongKhach: 1,
          trangThai: 2,
          ngayTao: today.subtract(3, 'day').format('YYYY-MM-DD')
        },
        {
          maDatPhong: 3,
          maPhong: 103,
          tenKH: 'Lê Văn C',
          phone: '0369852147',
          email: 'levanc@email.com',
          checkIn: today.add(1, 'day').format('YYYY-MM-DD'),
          checkOut: today.add(3, 'day').format('YYYY-MM-DD'),
          tongTien: 2000000,
          soLuongKhach: 3,
          trangThai: 1,
          ngayTao: today.format('YYYY-MM-DD')
        }
      ];

      // Calculate pagination for mock data
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBookings = allMockBookings.slice(startIndex, endIndex);

      // Return mock data in the same format as the API would with pagination
      return res.status(200).json({
        success: true,
        message: 'Using mock data as fallback',
        items: paginatedBookings,
        totalItems: allMockBookings.length, // Use totalItems to match API format
        totalCount: allMockBookings.length, // Keep for backward compatibility
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: Math.ceil(allMockBookings.length / pageSize),
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < Math.ceil(allMockBookings.length / pageSize)
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
