import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../services/roomService';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();
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

  return (
    <Layout>
      <div className={styles.container}>
        {/* Hero section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Chào mừng đến với Khách sạn Nhóm 5</h1>
            
            <div className={styles.searchBox}>
              <div className={styles.searchTabs}>
                <div className={styles.searchTab}>Đặt phòng</div>
                <div className={styles.searchTab}>Đặt tour</div>
              </div>
              
              <form onSubmit={handleSearch}>
                <div className={styles.searchFields}>
                  <div className={styles.fieldGroup}>
                    <label>Nhận phòng</label>
                    <div className={styles.dateInput}>
                      <input 
                        type="date" 
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label>Trả phòng</label>
                    <div className={styles.dateInput}>
                      <input 
                        type="date" 
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label>Số người</label>
                    <select 
                      value={adults}
                      onChange={(e) => setAdults(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} người lớn</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label>Trẻ em</label>
                    <select 
                      value={children}
                      onChange={(e) => setChildren(parseInt(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} trẻ em</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.searchButtonContainer}>
                    <button type="submit" className={styles.searchButton}>Tìm phòng</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
        
        {/* Popular rooms section */}
        <section className={styles.popularRooms} id="popular-rooms">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Phòng phổ biến</h2>
            
            {loading ? (
              <div className={styles.loading}>Đang tải phòng...</div>
            ) : error ? (
              <div className={styles.error}>
                {error}
                <button className={styles.retryButton} onClick={fetchRooms}>Thử lại</button>
              </div>
            ) : (
              <div className={styles.roomGrid}>
                {hotelRooms.map(room => (
                  <Link href={`/room/${room.id}`} key={room.id} className={styles.roomCard}>
                    <img 
                      src={room.imageUrl} 
                      alt={room.name} 
                      className={styles.roomImage}
                    />
                    <div className={styles.roomInfo}>
                      <h3 className={styles.roomName}>{room.name}</h3>
                      <p className={styles.roomPrice}>{room.price.toLocaleString('vi-VN')} VNĐ / đêm</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
