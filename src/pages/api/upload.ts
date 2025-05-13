import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Vô hiệu hóa bodyParser mặc định để xử lý form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// API backend URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Sử dụng formidable để xử lý form-data
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    
    // Parse form data
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Kiểm tra file
    const file = files.file as formidable.File;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
    }

    // Kiểm tra loại file
    const fileType = file.mimetype;
    if (!fileType || !fileType.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Chỉ chấp nhận file hình ảnh' });
    }

    // Đọc file
    const fileData = fs.readFileSync(file.filepath);
    
    // Tạo form data để gửi lên API backend
    const formData = new FormData();
    formData.append('file', new Blob([fileData], { type: fileType }), file.originalFilename || 'image.jpg');

    try {
      // Gửi file lên API backend
      const uploadResponse = await axios.post(`${BACKEND_API_URL}/Upload/Image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 giây timeout
      });

      // Trả về URL của hình ảnh đã upload
      if (uploadResponse.data && uploadResponse.data.url) {
        return res.status(200).json({
          success: true,
          url: uploadResponse.data.url,
          message: 'Upload thành công'
        });
      } else {
        // Nếu API backend không trả về URL, lưu file vào thư mục public
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        
        // Tạo thư mục uploads nếu chưa tồn tại
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Tạo tên file duy nhất
        const fileName = `${Date.now()}-${file.originalFilename || 'image.jpg'}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Lưu file
        fs.copyFileSync(file.filepath, filePath);
        
        // Trả về URL của file
        const fileUrl = `/uploads/${fileName}`;
        return res.status(200).json({
          success: true,
          url: fileUrl,
          message: 'Upload thành công (local)'
        });
      }
    } catch (uploadError) {
      console.error('Error uploading to backend:', uploadError);
      
      // Fallback: Lưu file vào thư mục public
      const publicDir = path.join(process.cwd(), 'public');
      const uploadsDir = path.join(publicDir, 'uploads');
      
      // Tạo thư mục uploads nếu chưa tồn tại
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Tạo tên file duy nhất
      const fileName = `${Date.now()}-${file.originalFilename || 'image.jpg'}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Lưu file
      fs.copyFileSync(file.filepath, filePath);
      
      // Trả về URL của file
      const fileUrl = `/uploads/${fileName}`;
      return res.status(200).json({
        success: true,
        url: fileUrl,
        message: 'Upload thành công (local fallback)'
      });
    }
  } catch (error) {
    console.error('Error handling upload:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý upload' });
  }
}
