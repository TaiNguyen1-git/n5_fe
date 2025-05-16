import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { login, isAuthenticated } from '../services/authService';
import styles from '../styles/Auth.module.css';

export default function Login() {
  const router = useRouter();
  const { redirect, registered } = router.query;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFromRegister, setIsFromRegister] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const redirectPath = redirect && typeof redirect === 'string'
        ? decodeURIComponent(redirect)
        : '/';
      router.push(redirectPath);
    }
  }, [redirect, router]);

  // Cập nhật username nếu được truyền từ trang đăng ký
  useEffect(() => {
    if (router.isReady && router.query.username) {
      const usernameFromQuery = router.query.username as string;
      setUsername(usernameFromQuery);
    }
  }, [router.isReady, router.query.username]);

  // Kiểm tra xem người dùng có đến từ trang đăng ký không
  useEffect(() => {
    if (router.isReady && router.query.registered === 'true') {
      setIsFromRegister(true);
    }
  }, [router.isReady, router.query.registered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Xóa dữ liệu cũ trước khi đăng nhập để tránh xung đột
      console.log("Login page - Xóa dữ liệu người dùng cũ trước khi đăng nhập");
      Cookies.remove('auth_token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Hiển thị thông báo cho người dùng biết
      console.log("Login page - Đang thử đăng nhập với:", username);

      // Gọi API qua handler của Next.js
      const response = await fetch('/api/login-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenDangNhap: username,
          matKhau: password
        })
      });

      const result = await response.json();
      console.log("Login page - Kết quả đăng nhập:", result);

      if (result.success) {
        // Lưu token và thông tin người dùng
        if (result.data && result.data.token) {
          // Lưu token vào cookie
          Cookies.set('auth_token', result.data.token, {
            expires: 7, // 7 ngày
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
          });

          // Cũng lưu vào localStorage để tương thích với code cũ
          localStorage.setItem('auth_token', result.data.token);

          // Xử lý loaiTK để đảm bảo là số
          const userLoaiTK = processLoaiTK(result.data.loaiTK);

          // Xác định role dựa trên loaiTK
          let userRole = 'customer';
          if (userLoaiTK === 1) {
            userRole = 'admin';
          } else if (userLoaiTK === 2) {
            userRole = 'staff';
          }

          console.log("Login page - Xác định role từ loaiTK:", { loaiTK: userLoaiTK, role: userRole });

          // Xử lý dữ liệu người dùng
          const userData = {
            id: result.data.maTK || result.data.id,
            username: result.data.tenTK || result.data.username || result.data.tenDangNhap,
            tenTK: result.data.tenTK || result.data.username || result.data.tenDangNhap,
            fullName: result.data.tenHienThi || result.data.fullName || result.data.hoTen || result.data.tenTK,
            tenHienThi: result.data.tenHienThi || result.data.fullName || result.data.hoTen || result.data.tenTK,
            email: result.data.email,
            role: userRole, // Sử dụng role đã xác định từ loaiTK
            loaiTK: userLoaiTK,
            vaiTro: userLoaiTK, // Đảm bảo vaiTro khớp với loaiTK
            tenLoai: result.data.tenLoai
          };

          // Hàm xử lý loaiTK để đảm bảo là số
          function processLoaiTK(value: any): number {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const parsed = parseInt(value, 10);
              if (!isNaN(parsed)) return parsed;
            }
            // Giá trị mặc định
            return username === 'admin' ? 1 : 3;
          }

          console.log('Login page - Thông tin người dùng đầy đủ:', JSON.stringify(userData));

          // Lưu dữ liệu người dùng vào cả cookie và localStorage
          Cookies.set('user', JSON.stringify(userData), {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
          });
          localStorage.setItem('user', JSON.stringify(userData));

          // Tải thông tin profile đầy đủ
          try {
            setTimeout(() => {
              import('../services/userService').then(({ getUserProfile }) => {
                console.log('Login page: Đang tải profile sau đăng nhập...');
                getUserProfile().then(profileData => {
                  if (profileData) {
                    console.log('Login page: Đã tải thành công profile:', profileData);

                    // Đảm bảo loaiTK từ profile là số
                    let profileLoaiTK = profileData.loaiTK;
                    if (typeof profileLoaiTK === 'string') {
                      profileLoaiTK = parseInt(profileLoaiTK, 10);
                    }

                    // Xác định role từ loaiTK trong profile
                    let profileRole = 'customer';
                    if (profileLoaiTK === 1) {
                      profileRole = 'admin';
                    } else if (profileLoaiTK === 2) {
                      profileRole = 'staff';
                    }

                    // Cập nhật lại dữ liệu người dùng để đảm bảo đồng bộ
                    const updatedUserData = {
                      ...userData,
                      ...profileData,
                      role: profileRole, // Sử dụng role đã xác định từ profile
                      loaiTK: profileLoaiTK, // Đảm bảo loaiTK là số
                      vaiTro: profileLoaiTK // Đảm bảo vaiTro khớp với loaiTK
                    };

                    console.log('Login page: Cập nhật thông tin người dùng với role/loaiTK:', {
                      role: profileRole,
                      loaiTK: profileLoaiTK
                    });

                    // Lưu vào cả cookie và localStorage
                    Cookies.set('user', JSON.stringify(updatedUserData), {
                      expires: 7,
                      secure: process.env.NODE_ENV === 'production',
                      sameSite: 'strict',
                      path: '/'
                    });
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                    console.log('Login page: Đã cập nhật dữ liệu người dùng đầy đủ');

                    // Nếu role thay đổi, làm mới trang để cập nhật quyền
                    if (profileRole !== userData.role) {
                      console.log('Login page: Phát hiện thay đổi role, sẽ làm mới trang...');
                      window.location.reload();
                    }
                  } else {
                    console.log('Login page: Không lấy được profile từ API');
                  }
                });
              });
            }, 1500); // Đợi 1.5 giây để đảm bảo token đã được lưu và sẵn sàng sử dụng
          } catch (profileError) {
            console.error('Lỗi khi tải profile:', profileError);
          }

          // Kích hoạt sự kiện để thông báo cho Header
          const loginEvent = new Event('user-login');
          window.dispatchEvent(loginEvent);

          // Đơn giản hóa chuyển hướng dựa vào redirectPath từ server
          let redirectTo = result.data.redirectPath || '/';

          // Kiểm tra trực tiếp tài khoản nhanvien2
          if (userData.username === 'nhanvien2' || userData.tenTK === 'nhanvien2') {
            console.log('Login page - Phát hiện tài khoản nhanvien2, chuyển hướng đến /staff');
            redirectTo = '/staff';
          }
          // Nếu không có redirectPath, kiểm tra loaiTK và vaiTro
          else if (!result.data.redirectPath) {
            const isAdmin = userData.loaiTK === 1 || userData.vaiTro === 1 || userData.role === 'admin';
            const isStaff = userData.loaiTK === 2 || userData.vaiTro === 2 || userData.role === 'staff';

            if (isAdmin) {
              redirectTo = '/admin';
              console.log('Login page - Xác định là Admin, chuyển hướng đến:', redirectTo);
            } else if (isStaff) {
              redirectTo = '/staff';
              console.log('Login page - Xác định là Staff, chuyển hướng đến:', redirectTo);
            } else {
              // Khách hàng
              redirectTo = (redirect && typeof redirect === 'string')
                ? decodeURIComponent(redirect)
                : '/';
              console.log('Login page - Xác định là Customer, chuyển hướng đến:', redirectTo);
            }
          } else {
            console.log('Login page - Sử dụng redirectPath từ server:', redirectTo);
          }

          // Đảm bảo chuyển hướng xảy ra
          console.log('Login page - Đang chuyển hướng đến:', redirectTo);
          setTimeout(() => {
            router.push(redirectTo);
          }, 100);
        }
      } else {
        console.log("Login page - Đăng nhập thất bại:", result);
        setError(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      console.error("Login page - Lỗi đăng nhập:", err);
      setError('Có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <h1>Nhóm 5</h1>
        </div>

        <div className={styles.formContainer}>
          <h2>Xin Chào</h2>
          <p className={styles.subtitle}>Đăng nhập để tiếp tục</p>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {isFromRegister && (
            <div style={{
              padding: '10px',
              backgroundColor: '#f0f7ff',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '0.9rem',
              border: '1px solid #cce5ff'
            }}>
              <p style={{ margin: 0 }}>
                <strong>Lưu ý:</strong> Vui lòng đăng nhập với tên người dùng và mật khẩu bạn vừa đăng ký.
                Hệ thống phân biệt chữ hoa và chữ thường.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.forgotPassword}>
              <a
                href="/forgot-password"
                onClick={(e) => {
                  console.log('Đang chuyển đến trang quên mật khẩu');
                }}
              >
                Quên mật khẩu
              </a>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className={styles.createAccount}>
            <p>Chưa có tài khoản? <Link href="/register"><span>Tạo tài khoản</span></Link></p>
          </div>

          <div style={{ padding: '0 30px 20px', textAlign: 'center' }}>
            <Link href="/">
              <button className={styles.backButton}>
                Quay về trang chủ
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}