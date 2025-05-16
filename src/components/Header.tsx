import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  MailOutlined,
  MenuOutlined,
  CloseOutlined
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
      console.log('Header - User data:', currentUser);
      setUser(currentUser);
    }

    // Lắng nghe sự kiện đăng nhập/đăng xuất
    const handleUserChange = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        console.log('Header - User updated:', currentUser);
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };

    // Đăng ký lắng nghe sự kiện storage thay đổi
    window.addEventListener('storage', (e) => {
      if (e.key === 'user' || e.key === 'auth_token') {
        handleUserChange();
      }
    });

    // Tạo một sự kiện tùy chỉnh để cập nhật dữ liệu user khi cần
    window.addEventListener('user-login', handleUserChange);
    window.addEventListener('user-logout', handleUserChange);

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
      window.removeEventListener('storage', handleUserChange);
      window.removeEventListener('user-login', handleUserChange);
      window.removeEventListener('user-logout', handleUserChange);
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
    setShowMobileMenu(false);
  };

  const handleServicesClick = () => {
    router.push('/services');
    setShowRoomsServicesDropdown(false);
    setShowMobileMenu(false);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const handleBookingsClick = () => {
    router.push('/bookings');
    setShowDropdown(false);
    setShowMobileMenu(false);
  };



  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <span>Nhóm 5</span>
          </Link>
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label={showMobileMenu ? "Đóng menu" : "Mở menu"}
        >
          {showMobileMenu ? <CloseOutlined /> : <MenuOutlined />}
        </button>

        <nav className={`${styles.navbar} ${showMobileMenu ? styles.navbarMobileOpen : ''}`}>
          <ul className={styles.navList}>
            <li className={`${styles.navItem} ${router.pathname === '/' ? styles.active : ''}`}>
              <Link href="/" className={styles.navLink}>
                <HomeOutlined className={styles.navIcon} />
                <span>Trang chủ</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <div className={styles.navLink} ref={roomsServicesDropdownRef}>
                <div
                  onClick={() => setShowRoomsServicesDropdown(!showRoomsServicesDropdown)}
                  className={styles.dropdownTrigger}
                >
                  <HomeOutlined className={styles.navIcon} />
                  <span>Phòng & Dịch vụ</span>
                  <DownOutlined className={`${styles.dropdownArrow} ${showRoomsServicesDropdown ? styles.dropdownArrowOpen : ''}`} />
                </div>

                {showRoomsServicesDropdown && (
                  <div className={styles.dropdown}>
                    <button onClick={handleRoomsClick} className={styles.dropdownItem}>
                      <HomeOutlined className={styles.dropdownIcon} />
                      <span>Phòng</span>
                    </button>
                    <button onClick={handleServicesClick} className={styles.dropdownItem}>
                      <SettingOutlined className={styles.dropdownIcon} />
                      <span>Dịch vụ</span>
                    </button>
                  </div>
                )}
              </div>
            </li>
            <li className={`${styles.navItem} ${router.pathname === '/bookings' || router.pathname.startsWith('/bookings/') ? styles.active : ''}`}>
              <Link href="/bookings" className={styles.navLink}>
                <CalendarOutlined className={styles.navIcon} />
                <span>Đặt phòng</span>
              </Link>
            </li>

            <li className={`${styles.navItem} ${router.pathname === '/about' ? styles.active : ''}`}>
              <Link href="/about" className={styles.navLink}>
                <InfoCircleOutlined className={styles.navIcon} />
                <span>Giới thiệu</span>
              </Link>
            </li>
            <li className={`${styles.navItem} ${router.pathname === '/contact' ? styles.active : ''}`}>
              <Link href="/contact" className={styles.navLink}>
                <MailOutlined className={styles.navIcon} />
                <span>Liên hệ</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.headerRight}>
          <div className={styles.contact}>
            <span>Thời gian hỗ trợ</span>
            <div className={styles.phoneNumber}>
              <PhoneOutlined className={styles.phoneIcon} />
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
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={styles.userName}>{user.username || 'User'}</span>
                  <DownOutlined className={`${styles.dropdownArrow} ${showDropdown ? styles.dropdownArrowOpen : ''}`} />
                </div>
              </button>

              {showDropdown && (
                <div className={styles.dropdown}>
                  <button onClick={handleProfileClick} className={styles.dropdownItem}>
                    <UserOutlined className={styles.dropdownIcon} />
                    <span>Hồ sơ của tôi</span>
                  </button>
                  <button onClick={handleBookingsClick} className={styles.dropdownItem}>
                    <CalendarOutlined className={styles.dropdownIcon} />
                    <span>Lịch sử đặt phòng</span>
                  </button>

                  <div className={styles.dropdownDivider}></div>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <LogoutOutlined className={styles.dropdownIcon} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              <UserOutlined className={styles.loginIcon} />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;