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
      // Forward the request to the actual API
      const response = await axios.get(`${API_URL}/DatPhong/GetAll`, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      // Return the response data
      return res.status(200).json(response.data);
    } catch (error: any) {
      console.error('API proxy error:', error.message);
      console.log('Using mock data as fallback');

      // Generate mock data as fallback
      const today = dayjs();
      const mockBookings = [
        {
          maDatPhong: 1,
          maPhong: 101,
          tenKH: 'Nguyễn Văn A',
          ngayBatDau: today.format('YYYY-MM-DD'),
          ngayKetThuc: today.add(2, 'day').format('YYYY-MM-DD'),
          trangThai: 1
        },
        {
          maDatPhong: 2,
          maPhong: 102,
          tenKH: 'Trần Thị B',
          ngayBatDau: today.subtract(2, 'day').format('YYYY-MM-DD'),
          ngayKetThuc: today.format('YYYY-MM-DD'),
          trangThai: 1
        },
        {
          maDatPhong: 3,
          maPhong: 103,
          tenKH: 'Lê Văn C',
          ngayBatDau: today.add(1, 'day').format('YYYY-MM-DD'),
          ngayKetThuc: today.add(3, 'day').format('YYYY-MM-DD'),
          trangThai: 1
        }
      ];

      // Return mock data in the same format as the API would
      return res.status(200).json({
        success: true,
        message: 'Using mock data as fallback',
        items: mockBookings
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
