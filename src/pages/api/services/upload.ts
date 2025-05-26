import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define response type
type ResponseData = {
  success: boolean;
  message: string;
  imageUrl?: string;
};

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    const formData = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });
    
    const { files } = formData;
    
    if (!files.image) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const filePath = file.filepath;
    const fileName = file.originalFilename || `${uuidv4()}.jpg`;
    
    // Validate file type (optional)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only JPG, PNG, GIF and WEBP are allowed' });
    }
    
    // Read the file
    const fileData = fs.readFileSync(filePath);
    
    // Create form data for backend API
    const backendFormData = new FormData();
    const blob = new Blob([fileData], { type: file.mimetype || 'image/jpeg' });
    backendFormData.append('image', blob, fileName);
    
    // Upload to backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/services/upload-image`,
      backendFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data && response.data.imageUrl) {
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: response.data.imageUrl,
      });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
} 