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
    email: '',
    fullName: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
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
      const response = await register(formData);
      
      if (response.success) {
        // Redirect to login page after successful registration
        router.push('/login?registered=true');
      } else {
        setError(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Thanh Long" />
          <h1>Thanh Long</h1>
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
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
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
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label htmlFor="agreeTerms">
                Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
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