import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../services/roomService';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';

export default function Home() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Date state
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  
  // Guest count state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  
  // Rooms state
  const [hotelRooms, setHotelRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  useEffect(() => {
    fetchRooms();
    // Check if user is logged in
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }

    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getRooms();
      
      if (response.success && response.data) {
        setHotelRooms(response.data);
      } else {
        setError('Failed to load rooms');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkInDate || !checkOutDate) {
      alert('Vui lòng chọn ngày nhận phòng và trả phòng');
      return;
    }
    
    // Filter rooms based on search criteria
    const searchCriteria = {
      guests: adults + children,
    };
    
    // In a real app, you would search for available rooms using the API
    // For now, we'll just scroll to the rooms section
    fetchRoomsWithFilters(searchCriteria);
    
    // Scroll to the rooms section
    const roomsSection = document.getElementById('popular-rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const fetchRoomsWithFilters = async (filters: { guests: number }) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getRooms({ guests: filters.guests });
      
      if (response.success && response.data) {
        setHotelRooms(response.data);
      } else {
        setError('No rooms found matching your criteria');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowDropdown(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };
  
  // Handle window resize to close mobile menu on wider screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && showMobileMenu) {
        setShowMobileMenu(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showMobileMenu]);

  return (
    <div className={styles.container}>
      {/* Header */}
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
              <li className={`${styles.navItem} ${styles.active}`}>
                <Link href="/" className={styles.navLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Trang chủ
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/about" className={styles.navLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Giới thiệu
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/rooms" className={styles.navLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                    <path d="M3 22V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 2H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Phòng & Dịch vụ
                </Link>
              </li>
              <li className={styles.navItem}>
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
                <span>Điện thoại</span>
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

      {/* Hero section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Khách sạn Nhóm 5 tốt nhất thành phố Hồ Chí Minh
          </h1>
          
          {/* Search box */}
          <div className={styles.searchBox}>
            <form onSubmit={handleSearch}>
              <div className={styles.searchTabs}>
                <div className={styles.searchTab}>Tìm phòng của bạn</div>
              </div>
              
              <div className={styles.searchFields}>
                <div className={styles.fieldGroup}>
                  <label>Nhận phòng</label>
                  <div className={styles.dateInput}>
                    <input 
                      type="date" 
                      value={checkInDate} 
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.fieldGroup}>
                  <label>Số phòng</label>
                  <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>
                    <option value="1">1 phòng</option>
                    <option value="2">2 phòng</option>
                    <option value="3">3 phòng</option>
                    <option value="4">4 phòng</option>
                  </select>
                </div>
                
                <div className={styles.fieldGroup}>
                  <label>Người lớn</label>
                  <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                    <option value="1">1 người</option>
                    <option value="2">2 người</option>
                    <option value="3">3 người</option>
                    <option value="4">4 người</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.searchFields}>
                <div className={styles.fieldGroup}>
                  <label>Trả phòng</label>
                  <div className={styles.dateInput}>
                    <input 
                      type="date" 
                      value={checkOutDate} 
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.fieldGroup}>
                  <label>Trẻ em</label>
                  <select value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                    <option value="0">0 trẻ em</option>
                    <option value="1">1 trẻ em</option>
                    <option value="2">2 trẻ em</option>
                    <option value="3">3 trẻ em</option>
                  </select>
                </div>
                
                <div className={styles.searchButtonContainer}>
                  <button type="submit" className={styles.searchButton}>
                    Tìm phòng
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Popular rooms section */}
      <div id="popular-rooms" className={styles.popularRooms}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Các phòng được thuê nhiều nhất</h2>
          
          {loading ? (
            <div className={styles.loading}>
              <p>Đang tải thông tin phòng...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button 
                onClick={fetchRooms} 
                className={styles.retryButton}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className={styles.roomGrid}>
              {hotelRooms.map((room) => (
                <Link href={`/room/${room.id}`} key={room.id} className={styles.roomCard}>
                  <img src={room.imageUrl} alt={room.name} className={styles.roomImage} />
                  <div className={styles.roomInfo}>
                    <h3 className={styles.roomName}>{room.name}</h3>
                    <p className={styles.roomPrice}>{room.price.toLocaleString()} đ</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; {new Date().getFullYear()} Khách sạn Nhóm 5. All rights reserved.</p>
          
          <div className={styles.devTools}>
            <button 
              onClick={() => {
                const sampleUser = {
                  id: '123456',
                  username: 'testuser',
                  password: 'password123',
                  fullName: 'Người Dùng Test',
                  email: 'test@example.com',
                  phoneNumber: '0987654321',
                  gender: 'Nam',
                  birthDate: '',
                  address: 'Hà Nội'
                };

                // Lưu vào localStorage
                const users: Record<string, any> = {};
                users[sampleUser.username] = sampleUser;
                localStorage.setItem('registered_users', JSON.stringify(users));

                alert('Đã tạo tài khoản mẫu!\nTên đăng nhập: testuser\nMật khẩu: password123');
              }}
              className={styles.devButton}
            >
              Tạo tài khoản mẫu để test
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
