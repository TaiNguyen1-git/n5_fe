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
    // Kiểm tra vai trò admin
    const user = getCurrentUser();
    if (user?.role !== 'admin') {
      router.push('/');
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
