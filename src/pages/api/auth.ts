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

// In-memory user storage (in a real app, this would be a database)
let users: {
  id: string;
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
}[] = [];

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
    
    // Find user by username
    const user = users.find(u => u.username === username);
    
    // Check if user exists and password matches
    if (user && user.password === password) {
      // In a real app, you would use proper password hashing and JWT tokens
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email
          },
          token: 'mock-jwt-token'
        }
      });
    } else {
      return res.status(401).json({
        success: false, 
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
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
    
    // Check if username already exists
    if (users.some(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(), // Simple ID generation (use UUID in real app)
      username,
      password, // In a real app, this would be hashed
      email,
      fullName,
      phoneNumber
    };
    
    // Add user to storage
    users.push(newUser);
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          phoneNumber: newUser.phoneNumber || '',
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 