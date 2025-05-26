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
      const { giaMin, giaMax, soLuongKhach, pageNumber = '1', pageSize = '10' } = req.query;



      // Build query string for filtering and pagination
      let url = `${BACKEND_API_URL}/Phong/GetAll`;
      const params = new URLSearchParams();

      // Add pagination parameters
      params.append('PageNumber', pageNumber.toString());
      params.append('PageSize', pageSize.toString());

      // Add filtering parameters
      if (giaMin && typeof giaMin === 'string') {
        params.append('giaMin', giaMin);
      }

      if (giaMax && typeof giaMax === 'string') {
        params.append('giaMax', giaMax);
      }

      if (soLuongKhach && typeof soLuongKhach === 'string') {
        params.append('soLuongKhach', soLuongKhach);
      }

      // Add params to URL
      url += `?${params.toString()}`;

      // Make the request to the backend
      const response = await axios.get(url, {
        validateStatus: function () {
          return true; // Accept all status codes
        }
      });

      // Check if the response is successful
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`API returned status code ${response.status}`);
      }

      // Handle the API response format with pagination
      let items = [];
      let paginationInfo = {
        totalItems: 0,
        pageNumber: Number(pageNumber),
        pageSize: Number(pageSize),
        totalPages: 0
      };

      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        items = response.data.items;
        paginationInfo = {
          totalItems: response.data.totalItems || response.data.items.length,
          pageNumber: response.data.pageNumber || Number(pageNumber),
          pageSize: response.data.pageSize || Number(pageSize),
          totalPages: response.data.totalPages || Math.ceil((response.data.totalItems || response.data.items.length) / Number(pageSize))
        };
      } else if (Array.isArray(response.data)) {
        // If response is directly an array (fallback)
        items = response.data;
        paginationInfo = {
          totalItems: response.data.length,
          pageNumber: Number(pageNumber),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(response.data.length / Number(pageSize))
        };
      } else {
        items = [];
      }

      // Transform the data to match the frontend structure
      const rooms = items.map((room: any) => {
        // Extract loaiPhong which could be a string or an object
        let roomType = 'Standard';
        let roomPrice = 800000;

        // First try to get room type from tenLoaiPhong field
        if (room.tenLoaiPhong) {
          roomType = room.tenLoaiPhong;
        } else if (room.loaiPhong) {
          if (typeof room.loaiPhong === 'string') {
            roomType = room.loaiPhong;
          } else if (typeof room.loaiPhong === 'object' && room.loaiPhong.tenLoai) {
            roomType = room.loaiPhong.tenLoai;
          }
        }

        // Get room price from loaiPhong object
        if (room.loaiPhong && typeof room.loaiPhong === 'object' && room.loaiPhong.giaPhong) {
          roomPrice = room.loaiPhong.giaPhong;
        }

        // Extract room status
        let roomStatus = 1; // Default: available
        let statusName = '';

        if (room.trangThaiPhong && room.trangThaiPhong.maTT) {
          roomStatus = room.trangThaiPhong.maTT;
          statusName = room.trangThaiPhong.tenTT || '';
        } else if (room.trangThai !== undefined) {
          roomStatus = room.trangThai;
          statusName = room.tenTT || '';
        }

        // Handle features
        let features = [];
        if (room.moTa) {
          try {
            features = room.moTa.split(',').map((item: string) => item.trim());
          } catch (e) {
            features = [room.moTa];
          }
        }

        return {
          id: room.maPhong?.toString() || '0',
          maPhong: room.maPhong || 0,
          tenPhong: room.ten || room.tenPhong || `Phòng ${room.soPhong || ''}`,
          moTa: room.moTa || '',
          hinhAnh: room.hinhAnh || '/images/rooms/default-room.jpg',
          giaTien: roomPrice,
          soLuongKhach: room.soNguoi || room.soLuongKhach || 2,
          trangThai: roomStatus,
          trangThaiTen: statusName,
          loaiPhong: roomType,
          images: [room.hinhAnh || '/images/rooms/default-room.jpg'],
          features: features,
          soPhong: room.soPhong || ''
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          items: rooms,
          ...paginationInfo
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        data: []
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