import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
      const response = await axios.get(`${API_URL}/Phong/GetAll`, {
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
      const mockRooms = [
        {
          maPhong: 101,
          soPhong: '101',
          soNguoi: 2,
          moTa: 'Phòng đôi tiêu chuẩn',
          trangThai: 1,
          trangThaiPhong: {
            maTT: 1,
            tenTT: 'Trống'
          },
          loaiPhong: {
            maLoai: 1,
            tenLoai: 'Standard',
            giaPhong: 500000
          }
        },
        {
          maPhong: 102,
          soPhong: '102',
          soNguoi: 2,
          moTa: 'Phòng đôi tiêu chuẩn',
          trangThai: 2,
          trangThaiPhong: {
            maTT: 2,
            tenTT: 'Đang sử dụng'
          },
          loaiPhong: {
            maLoai: 1,
            tenLoai: 'Standard',
            giaPhong: 500000
          }
        },
        {
          maPhong: 201,
          soPhong: '201',
          soNguoi: 4,
          moTa: 'Phòng gia đình cao cấp',
          trangThai: 1,
          trangThaiPhong: {
            maTT: 1,
            tenTT: 'Trống'
          },
          loaiPhong: {
            maLoai: 2,
            tenLoai: 'Deluxe',
            giaPhong: 800000
          }
        },
        {
          maPhong: 301,
          soPhong: '301',
          soNguoi: 2,
          moTa: 'Phòng đôi hạng sang',
          trangThai: 1,
          trangThaiPhong: {
            maTT: 1,
            tenTT: 'Trống'
          },
          loaiPhong: {
            maLoai: 3,
            tenLoai: 'Suite',
            giaPhong: 1200000
          }
        }
      ];
      
      // Return mock data in the same format as the API would
      return res.status(200).json({
        success: true,
        message: 'Using mock data as fallback',
        items: mockRooms
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Phương thức ${req.method} không được hỗ trợ` });
  }
}
