import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import StaffDashboard from '../components/staff/staff-dashboard';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import Head from 'next/head';

const StaffPage = () => {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setAuthChecking(true);
      // Thêm độ trễ nhỏ để đảm bảo cookies được đọc đúng
      await new Promise(resolve => setTimeout(resolve, 100));

      // Kiểm tra xác thực người dùng
      const isAuth = isAuthenticated();
      if (!isAuth) {
        router.push('/login');
        return;
      }

      // Lấy thông tin người dùng hiện tại
      const user = getCurrentUser();
      // Xử lý loaiTK đảm bảo là số
      const loaiTK = typeof user?.loaiTK === 'string' ? parseInt(user.loaiTK, 10) : user?.loaiTK;

      // Kiểm tra quyền truy cập dựa trên loaiTK và role
      const isStaff = user?.role === 'staff' || loaiTK === 2;

      // Log chi tiết thông tin quyền truy cập
      if (!isStaff) {
        router.push('/');
      } else {
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
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Đang tải trang nhân viên...</h2>
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
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
        <title>Quản lý - Nhân viên | Nhóm 5 Hotel</title>
        <meta name="description" content="Trang quản lý dành cho nhân viên khách sạn" />
      </Head>
      <StaffDashboard />
    </>
  );
};

export default StaffPage;