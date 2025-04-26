import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminDashboard from '../components/admin/admin-dashboard';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import Head from 'next/head';

const AdminPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xác thực người dùng
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Kiểm tra vai trò admin bằng loaiTK
    const user = getCurrentUser();
    console.log('Admin Page - Thông tin người dùng:', user);
    
    // Kiểm tra chi tiết về quyền admin
    const loaiTK = user?.loaiTK;
    const role = user?.role;
    const vaiTro = user?.vaiTro;
    
    console.log('Admin Page - Chi tiết quyền admin:', {
      loaiTK,
      role,
      vaiTro,
      tenLoai: user?.tenLoai
    });
    
    // Chỉ cho phép admin truy cập
    let isAdmin = false;
    
    // Kiểm tra quyền admin dựa vào vai trò và loaiTK
    if (role === 'admin') {
      console.log('Admin Page - Xác định là admin theo role');
      isAdmin = true;
    } else if (vaiTro === 1) {
      console.log('Admin Page - Xác định là admin theo vaiTro');
      isAdmin = true;
    } else if (loaiTK !== undefined && loaiTK !== null) {
      // Chuyển đổi loaiTK thành số nếu cần
      const loaiTKValue = typeof loaiTK === 'number' 
        ? loaiTK 
        : (typeof loaiTK === 'string' ? parseInt(loaiTK as string, 10) : null);
      
      console.log('Admin Page - loaiTK sau khi xử lý:', loaiTKValue);
      
      // Kiểm tra nếu là 1 (admin)
      if (loaiTKValue === 1) {
        console.log('Admin Page - Xác định là admin theo loaiTK');
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      console.log('Admin Page - Người dùng không phải admin:', 
                 role, loaiTK);
      router.push('/');
    } else {
      console.log('Admin Page - Xác nhận người dùng là admin');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Quản lý - Admin | Nhóm 5 Hotel</title>
        <meta name="description" content="Trang quản lý dành cho admin khách sạn" />
      </Head>
      <AdminDashboard />
    </>
  );
};

export default AdminPage;
