import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// API backend URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  // Lấy ID phòng từ tham số route
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID phòng không hợp lệ'
    });
  }

  // Xử lý ID có thể là mảng hoặc chứa /
  let roomId = Array.isArray(id) ? id[0] : id;

  // Loại bỏ các ký tự / nếu có trong id
  roomId = roomId.split('/')[0];

  // Trong trường hợp id là số phòng (ví dụ: 404, 7, etc.)
  try {
    // Gọi API với endpoint đúng format
    const apiEndpoint = `${BACKEND_API_URL}/Phong/GetBySoPhong/p${roomId}`;
    const response = await axios.get(apiEndpoint, {
      timeout: 20000,
      headers: { 'Accept': '*/*' }
    });

    // Kiểm tra nếu không có dữ liệu
    if (!response || !response.data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    // Lấy dữ liệu từ API đúng cấu trúc
    const roomData = response.data;
    // Lấy giá từ loaiPhong.giaPhong nếu có
    // Kiểm tra cấu trúc dữ liệu và lấy giá từ loaiPhong
    let roomPrice = null;
    if (roomData.giaTien) {
      roomPrice = roomData.giaTien;
    } else if (roomData.loaiPhong && roomData.loaiPhong.giaPhong) {
      roomPrice = roomData.loaiPhong.giaPhong;
    } else if (typeof roomData.maLoaiPhong === 'number') {
      // Hardcoded giá dựa trên loại phòng
      switch (roomData.maLoaiPhong) {
        case 1: // Single
          roomPrice = 500000;
          break;
        case 2: // Double
          roomPrice = 700000;
          break;
        case 3: // VIP
          roomPrice = 1200000;
          break;
        case 4: // Family
          roomPrice = 900000;
          break;
        default:
          roomPrice = 500000; // Giá mặc định
      }
    }
    // Format dữ liệu phù hợp với cấu trúc dùng trong frontend
    const formattedRoom = {
      id: roomId,
      maPhong: parseInt(roomId),
      soPhong: roomData.soPhong || `p${roomId}`,
      tenPhong: `Phòng ${roomData.soPhong || roomId}`,
      moTa: roomData.moTa || 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản',
      hinhAnh: roomData.hinhAnh || '/images/rooms/default-room.jpg',
      giaTien: roomPrice, // Lấy giá từ loaiPhong nếu không có giaTien
      soLuongKhach: roomData.soNguoi || 2,
      trangThai: roomData.trangThai || 1,
      loaiPhong: roomData.tenLoaiPhong || (roomData.loaiPhong && roomData.loaiPhong.tenLoai) || 'Standard',
      images: [roomData.hinhAnh || '/images/rooms/default-room.jpg'],
      features: roomData.moTa ? roomData.moTa.split(',').map((f: string) => f.trim()) : ['Wi-Fi miễn phí', 'Điều hòa', 'TV', 'Tủ lạnh']
    };
    // Trả về dữ liệu đã được định dạng
    return res.status(200).json({
      success: true,
      data: formattedRoom
    });
  } catch (error) {
    // Kiểm tra lỗi cụ thể
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng'
        });
      }

      // Log chi tiết lỗi để gỡ lỗi
      if (error.response) {
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    });
  }
}