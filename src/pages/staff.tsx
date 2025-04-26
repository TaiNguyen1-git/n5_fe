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

    // Kiểm tra vai trò người dùng bằng loaiTK
    const user = getCurrentUser();
    console.log('Staff Page - Thông tin người dùng:', user);
    
    // Kiểm tra cả role và loaiTK để phát hiện staff
    const isStaff = user?.role === 'staff' || user?.loaiTK === 2;
    
    if (!isStaff) {
      console.log('Staff Page - Người dùng không phải nhân viên:', 
                 user?.role, user?.loaiTK);
      router.push('/');
    } else {
      console.log('Staff Page - Xác nhận người dùng là nhân viên');
    }
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