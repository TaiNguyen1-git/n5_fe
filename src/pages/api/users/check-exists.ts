import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type ResponseData = {
  success: boolean;
  message?: string;
  exists?: boolean;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Thêm CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Extract query parameters
      const { username } = req.query;

      if (!username || Array.isArray(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username is required and must be a string'
        });
      }

      console.log(`Checking if user exists: ${username}`);

      // Call backend API
      try {
        const response = await axios.get(`${BACKEND_API_URL}/User/CheckExists`, {
          params: { username },
          timeout: 15000 // 15 second timeout
        });

        return res.status(200).json({
          success: true,
          exists: response.data
        });
      } catch (error) {
        console.error('Error checking if user exists:', error);
        
        // Trả về false nếu có lỗi khi gọi API
        return res.status(200).json({
          success: true,
          exists: false
        });
      }
    } catch (error) {
      console.error('Error in check-exists API route:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`
    });
  }
}
