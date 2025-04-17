import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { updateUserProfile, getCurrentUser } from '../services/authService';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Get stored user data from localStorage
      const storedUserData = localStorage.getItem('user');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // Format birth date if it exists
        let birthDay = '';
        let birthMonth = '';
        let birthYear = '';
        
        if (userData.birthDate) {
          const date = new Date(userData.birthDate);
          birthDay = date.getDate().toString();
          birthMonth = (date.getMonth() + 1).toString();
          birthYear = date.getFullYear().toString();
        }

        // Update form data with user information
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.fullName || !formData.email) {
        setError('Vui lòng điền đầy đủ họ tên và email');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Email không hợp lệ');
        setLoading(false);
        return;
      }

      // Validate phone number if provided
      if (formData.phoneNumber) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
          setError('Số điện thoại không hợp lệ');
          setLoading(false);
          return;
        }
      }

      // Format birth date if all parts are provided
      let birthDate;
      if (formData.birthDay && formData.birthMonth && formData.birthYear) {
        birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;
        
        // Validate birth date
        const date = new Date(birthDate);
        if (date > new Date()) {
          setError('Ngày sinh không hợp lệ');
          setLoading(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        username: formData.username,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber?.trim(),
        gender: formData.gender,
        birthDate,
        address: formData.address?.trim()
      };

      const response = await updateUserProfile(updateData);

      if (response.success) {
        // Update local storage with new data
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = styles.successMessage;
        successMessage.textContent = 'Cập nhật thông tin thành công!';
        const formContainer = document.querySelector(`.${styles.formContainer}`);
        if (formContainer) {
          const existingSuccess = formContainer.querySelector(`.${styles.successMessage}`);
          if (existingSuccess) {
            existingSuccess.remove();
          }
          formContainer.insertBefore(successMessage, formContainer.firstChild);

          // Remove success message after 3 seconds
          setTimeout(() => {
            successMessage.remove();
          }, 3000);
        }

        // Redirect after a short delay
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
    <div className={styles.container}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <h1>Hồ Sơ Của Tôi</h1>
        </div>
        
        <div className={styles.formContainer}>
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

          <div className={styles.createAccount}>
            <Link href="/">
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 