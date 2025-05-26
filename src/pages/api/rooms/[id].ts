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
      // Try multiple API endpoints to find the room
      let response;
      let room;
      let success = false;

      // First try: GetById endpoint
      try {
        response = await axios.get(`${BACKEND_API_URL}/Phong/GetById?id=${id}`, {
          timeout: 8000,
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          },
          validateStatus: function () {
            return true; // Accept all status codes
          }
        });

        if (response.status >= 200 && response.status < 300 && response.data) {
          success = true;
          room = {
            id: response.data.maPhong?.toString() || id,
            maPhong: response.data.maPhong || parseInt(id as string) || 0,
            name: response.data.ten || response.data.tenPhong || `Phòng ${id}`,
            price: response.data.giaTien || response.data.gia || response.data.giaPhong || 800000,
            description: response.data.moTa || '',
            features: response.data.moTa ? response.data.moTa.split(',').map((item: string) => item.trim()) : [],
            imageUrl: response.data.hinhAnh || '/images/rooms/default-room.jpg',
            images: [response.data.hinhAnh || '/images/rooms/default-room.jpg'],
            maxGuests: response.data.soLuongKhach || 2,
            beds: [{ type: 'Giường đôi', count: 1 }],
            loaiPhong: response.data.loaiPhong || 'Standard',
            trangThai: response.data.trangThai || 1,
            soPhong: response.data.soPhong || id
          };
        }
      } catch (error) {
      }

      // Second try: GetBySoPhong endpoint
      if (!success) {
        try {
          // Try with 'p' prefix for room number
          response = await axios.get(`${BACKEND_API_URL}/Phong/GetBySoPhong/p${id}`, {
            timeout: 8000,
            headers: {
              'Accept': '*/*',
              'Content-Type': 'application/json'
            },
            validateStatus: function () {
              return true; // Accept all status codes
            }
          });

          if (response.status >= 200 && response.status < 300 && response.data) {
            success = true;
            room = {
              id: response.data.maPhong?.toString() || id,
              maPhong: response.data.maPhong || parseInt(id as string) || 0,
              name: response.data.ten || response.data.tenPhong || `Phòng ${id}`,
              price: response.data.giaTien || response.data.gia || response.data.giaPhong || 800000,
              description: response.data.moTa || '',
              features: response.data.moTa ? response.data.moTa.split(',').map((item: string) => item.trim()) : [],
              imageUrl: response.data.hinhAnh || '/images/rooms/default-room.jpg',
              images: [response.data.hinhAnh || '/images/rooms/default-room.jpg'],
              maxGuests: response.data.soLuongKhach || 2,
              beds: [{ type: 'Giường đôi', count: 1 }],
              loaiPhong: response.data.loaiPhong || 'Standard',
              trangThai: response.data.trangThai || 1,
              soPhong: response.data.soPhong || id
            };
          }
        } catch (error) {
        }
      }

      // Third try: GetAll and filter
      if (!success) {
        try {
          response = await axios.get(`${BACKEND_API_URL}/Phong/GetAll`, {
            timeout: 8000,
            headers: {
              'Accept': '*/*',
              'Content-Type': 'application/json'
            },
            validateStatus: function () {
              return true; // Accept all status codes
            }
          });

          if (response.status >= 200 && response.status < 300 && response.data) {
            // Handle the specific API response format with "items" array
            let items = [];

            if (response.data.items && Array.isArray(response.data.items)) {
              items = response.data.items;
            } else if (Array.isArray(response.data)) {
              items = response.data;
            }

            // Find room by ID or room number
            const foundRoom = items.find((r: any) => {
              // Check various possible formats for room number
              const roomIdMatch = r.maPhong?.toString() === id.toString();
              const roomNumberMatch = r.soPhong?.toString() === id.toString();
              const roomNumberPrefixMatch = r.soPhong?.toString() === `p${id}`;

              return roomIdMatch || roomNumberMatch || roomNumberPrefixMatch;
            });

            if (foundRoom) {
              success = true;

              // Extract loaiPhong which could be a string or an object
              let roomType = 'Standard';
              let roomPrice = 800000;

              if (foundRoom.loaiPhong) {
                if (typeof foundRoom.loaiPhong === 'string') {
                  roomType = foundRoom.loaiPhong;
                } else if (typeof foundRoom.loaiPhong === 'object' && foundRoom.loaiPhong.tenLoai) {
                  roomType = foundRoom.loaiPhong.tenLoai;
                  roomPrice = foundRoom.loaiPhong.giaPhong || 800000;
                }
              }

              // Extract room status
              let roomStatus = 1; // Default: available
              if (foundRoom.trangThaiPhong && foundRoom.trangThaiPhong.maTT) {
                roomStatus = foundRoom.trangThaiPhong.maTT;
              } else if (foundRoom.trangThai !== undefined) {
                roomStatus = foundRoom.trangThai;
              }

              room = {
                id: foundRoom.maPhong?.toString() || id,
                maPhong: foundRoom.maPhong || parseInt(id as string) || 0,
                name: foundRoom.ten || foundRoom.tenPhong || `Phòng ${foundRoom.soPhong || id}`,
                price: roomPrice,
                description: foundRoom.moTa || 'Thông tin phòng không có sẵn',
                features: foundRoom.moTa ? foundRoom.moTa.split(',').map((item: string) => item.trim()) : ['Wifi', 'Điều hòa', 'TV'],
                imageUrl: foundRoom.hinhAnh || '/images/rooms/default-room.jpg',
                images: [foundRoom.hinhAnh || '/images/rooms/default-room.jpg'],
                maxGuests: foundRoom.soNguoi || foundRoom.soLuongKhach || 2,
                beds: [{ type: 'Giường đôi', count: 1 }],
                loaiPhong: roomType,
                trangThai: roomStatus,
                soPhong: foundRoom.soPhong || id
              };
            }
          }
        } catch (error) {
        }
      }

      // If all attempts failed, return error
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin phòng'
        });
      }

      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kết nối đến máy chủ'
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