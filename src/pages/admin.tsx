import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import Head from 'next/head';
import { Spin } from 'antd';

// Dynamically import the AdminDashboard component with SSR disabled
const AdminDashboard = dynamic(
  () => import('../components/admin/admin-dashboard'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#fff'
      }}>
        <Spin tip="Đang tải trang quản trị..." size="large">
          <div style={{ padding: '50px', background: '#fff' }} />
        </Spin>
      </div>
    )
  }
);

const AdminPage = () => {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        // Thêm độ trễ nhỏ để đảm bảo cookies được đọc đúng
        await new Promise(resolve => setTimeout(resolve, 100));

        // Kiểm tra xác thực người dùng
        const isAuth = isAuthenticated();
        if (!isAuth) {
          router.push('/login');
          return;
        }

        // Kiểm tra vai trò admin bằng loaiTK
        const user = getCurrentUser();
        // Kiểm tra chi tiết về quyền admin
        const loaiTK = user?.loaiTK;
        const role = user?.role;
        const vaiTro = user?.vaiTro;
        // Chỉ cho phép admin truy cập
        let isAdmin = false;

        // Kiểm tra quyền admin dựa vào vai trò và loaiTK
        if (role === 'admin') {
          isAdmin = true;
        } else if (vaiTro === 1) {
          isAdmin = true;
        } else if (loaiTK !== undefined && loaiTK !== null) {
          // Chuyển đổi loaiTK thành số nếu cần
          const loaiTKValue = typeof loaiTK === 'number'
            ? loaiTK
            : (typeof loaiTK === 'string' ? parseInt(loaiTK as string, 10) : null);
          // Kiểm tra nếu là 1 (admin)
          if (loaiTKValue === 1) {
            isAdmin = true;
          }
        }

        if (!isAdmin) {
          router.push('/');
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        // In case of error, redirect to login
        router.push('/login');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Hiển thị màn hình loading khi đang kiểm tra xác thực
  if (authChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#fff'
      }}>
        <Spin tip="Đang tải trang quản trị..." size="large">
          <div style={{ padding: '50px', background: '#fff' }} />
        </Spin>
      </div>
    );
  }

  // Không hiển thị gì nếu không có quyền (đang chuyển hướng)
  if (!isAuthorized) {
    return null;
  }

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

// Add a special export to disable static optimization
// This ensures the page is only rendered on the client
AdminPage.getInitialProps = async () => {
  return {};
}

export default AdminPage;
