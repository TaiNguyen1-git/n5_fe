import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Gọi API đăng ký từ backend
    const response = await fetch('https://ptud-web-1.onrender.com/api/User/RegisterUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Lấy dữ liệu từ response
    const data = await response.json();

    // Trả về kết quả cho client
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({ message: 'Lỗi kết nối đến server' });
  }
} 