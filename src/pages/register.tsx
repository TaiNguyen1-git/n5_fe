import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { register } from '../services/authService';
import styles from '../styles/Auth.module.css';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.email || !formData.fullName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ');
      return false;
    }
    
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Đảm bảo dữ liệu đăng ký phù hợp với API
      const userData = {
        userName: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phoneNumber || ''
      };
      // Sử dụng API register-handler (gọi đúng API /User/RegisterUser)
      const response = await fetch('/api/register-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phoneNumber || ''
        })
      });
      
      const result = await response.json();
      // Chỉ xử lý thành công nếu cả response.ok và result.success đều là true
      if (response.ok && result.success === true) {
        // Hiển thị thông báo thành công và chuyển hướng
        setError('');
        
        // Thêm thông báo thành công với class màu xanh
        const successMsg = document.createElement('div');
        successMsg.className = styles.successMessage || '';
        successMsg.style.color = 'green';
        successMsg.style.padding = '10px';
        successMsg.style.marginBottom = '10px';
        successMsg.style.border = '1px solid green';
        successMsg.style.borderRadius = '4px';
        successMsg.innerText = 'Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...';
        
        // Chèn thông báo vào DOM
        const form = document.querySelector('form');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(successMsg, form);
        }
        
        // Chuyển hướng sau 2 giây
        setTimeout(() => {
          router.push('/login?registered=true&username=' + encodeURIComponent(formData.username));
        }, 2000);
      } else {
        // Hiển thị thông báo lỗi từ API
        const errorMsg = result.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError('Có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <h1 style={{ color: '#0078c2' }}>Nhóm 5</h1>
        </div>
        
        <div className={styles.formContainer}>
          <h2>Đăng ký tài khoản của bạn</h2>
          <p className={styles.subtitle}>Điền vào các thông tin dưới đây để tạo tài khoản.</p>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Tên đăng nhập *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="Nhập email"
                required
              />
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
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Mật khẩu *</label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                  required
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
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <div className={styles.passwordContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? (
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
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label htmlFor="agreeTerms">
                Tôi đồng ý với <Link href="/terms-of-service">Điều khoản dịch vụ</Link> và <Link href="/privacy-policy">Chính sách bảo mật</Link>
              </label>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>
          
          <div className={styles.loginLink}>
            <p>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
} 