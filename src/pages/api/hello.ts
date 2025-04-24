// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Data = {
  success: boolean;
  message?: string;
  data?: any;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  try {
    // Kết nối với API health check của backend
    const response = await axios.get(`${BACKEND_API_URL}/health`);
    
    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('API health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kết nối đến hệ thống backend'
    });
  }
}
