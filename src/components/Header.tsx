import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';
import styles from '../styles/Header.module.css';

const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRoomsServicesDropdown, setShowRoomsServicesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roomsServicesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (roomsServicesDropdownRef.current && !roomsServicesDropdownRef.current.contains(event.target as Node)) {
        setShowRoomsServicesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleRoomsClick = () => {
    router.push('/rooms');
    setShowRoomsServicesDropdown(false);
  };

  const handleServicesClick = () => {
    router.push('/services');
    setShowRoomsServicesDropdown(false);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowDropdown(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <h1 style={{ color: '#0078c2' }}>Nhóm 5</h1>
        </div>
        
        <button 
          className={styles.mobileMenuButton} 
          onClick={toggleMobileMenu}
          aria-label={showMobileMenu ? "Đóng menu" : "Mở menu"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {showMobileMenu ? (
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>

        <nav className={`${styles.navbar} ${showMobileMenu ? styles.navbarMobileOpen : ''}`}>
          <ul className={styles.navList}>
            <li className={`${styles.navItem} ${router.pathname === '/' ? styles.active : ''}`}>
              <Link href="/" className={styles.navLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trang chủ
              </Link>
            </li>
            <li className={styles.navItem}>
              <div className={styles.navLink} style={{ position: 'relative' }} ref={roomsServicesDropdownRef}>
                <div 
                  onClick={() => setShowRoomsServicesDropdown(!showRoomsServicesDropdown)}
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                    <path d="M3 22V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 2H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ marginLeft: '6px' }}>Phòng & Dịch vụ</span>
                  <svg 
                    className={`${styles.dropdownIcon} ${showRoomsServicesDropdown ? styles.dropdownIconOpen : ''}`} 
                    width="10" 
                    height="6" 
                    viewBox="0 0 10 6" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginLeft: '5px' }}
                  >
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {showRoomsServicesDropdown && (
                  <div className={styles.dropdown} style={{ top: '100%', left: '0', marginTop: '5px' }}>
                    <button onClick={handleRoomsClick} className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.itemIcon}>
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Phòng</span>
                    </button>
                    <button onClick={handleServicesClick} className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.itemIcon}>
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.02-3.02a6 6 0 01-7.07 7.07l-2.68 2.68a2 2 0 01-2.83 0l-4.24-4.24a2 2 0 010-2.83l2.68-2.68a6 6 0 017.07-7.07l3.02 3.02z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Dịch vụ</span>
                    </button>
                  </div>
                )}
              </div>
            </li>
            <li className={`${styles.navItem} ${router.pathname === '/about' ? styles.active : ''}`}>
              <Link href="/about" className={styles.navLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Giới thiệu
              </Link>
            </li>
            <li className={`${styles.navItem} ${router.pathname === '/contact' ? styles.active : ''}`}>
              <Link href="/contact" className={styles.navLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                  <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.832 20.7294C21.7199 20.9845 21.5554 21.2136 21.3496 21.4019C21.1437 21.5901 20.9014 21.7335 20.6389 21.8227C20.3764 21.9119 20.0989 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3146 6.72533 15.2661 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.17999C2.09494 3.90194 2.12781 3.62476 2.21656 3.36238C2.3053 3.09999 2.44763 2.85762 2.63476 2.65172C2.82189 2.44582 3.04974 2.28095 3.30372 2.16846C3.55771 2.05596 3.83227 1.99828 4.10999 1.99999H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79998 9.04207 3.23945 9.10999 3.71999C9.23662 4.68004 9.47144 5.62272 9.80999 6.52999C9.94454 6.88016 9.97366 7.26597 9.89391 7.63578C9.81415 8.0056 9.6288 8.34344 9.35999 8.59999L8.08999 9.86999C9.51355 12.3427 11.5173 14.3464 13.99 15.77L15.26 14.5C15.5166 14.2312 15.8544 14.0458 16.2242 13.9661C16.594 13.8863 16.9798 13.9154 17.33 14.05C18.2373 14.3885 19.1799 14.6233 20.14 14.75C20.6224 14.8185 21.0634 15.061 21.3798 15.4318C21.6962 15.8026 21.8662 16.2759 21.86 16.76L22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.headerRight}>
          <div className={styles.contact}>
            <span>Thời gian hỗ trợ</span>
            <div className={styles.phoneNumber}>
              <img src="/phone-support-icon.png" alt="Phone" className={styles.icon} />
              <span>+84 123 456 789</span>
            </div>
          </div>
          {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button 
                className={styles.userButton}
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User menu"
                aria-expanded={showDropdown}
              >
                <div className={styles.userAvatarContainer}>
                  <div className={styles.userAvatar}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className={styles.userName}>{user.fullName || user.username}</span>
                  <svg 
                    className={`${styles.dropdownIcon} ${showDropdown ? styles.dropdownIconOpen : ''}`} 
                    width="10" 
                    height="6" 
                    viewBox="0 0 10 6" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              
              {showDropdown && (
                <div className={styles.dropdown}>
                  <button onClick={handleProfileClick} className={styles.dropdownItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.itemIcon}>
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 21C20 18.7909 20 17.6863 19.5607 16.8281C19.1878 16.0944 18.6059 15.5125 17.8722 15.1396C17.014 14.7002 15.9094 14.7002 13.7002 14.7002H10.2998C8.09058 14.7002 6.98601 14.7002 6.12779 15.1396C5.39412 15.5125 4.81221 16.0944 4.4393 16.8281C4 17.6863 4 18.7909 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Hồ sơ của tôi</span>
                  </button>
                  <div className={styles.dropdownDivider}></div>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.itemIcon}>
                      <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.loginIcon}>
                <path d="M15 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19 12L15 8M19 12L15 16M19 12H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 