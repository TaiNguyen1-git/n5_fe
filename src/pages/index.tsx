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

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <h1 style={{ color: '#0078c2' }}>Nhóm 5</h1>
          </div>
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
                >
                  {user.fullName || user.username}
                </button>
                {showDropdown && (
                  <div className={styles.dropdown}>
                    <button onClick={handleProfileClick} className={styles.dropdownItem}>
                      Hồ sơ của tôi
                    </button>
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.loginButton}>
                Đăng nhập
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
                <div className={styles.searchTab}>Tìm khách sạn của bạn</div>
                <div className={`${styles.searchTab} ${styles.inactive}`}>Theo điểm đến</div>
                <div className={`${styles.searchTab} ${styles.inactive}`}>Theo khách sạn</div>
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
        </div>
      </footer>
    </div>
  );
}
