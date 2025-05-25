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

  try {
    // Gọi API backend thông qua server Next.js
    const response = await axios.get(`${BACKEND_API_URL}/Phong/GetAll`, {
      timeout: 20000, // 20s timeout
      headers: {
        'Accept': '*/*'
      }
    });

    // Trả về dữ liệu từ API backend
    return res.status(200).json(response.data);
  } catch (error) {


    return res.status(500).json({
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    });
  }
}