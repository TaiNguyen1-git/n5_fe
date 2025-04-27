import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Phương thức ${req.method} không được hỗ trợ`
    });
  }

  try {
    // Lấy token xác thực từ request
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    // Giải mã JWT token để lấy thông tin người dùng
    function decodeJwtPayload(token: string): any {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        return payload;
      } catch (error) {
        console.error('Lỗi khi giải mã JWT:', error);
        return null;
      }
    }

    // Lấy username từ token
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.unique_name) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const username = payload.unique_name;
    console.log('API user-profile - Username từ token:', username);

    // Gọi API GetAll để lấy danh sách người dùng từ trang đầu tiên
    console.log('API user-profile - Đang gọi API GetAll để tìm người dùng');
    try {
      // Tìm user trên tất cả các trang
      let currentUser = null;
      let currentPage = 1;
      let totalPages = 1;
      
      // Hàm tìm user trong danh sách
      const findUserInItems = (items: any[]) => {
        return items.find((user: any) => 
          user.tenTK.toLowerCase() === username.toLowerCase()
        );
      };
      
      // Lặp qua các trang cho đến khi tìm thấy user hoặc đã kiểm tra hết các trang
      do {
        console.log(`API user-profile - Kiểm tra trang ${currentPage}/${totalPages}`);
        
        // Gọi API với số trang hiện tại
        const response = await fetch(`https://ptud-web-1.onrender.com/api/User/GetAll?pageNumber=${currentPage}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API trả về lỗi: ${response.status}`);
        }

        // Phân tích dữ liệu từ API
        const users = await response.json();
        
        if (!users || typeof users !== 'object') {
          throw new Error('API trả về dữ liệu không hợp lệ');
        }
        
        // Lấy thông tin pagination từ API response
        if (users.totalPages) {
          totalPages = users.totalPages;
        }
        
        // In ra danh sách username để debug
        if (users.items && Array.isArray(users.items)) {
          console.log(`Danh sách tenTK trong API (trang ${currentPage}):`, users.items.map((u: any) => u.tenTK).join(', '));
          
          // Tìm user trong danh sách
          const foundUser = findUserInItems(users.items);
          if (foundUser) {
            currentUser = foundUser;
            console.log('API user-profile - Đã tìm thấy user ở trang', currentPage);
            break;
          }
        }
        
        // Tăng số trang để kiểm tra trang tiếp theo
        currentPage++;
      } while (currentPage <= totalPages);
      
      // Nếu tìm thấy user
      if (currentUser) {
        // Tạo đối tượng người dùng tinh gọn
        const userProfile = {
          id: currentUser.maTK,
          username: currentUser.tenTK,
          fullName: currentUser.tenHienThi || username,
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          loaiTK: currentUser.loaiTK || 3
        };
        
        console.log('API user-profile - Thông tin user tìm thấy:', userProfile);
        
        return res.status(200).json({
          success: true,
          message: 'Lấy thông tin người dùng thành công',
          data: userProfile
        });
      }
      
      // Nếu không tìm thấy user, tạo thông tin giả từ JWT token
      console.log('API user-profile - Không tìm thấy user trong API sau khi kiểm tra tất cả các trang, tạo user giả từ token');
      
      // Lấy vai trò từ JWT token
      let loaiTK = 3; // Mặc định khách hàng
      if (payload.role === 'Admin' || payload.role === 'QuanTri') {
        loaiTK = 1;
      } else if (payload.role === 'NhanVien' || payload.role === 'Staff') {
        loaiTK = 2;
      }
      
      const fakeUser = {
        id: 0,
        username: username,
        fullName: payload.name || username,
        email: '',
        phone: '',
        loaiTK: loaiTK
      };
      
      console.log('API user-profile - Đã tạo user giả:', fakeUser);
      
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin người dùng thành công (dữ liệu mặc định)',
        data: fakeUser
      });
      
    } catch (error) {
      console.error('Lỗi khi gọi API GetAll:', error);
      
      // Tạo thông tin giả từ JWT token nếu API lỗi
      console.log('API user-profile - Lỗi API, tạo user giả từ token');
      
      // Lấy vai trò từ JWT token
      let loaiTK = 3; // Mặc định khách hàng
      if (payload.role === 'Admin' || payload.role === 'QuanTri') {
        loaiTK = 1;
      } else if (payload.role === 'NhanVien' || payload.role === 'Staff') {
        loaiTK = 2;
      }
      
      const fakeUser = {
        id: 0,
        username: username,
        fullName: payload.name || username,
        email: '',
        phone: '',
        loaiTK: loaiTK
      };
      
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin người dùng thành công (dữ liệu mặc định)',
        data: fakeUser
      });
    }
  } catch (error) {
    console.error('User Profile handler - Lỗi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    });
  }
} 