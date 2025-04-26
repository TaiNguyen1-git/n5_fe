import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { forgotPassword, resetPassword } from '../services/authService';

export default function ForgotPassword() {
  const router = useRouter();
  const { token } = router.query; // Lấy token từ query params nếu có
  
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(token as string || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetStep, setShowResetStep] = useState(Boolean(token));
  const [countdown, setCountdown] = useState(10);
  const [emailSent, setEmailSent] = useState(false);

  // Xác định bước hiện tại dựa vào token, state hoặc email đã gửi
  const isResetStep = showResetStep || Boolean(token) || resetToken || emailSent;

  // Xử lý đếm ngược khi có thông báo thành công
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && !isResetStep && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [success, countdown, isResetStep]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    if (!email) {
      setError('Vui lòng nhập email của bạn');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccess(result.message);
        setCountdown(10); // Đặt lại bộ đếm ngược
        
        // Chuyển sang bước nhập token thay vì chuyển về trang đăng nhập
        setEmailSent(true);
        // Xóa thông báo thành công sau 3 giây
        setTimeout(() => {
          setSuccess('');
        }, 10000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!resetToken) {
      setError('Token không hợp lệ');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Password validation
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    // Password confirmation validation
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await resetPassword(resetToken, newPassword);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Tùy chỉnh thông báo dựa vào trạng thái
  const getSuccessMessage = () => {
    if (success && !isResetStep) {
      return (
        <div className={styles.successMessage}>
          <p>{success}</p>
          <p>Bạn sẽ được chuyển hướng trong {countdown} giây...</p>
        </div>
      );
    } else if (success && isResetStep) {
      return (
        <div className={styles.successMessage}>
          <p>{success}</p>
          {success.includes('thành công') && <p>Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...</p>}
        </div>
      );
    }
    return <div className={styles.successMessage}>{success}</div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.authBox}>
        <div className={styles.logo}>
          <h1>Nhóm 5</h1>
        </div>
        
        <div className={styles.formContainer}>
          <h2>Khôi phục mật khẩu</h2>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && getSuccessMessage()}
          
          {isResetStep ? (
            // Bước đặt lại mật khẩu với token
            <form onSubmit={handleResetPassword}>
              {emailSent && (
                <div className={styles.formGroup}>
                  <label htmlFor="resetToken">Mã xác nhận</label>
                  <input
                    type="text"
                    id="resetToken"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className={styles.input}
                    placeholder="Nhập mã xác nhận từ email"
                  />
                  <small className={styles.hint}>
                    Vui lòng kiểm tra email của bạn và nhập mã xác nhận đã được gửi.
                  </small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Nhập mật khẩu mới"
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
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
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
              
              <button
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.linkButton}
                  onClick={() => {
                    setEmailSent(false);
                    setShowResetStep(false);
                    setResetToken('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                >
                  Nhập email khác
                </button>
              </div>
            </form>
          ) : (
            // Bước yêu cầu đặt lại mật khẩu
            <form onSubmit={handleRequestReset}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Nhập tài khoản Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Nhập email đã đăng ký"
                />
              </div>
              
              <button
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </form>
          )}
          
          <div className={styles.createAccount}>
            <Link href="/login">
              <button className={styles.backButton}>
                Trở về trang đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 