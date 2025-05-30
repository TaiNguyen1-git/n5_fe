import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }

  try {
    // Lấy tham số từ query params
    const { roomNumber } = req.query;

    if (!roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số roomNumber'
      });
    }
    // Gọi API GetAll để lấy danh sách tất cả các phòng
    try {
      // Gọi API với pagination để lấy tất cả phòng
      const response = await axios.get('https://ptud-web-1.onrender.com/api/Phong/GetAll', {
        params: {
          PageNumber: 1,
          PageSize: 1000 // Lấy tối đa 1000 phòng
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 giây timeout
      });

      if (response.status === 200 && response.data) {
        // Kiểm tra xem response.data có trường items không
        const rooms = response.data.items || response.data;

        if (!Array.isArray(rooms)) {
          throw new Error('Dữ liệu trả về không phải là mảng');
        }
        // Debug: Log một vài phòng đầu tiên để xem cấu trúc dữ liệu
        if (rooms.length > 0) {
        }

        // Tìm phòng theo tham số (có thể là mã phòng, số phòng hoặc tên phòng)
        let foundRoom = null;

        // Thử tìm theo số phòng trước (soPhong)
        foundRoom = rooms.find((room: any) =>
          room.soPhong?.toString() === roomNumber.toString()
        );
        // Nếu không tìm thấy theo số phòng, thử tìm theo số phòng với prefix 'p'
        if (!foundRoom && roomNumber.toString().startsWith('p')) {
          foundRoom = rooms.find((room: any) =>
            room.soPhong?.toString() === roomNumber.toString()
          );
        }

        // Nếu không tìm thấy theo số phòng, thử tìm theo mã phòng
        if (!foundRoom && /^\d+$/.test(roomNumber.toString())) {
          foundRoom = rooms.find((room: any) =>
            room.maPhong?.toString() === roomNumber.toString()
          );
        }

        // Nếu vẫn không tìm thấy, thử tìm theo số phòng với format khác (ví dụ: p201, P201)
        if (!foundRoom) {
          const roomNumberWithP = `p${roomNumber}`;
          foundRoom = rooms.find((room: any) =>
            room.soPhong?.toString().toLowerCase() === roomNumberWithP.toLowerCase()
          );
        }

        // Nếu vẫn không tìm thấy, thử tìm theo tên phòng
        if (!foundRoom) {
          foundRoom = rooms.find((room: any) =>
            room.ten?.toString().toLowerCase() === roomNumber.toString().toLowerCase()
          );
        }

        // Nếu vẫn không tìm thấy, thử tìm kiếm mờ rộng hơn (tên phòng chứa chuỗi tìm kiếm)
        if (!foundRoom) {
          foundRoom = rooms.find((room: any) =>
            room.ten?.toString().toLowerCase().includes(roomNumber.toString().toLowerCase())
          );
        }

        // Cuối cùng, thử tìm theo số phòng chứa chuỗi tìm kiếm
        if (!foundRoom) {
          foundRoom = rooms.find((room: any) =>
            room.soPhong?.toString().includes(roomNumber.toString())
          );
        }

        if (foundRoom) {
          // Chuyển đổi dữ liệu từ backend sang định dạng frontend cần
          try {
            // Lấy giá từ loaiPhong.giaPhong nếu có
            // Kiểm tra cấu trúc dữ liệu và lấy giá từ loaiPhong
            let roomPrice = null;
            if (foundRoom.giaTien) {
              roomPrice = foundRoom.giaTien;
            } else if (foundRoom.loaiPhong && foundRoom.loaiPhong.giaPhong) {
              roomPrice = foundRoom.loaiPhong.giaPhong;
            } else if (typeof foundRoom.maLoaiPhong === 'number') {
              // Hardcoded giá dựa trên loại phòng
              switch (foundRoom.maLoaiPhong) {
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
            // Xử lý mô tả và tiện nghi
            let description = foundRoom.moTa || 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản';
            let features = ['Wi-Fi miễn phí', 'Điều hòa', 'TV', 'Tủ lạnh']; // Default features
            // Nếu có mô tả từ API, kiểm tra xem có phải là danh sách tiện nghi không
            if (foundRoom.moTa) {
              // Nếu mô tả chứa dấu phẩy, có thể là danh sách tiện nghi
              if (foundRoom.moTa.includes(',')) {
                features = foundRoom.moTa.split(',').map((item: string) => item.trim());
                // Tạo mô tả từ loại phòng
                description = `Phòng ${foundRoom.tenLoaiPhong || (foundRoom.loaiPhong && foundRoom.loaiPhong.tenLoai) || 'Standard'} với đầy đủ tiện nghi hiện đại.`;
              } else {
                // Nếu không có dấu phẩy, coi như mô tả bình thường
                description = foundRoom.moTa;
              }
            }
            const formattedData = {
              id: foundRoom.maPhong?.toString() || '0',
              maPhong: foundRoom.maPhong || 0,
              tenPhong: foundRoom.ten || foundRoom.soPhong ? `Phòng ${foundRoom.soPhong}` : '',
              moTa: description,
              hinhAnh: foundRoom.hinhAnh || '/images/rooms/default-room.jpg',
              giaTien: roomPrice, // Lấy giá từ loaiPhong nếu không có giaTien
              soLuongKhach: foundRoom.soNguoi || foundRoom.soLuongKhach || 2,
              trangThai: foundRoom.trangThai || 0,
              loaiPhong: foundRoom.tenLoaiPhong || (foundRoom.loaiPhong && foundRoom.loaiPhong.tenLoai) || 'Standard',
              images: foundRoom.hinhAnh ? [foundRoom.hinhAnh] : ['/images/rooms/default-room.jpg'],
              features: features
            };
            return res.status(200).json({
              success: true,
              message: 'Lấy thông tin phòng thành công',
              data: formattedData
            });
          } catch (formatError: any) {
            return res.status(200).json({
              success: true,
              message: 'Lấy thông tin phòng thành công nhưng có lỗi định dạng',
              data: foundRoom // Trả về dữ liệu gốc nếu không thể định dạng
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy thông tin phòng',
            data: { error: `Không tìm thấy phòng nào với tham số: ${roomNumber}` }
          });
        }
      } else {
        throw new Error(`API trả về trạng thái không thành công: ${response.status}`);
      }
    } catch (apiError: any) {
      // Trả về lỗi 500
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi gọi API GetAll',
        data: { error: apiError.message || 'Unknown error' }
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin phòng',
      data: { error: error.message || 'Unknown error' }
    });
  }
}