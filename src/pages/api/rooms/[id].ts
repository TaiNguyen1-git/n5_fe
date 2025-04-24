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
      message: 'ID phòng không hợp lệ' 
    });
  }
  
  if (req.method === 'GET') {
    try {
      // Lấy thông tin phòng từ backend API
      const response = await axios.get(`${BACKEND_API_URL}/Phong/GetById?id=${id}`);
      
      if (!response.data) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy phòng' 
        });
      }
      
      // Chuyển đổi dữ liệu theo cấu trúc frontend
      const room = {
        id: response.data.maPhong.toString(),
        maPhong: response.data.maPhong,
        name: response.data.ten || response.data.tenPhong,
        price: response.data.giaTien || response.data.gia,
        description: response.data.moTa,
        features: response.data.moTa ? response.data.moTa.split(',').map((item: string) => item.trim()) : [],
        imageUrl: response.data.hinhAnh,
        images: [response.data.hinhAnh],
        maxGuests: response.data.soLuongKhach,
        beds: [{ type: 'Giường đôi', count: 1 }], // Giả định mặc định nếu không có thông tin về giường
        loaiPhong: response.data.loaiPhong,
        trangThai: response.data.trangThai
      };
      
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(`Error fetching room with ID ${id}:`, error);
      return res.status(500).json({ 
        success: false,
        message: 'Không thể lấy thông tin phòng. Vui lòng thử lại sau.' 
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