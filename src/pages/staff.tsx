import { useEffect } from 'react';
import { useRouter } from 'next/router';
import StaffDashboard from '../components/staff/staff-dashboard';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import Head from 'next/head';

const StaffPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Kiểm tra xác thực người dùng
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Lấy thông tin người dùng hiện tại
    const user = getCurrentUser();
    console.log('Staff Page - Thông tin người dùng đầy đủ:', user);
    
    // Xử lý loaiTK đảm bảo là số
    const loaiTK = typeof user?.loaiTK === 'string' ? parseInt(user.loaiTK, 10) : user?.loaiTK;
    
    // Kiểm tra quyền truy cập dựa trên loaiTK và role
    const isStaff = user?.role === 'staff' || loaiTK === 2;
    
    // Log chi tiết thông tin quyền truy cập
    console.log('Staff Page - Kiểm tra quyền truy cập:', {
      username: user?.username,
      role: user?.role,
      loaiTK: loaiTK,
      isStaff: isStaff
    });
    
    if (!isStaff) {
      console.log('Staff Page - Người dùng không phải nhân viên, chuyển hướng về trang chủ');
      router.push('/');
      return;
    }
    
    console.log('Staff Page - Xác nhận người dùng là nhân viên, cho phép truy cập');
  }, [router]);

  return (
    <>
      <Head>
        <title>Quản lý - Nhân viên | Nhóm 5 Hotel</title>
        <meta name="description" content="Trang quản lý dành cho nhân viên khách sạn" />
      </Head>
      <StaffDashboard />
    </>
  );
};

export default StaffPage; 