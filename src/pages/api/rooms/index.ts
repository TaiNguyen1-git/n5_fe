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
      // Parse query parameters
      const { giaMin, giaMax, soLuongKhach } = req.query;
      
      // Build query string for filtering
      let url = `${BACKEND_API_URL}/Phong/GetAll`;
      const params = new URLSearchParams();
      
      if (giaMin && typeof giaMin === 'string') {
        params.append('giaMin', giaMin);
      }
      
      if (giaMax && typeof giaMax === 'string') {
        params.append('giaMax', giaMax);
      }
      
      if (soLuongKhach && typeof soLuongKhach === 'string') {
        params.append('soLuongKhach', soLuongKhach);
      }
      
      // Add params to URL if they exist
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      // Make the request to the backend
      const response = await axios.get(url);
      
      // Transform the data to match the frontend structure
      const rooms = response.data.map((room: any) => ({
        id: room.maPhong.toString(),
        maPhong: room.maPhong,
        tenPhong: room.ten || room.tenPhong,
        moTa: room.moTa,
        hinhAnh: room.hinhAnh,
        giaTien: room.giaTien || room.gia,
        soLuongKhach: room.soLuongKhach,
        trangThai: room.trangThai,
        loaiPhong: room.loaiPhong,
        images: [room.hinhAnh],
        features: room.moTa.split(',').map((item: string) => item.trim())
      }));
      
      return res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Không thể lấy danh sách phòng. Vui lòng thử lại sau.' 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ 
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ` 
    });
  }
} 