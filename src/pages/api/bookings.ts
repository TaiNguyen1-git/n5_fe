import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Forward the request to the actual API
    const response = await axios.get(`${API_URL}/DatPhong/GetAll`, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Return the response data
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('API proxy error:', error.message);

    // Return error if the API call fails
    return res.status(500).json({ error: 'Failed to fetch bookings from API' });
  }
}
