import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Cookies from 'js-cookie';
import styles from '../styles/Auth.module.css';
import { getCurrentUser, deleteUser } from '../services/authService';
import { updateUserProfile, getUserProfile } from '../services/userService';
import Layout from '../components/Layout';
import EnhancedBookingHistory from '../components/user/EnhancedBookingHistory';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '********',
    phoneNumber: '',
    gender: 'Nam',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    address: ''
  });

  const [bookingHistory, setBookingHistory] = useState<any[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Lấy thông tin người dùng từ API
    fetchUserProfile();
  }, [router]);

  // Hàm fetch dữ liệu người dùng từ API
  const fetchUserProfile = async () => {
    try {
      // Thử lấy thông tin từ API
      const profileData = await getUserProfile();

      if (profileData) {
        const phoneNumber = profileData.phone ? String(profileData.phone) : '';

        setFormData({
          username: profileData.tenTK || profileData.username || '',
          fullName: profileData.tenHienThi || profileData.fullName || '',
          email: profileData.email || '',
          password: '********',
          phoneNumber: phoneNumber,
          gender: profileData.gioiTinh || profileData.gender || 'Nam',
          birthDay: '',
          birthMonth: '',
          birthYear: '',
          address: profileData.diaChi || profileData.address || ''
        });

        // Log để debug giá trị phone
        return;
      }
    } catch (error) {
    }

    // Fallback: Nếu không lấy được từ API, dùng dữ liệu từ cookie hoặc localStorage
    try {
      const storedUserData = Cookies.get('user') || localStorage.getItem('user');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);

        setFormData({
          username: userData.username || userData.tenTK || '',
          fullName: userData.fullName || userData.tenHienThi || '',
          email: userData.email || '',
          password: '********',
          phoneNumber: userData.phoneNumber || userData.phone || '',
          gender: userData.gender || userData.gioiTinh || 'Nam',
          birthDay: '',
          birthMonth: '',
          birthYear: '',
          address: userData.address || userData.diaChi || ''
        });
      }
    } catch (err) {
      setError('Có lỗi khi tải thông tin người dùng');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.fullName || !formData.email) {
        setError('Vui lòng điền đầy đủ họ tên và email');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Email không hợp lệ');
        setLoading(false);
        return;
      }

      if (formData.phoneNumber) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
          setError('Số điện thoại không hợp lệ');
          setLoading(false);
          return;
        }
      }

      const updateData = {
        tenTK: formData.username,
        tenHienThi: formData.fullName === "string" ? formData.username : formData.fullName.trim(),
        phone: formData.phoneNumber === "string" ? "" : formData.phoneNumber,
        email: formData.email.trim()
      };
      const response = await updateUserProfile(updateData);

      if (response.success) {
        // Hiển thị thông báo thành công
        const successMessage = document.createElement('div');
        successMessage.className = styles.successMessage;
        successMessage.textContent = 'Cập nhật thông tin thành công!';

        const formContainer = document.querySelector(`.${styles.formContainer}`);
        if (formContainer) {
          formContainer.insertBefore(successMessage, formContainer.firstChild);

          setTimeout(() => {
            successMessage.remove();
          }, 3000);
        }

        // Đặt lại trạng thái loading
        setLoading(false);

        // Tải lại dữ liệu từ API sau khi cập nhật thành công
        await fetchUserProfile();
      } else {
        setError(response.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.authBox} style={{ maxWidth: '800px' }}>
          <div className={styles.logo}>
            <h1>Hồ Sơ Của Tôi</h1>
          </div>

          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'bookings' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              Lịch sử đặt phòng
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'security' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Bảo mật tài khoản
            </button>
          </div>

          <div className={styles.formContainer}>
            {activeTab === 'profile' && (
              <>
                <p className={styles.subtitle}>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="username">Tên đăng nhập</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      className={styles.input}
                      disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Tên</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password">Mật khẩu</label>
                    <div className={styles.passwordContainer}>
                      <input
                        type="password"
                        id="password"
                        value={formData.password}
                        className={styles.input}
                        disabled
                      />
                      <Link href="/change-password" className={styles.changePassword}>
                        Thay đổi
                      </Link>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Đang cập nhật...' : 'Chỉnh sửa'}
                  </button>
                </form>
              </>
            )}

            {activeTab === 'bookings' && (
              <EnhancedBookingHistory />
            )}

            {activeTab === 'security' && (
              <div className={styles.securitySettings}>
                <h2>Bảo mật tài khoản</h2>

                <div className={styles.securityOption}>
                  <h3>Đổi mật khẩu</h3>
                  <p>Thay đổi mật khẩu định kỳ giúp bảo vệ tài khoản của bạn tốt hơn.</p>
                  <Link href="/change-password">
                    <button className={styles.securityButton}>Đổi mật khẩu</button>
                  </Link>
                </div>

                <div className={styles.dangerZone}>
                  <h3>Vùng nguy hiểm</h3>
                  <p>Các hành động dưới đây không thể hoàn tác. Hãy cân nhắc kỹ trước khi thực hiện.</p>
                  <button
                    type="button"
                    className={styles.deleteAccountButton}
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
                        deleteUser().then(response => {
                          if (response.success) {
                            alert('Tài khoản đã được xóa thành công');
                            router.push('/');
                          } else {
                            setError(response.message || 'Có lỗi xảy ra khi xóa tài khoản');
                          }
                        }).catch(err => {
                          setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
                        });
                      }
                    }}
                  >
                    Xóa tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}