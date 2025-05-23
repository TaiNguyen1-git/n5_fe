import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import Head from 'next/head';
import { Spin } from 'antd';

// Dynamically import the AdminDashboard component with SSR disabled
const AdminDashboard = dynamic(
  () => import('../components/admin/admin-dashboard'),
  { ssr: false }
);

const AdminPage = () => {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setAuthChecking(true);
      console.log('Admin Page - Kiểm tra xác thực người dùng');

      // Thêm độ trễ nhỏ để đảm bảo cookies được đọc đúng
      await new Promise(resolve => setTimeout(resolve, 100));

      // Kiểm tra xác thực người dùng
      const isAuth = isAuthenticated();
      console.log('Admin Page - Kết quả kiểm tra xác thực:', isAuth);

      if (!isAuth) {
        console.log('Admin Page - Người dùng chưa xác thực, chuyển hướng đến trang đăng nhập');
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
        setIsAuthorized(true);
      }

      setAuthChecking(false);
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

// Use getServerSideProps to ensure this page is only rendered on the client
export async function getStaticProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
}

// Add a special export to disable static optimization
// This ensures the page is only rendered on the client
AdminPage.getInitialProps = async () => {
  return { props: {} };
}

export default AdminPage;
