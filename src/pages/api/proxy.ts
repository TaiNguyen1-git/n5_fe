import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Agent } from 'https';

// Define response type
type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get target URL from query
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Missing target URL'
    });
  }

  try {
    console.log(`Proxying request to: ${url}`);
    console.log(`Request method: ${req.method}`);
    console.log(`Request body:`, JSON.stringify(req.body, null, 2));

    // Create a custom HTTPS agent that ignores SSL errors
    const httpsAgent = new Agent({
      rejectUnauthorized: false
    });

    // Forward the request to the target URL
    const response = await axios({
      method: req.method as string,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      timeout: 30000, // 30s timeout
      httpsAgent
    });

    console.log(`Proxy response status: ${response.status}`);
    
    // Return the response from the target URL
    return res.status(response.status).json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Error from target server',
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        return res.status(503).json({
          success: false,
          message: 'No response from target server'
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Proxy error'
    });
  }
}
