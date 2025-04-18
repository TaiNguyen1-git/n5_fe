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

    // Kiểm tra vai trò người dùng
    const user = getCurrentUser();
    if (user?.role !== 'staff') {
      router.push('/');
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