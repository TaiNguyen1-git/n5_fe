import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { login } from '../services/authService';
import styles from '../styles/Auth.module.css';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const response = await login({ username, password });
      
      if (response.success) {
        // Redirect to home page or dashboard
        router.push('/');
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
          <h2>Xin Chào</h2>
          <p className={styles.subtitle}>Đăng nhập để tiếp tục</p>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
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
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
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
            <Link href="/register">
              <span>Tạo tài khoản</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 