import type { NextApiRequest, NextApiResponse } from 'next';

type LoginData = {
  username: string;
  password: string;
}

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'POST':
      // Check which auth endpoint is being accessed
      const { action } = req.query;
      
      if (action === 'login') {
        return handleLogin(req, res);
      } else if (action === 'register') {
        return handleRegister(req, res);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}

function handleLogin(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, password } = req.body as LoginData;
    
    // This is a mock implementation. In a real app, you would validate credentials against a database
    if (username === 'test' && password === 'password') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: '1',
            username,
            fullName: 'Test User',
          },
          token: 'mock-jwt-token'
        }
      });
    } else {
      return res.status(401).json({
        success: false, 
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function handleRegister(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { username, password, email, fullName, phoneNumber } = req.body as RegisterData;
    
    // Validate input
    if (!username || !password || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // This is a mock implementation. In a real app, you would store the user in a database
    // and handle things like password hashing, email verification, etc.
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: '2',
          username,
          email,
          fullName,
          phoneNumber: phoneNumber || '',
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 