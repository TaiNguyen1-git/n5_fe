import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { updateUserProfile, getCurrentUser, deleteUser } from '../services/authService';
import Layout from '../components/Layout';

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
  
  const [bookingHistory, setBookingHistory] = useState([
    { 
      id: 1, 
      roomNumber: '101', 
      checkIn: '2025-03-15', 
      checkOut: '2025-03-18', 
      totalAmount: 3000000, 
      status: 'completed' 
    },
    { 
      id: 2, 
      roomNumber: '202', 
      checkIn: '2025-04-10', 
      checkOut: '2025-04-12', 
      totalAmount: 4000000, 
      status: 'upcoming' 
    }
  ]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const storedUserData = localStorage.getItem('user');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        let birthDay = '';
        let birthMonth = '';
        let birthYear = '';
        
        if (userData.birthDate) {
          const date = new Date(userData.birthDate);
          birthDay = date.getDate().toString();
          birthMonth = (date.getMonth() + 1).toString();
          birthYear = date.getFullYear().toString();
        }

        setFormData({
          username: userData.username || '',
          fullName: userData.fullName || '',
          email: userData.email || '',
          password: '********',
          phoneNumber: userData.phoneNumber || '',
          gender: userData.gender || 'Nam',
          birthDay,
          birthMonth,
          birthYear,
          address: userData.address || ''
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Có lỗi khi tải thông tin người dùng');
    }
  }, []);

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

      let birthDate;
      if (formData.birthDay && formData.birthMonth && formData.birthYear) {
        birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;
        
        const date = new Date(birthDate);
        if (date > new Date()) {
          setError('Ngày sinh không hợp lệ');
          setLoading(false);
          return;
        }
      }

      const updateData = {
        username: formData.username,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        birthDate,
        address: formData.address
      };

      const response = await updateUserProfile(updateData);

      if (response.success) {
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
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

        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
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
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Giới tính</label>
                    <div className={styles.radioGroup}>
                      <label>
                        <input
                          type="radio"
                          name="gender"
                          value="Nam"
                          checked={formData.gender === 'Nam'}
                          onChange={handleChange}
                        />
                        Nam
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="gender"
                          value="Nữ"
                          checked={formData.gender === 'Nữ'}
                          onChange={handleChange}
                        />
                        Nữ
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Ngày sinh</label>
                    <div className={styles.dateGroup}>
                      <select 
                        name="birthDay" 
                        value={formData.birthDay}
                        onChange={handleChange}
                        className={styles.dateSelect}
                      >
                        <option value="">Ngày</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <select 
                        name="birthMonth" 
                        value={formData.birthMonth}
                        onChange={handleChange}
                        className={styles.dateSelect}
                      >
                        <option value="">Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <select 
                        name="birthYear" 
                        value={formData.birthYear}
                        onChange={handleChange}
                        className={styles.dateSelect}
                      >
                        <option value="">Năm</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="address">Địa chỉ</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={styles.input}
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
              <div className={styles.bookingHistory}>
                <h2>Lịch sử đặt phòng</h2>
                
                {bookingHistory.length === 0 ? (
                  <p>Bạn chưa có lịch sử đặt phòng nào.</p>
                ) : (
                  <div className={styles.bookingTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Phòng</th>
                          <th>Ngày nhận</th>
                          <th>Ngày trả</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingHistory.map(booking => (
                          <tr key={booking.id}>
                            <td>{booking.roomNumber}</td>
                            <td>{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</td>
                            <td>{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</td>
                            <td>{booking.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                            <td>
                              <span className={`${styles.bookingStatus} ${styles[booking.status]}`}>
                                {booking.status === 'completed' ? 'Đã hoàn thành' : 
                                 booking.status === 'upcoming' ? 'Sắp tới' : booking.status}
                              </span>
                            </td>
                            <td>
                              <button className={styles.viewButton}>Xem chi tiết</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                          console.error('Error deleting account:', err);
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