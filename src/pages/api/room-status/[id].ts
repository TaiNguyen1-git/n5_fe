import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// API backend URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  // Get room ID from route parameter
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID không hợp lệ'
    });
  }

  // Handle ID that could be an array or contain /
  let roomId = Array.isArray(id) ? id[0] : id;

  // Remove any / characters if present in the id
  roomId = roomId.split('/')[0];

  try {
    // Gọi API đặt phòng để lấy thông tin trạng thái
    const apiEndpoint = `${BACKEND_API_URL}/DatPhong/GetAll`;
    console.log(`Calling booking API: ${apiEndpoint}`);

    const response = await axios.get(apiEndpoint, {
      timeout: 10000,
      headers: { 'Accept': '*/*' }
    });

    // Check if there's no data
    if (!response || !response.data || !response.data.items) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đặt phòng'
      });
    }

    // Log dữ liệu để debug
    console.log('API response data:', JSON.stringify(response.data));

    // Tìm đặt phòng có mã phòng trùng với ID được yêu cầu
    const bookings = response.data.items;
    const booking = bookings.find((b: any) => b.maDatPhong.toString() === roomId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt phòng với ID này'
      });
    }

    console.log('Found booking:', booking);

    // Gọi API trạng thái đặt phòng để lấy danh sách trạng thái
    const statusApiEndpoint = `${BACKEND_API_URL}/TrangThaiDatPhong/GetAll`;
    console.log(`Calling status API: ${statusApiEndpoint}`);

    const statusResponse = await axios.get(statusApiEndpoint, {
      timeout: 10000,
      headers: { 'Accept': '*/*' }
    });

    if (!statusResponse || !statusResponse.data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách trạng thái'
      });
    }

    console.log('Status API response:', JSON.stringify(statusResponse.data));

    // Tìm trạng thái tương ứng với mã trạng thái của đặt phòng
    let statusData;
    if (Array.isArray(statusResponse.data)) {
      statusData = statusResponse.data.find((s: any) => s.maTT === booking.trangThai);
    }

    // Nếu không tìm thấy, sử dụng giá trị mặc định dựa trên mã trạng thái
    if (!statusData) {
      const trangThai = booking.trangThai;
      let tenTT = 'Chưa xác định';

      switch(trangThai) {
        case 1:
          tenTT = 'Chờ xác nhận';
          break;
        case 2:
          tenTT = 'Đã xác nhận';
          break;
        case 3:
          tenTT = 'Đã nhận phòng';
          break;
        case 4:
          tenTT = 'Đã trả phòng';
          break;
        case 0:
          tenTT = 'Đã hủy';
          break;
      }

      statusData = {
        maTT: trangThai,
        tenTT: tenTT
      };
    }

    console.log('Final status data:', statusData);

    // Return the formatted data
    return res.status(200).json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error(`Error fetching room status with ID ${roomId}:`, error);

    // Check for specific errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy trạng thái phòng'
        });
      }

      // Log error details for debugging
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    });
  }
}
