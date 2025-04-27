import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../services/roomService';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';
import Layout from '../components/Layout';
import axios from 'axios';

// Cấu trúc phòng từ API mới
interface APIRoom {
  maPhong: number;
  soPhong: string;
  soNguoi: number;
  hinhAnh: string | null;
  moTa: string;
  loaiPhong: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
    phongs: null;
  };
  trangThaiPhong: {
    maTT: number;
    tenTT: string;
    phongs: null;
  };
  trangThai: number;
  tenTT: string;
}

// Format phòng cho UI
interface FormattedRoom {
  id: string;
  maPhong: number;
  tenPhong: string;
  moTa: string;
  hinhAnh: string;
  giaTien: number;
  soLuongKhach: number;
  trangThai: number;
  loaiPhong: string;
  images?: string[];
  features?: string[];
}

export default function Home() {
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  
  // Guest count state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  
  // Rooms state
  const [hotelRooms, setHotelRooms] = useState<FormattedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchRooms();
  }, []);
  
  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Sử dụng API proxy của Next.js thay vì gọi trực tiếp
      const response = await axios.get('/api/proxy-rooms', {
        timeout: 20000, // 20 giây timeout
        headers: {
          'Accept': '*/*'
        }
      });
      
      // Kiểm tra response có data không
      if (response.data && Array.isArray(response.data.items)) {
        // Format dữ liệu phòng theo đúng cấu trúc hiện tại
        const formattedRooms: FormattedRoom[] = response.data.items.map((room: any) => ({
          id: room.maPhong.toString(),
          maPhong: room.maPhong,
          tenPhong: room.soPhong || `Phòng ${room.maPhong}`,
          moTa: room.moTa || 'Thông tin phòng đang được cập nhật',
          hinhAnh: room.hinhAnh || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
          giaTien: room.loaiPhong?.giaPhong || 500000,
          soLuongKhach: room.soNguoi || 2,
          trangThai: room.trangThai || 1,
          loaiPhong: room.loaiPhong?.tenLoai || 'Standard',
          features: room.moTa ? room.moTa.split(',').map((item: string) => item.trim()) : ['Wi-Fi miễn phí', 'Điều hòa', 'TV']
        }));
        
        setHotelRooms(formattedRooms);
        
        // Cache dữ liệu
        try {
          localStorage.setItem('cached_rooms', JSON.stringify(formattedRooms));
          localStorage.setItem('rooms_cache_time', new Date().toISOString());
        } catch (cacheError) {
          console.warn('Error caching rooms data:', cacheError);
        }
      } else {
        throw new Error('Không nhận được dữ liệu phòng từ API');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      
      // Thử lấy dữ liệu từ cache nếu có lỗi
      try {
        const cachedRoomsStr = localStorage.getItem('cached_rooms');
        if (cachedRoomsStr) {
          const cachedRooms = JSON.parse(cachedRoomsStr);
          setHotelRooms(cachedRooms);
          setError('Không thể kết nối đến máy chủ. Dữ liệu đang được tải từ bộ nhớ đệm và có thể không phải là mới nhất.');
        } else {
          // Kiểm tra lỗi timeout
          if (err instanceof Error) {
            if (err.message.includes('timeout') || 
                err.message.includes('network error') || 
                (err as any).code === 'ECONNABORTED' || 
                (err as any).code === 'ERR_NETWORK') {
              setError('Máy chủ đang phản hồi chậm. Vui lòng thử lại sau hoặc kiểm tra kết nối internet của bạn.');
            } else {
              setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
          } else {
            setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
          }
        }
      } catch (cacheError) {
        console.error('Error reading from cache:', cacheError);
        setError('Không thể tải dữ liệu phòng. Vui lòng thử lại sau.');
      }
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
    
    // Get total guest count
    const totalGuests = adults + children;
    
    // Filter rooms based on guest count
    const filteredRooms = hotelRooms.filter(room => room.soLuongKhach >= totalGuests);
    setHotelRooms(filteredRooms.length > 0 ? filteredRooms : hotelRooms);
    
    // Scroll to the rooms section
    const roomsSection = document.getElementById('popular-rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
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
                      src={room.hinhAnh} 
                      alt={room.tenPhong} 
                      className={styles.roomImage}
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop';
                      }}
                    />
                    <div className={styles.roomInfo}>
                      <div className={styles.roomHeader}>
                        <h3 className={styles.roomName}>{room.tenPhong}</h3>
                        <span className={styles.roomType}>{room.loaiPhong}</span>
                      </div>
                      <p className={styles.roomFeatures}>
                        {room.soLuongKhach} khách · {room.features?.slice(0, 2).join(' · ')}
                      </p>
                      <p className={styles.roomPrice}>
                        {room.giaTien?.toLocaleString('vi-VN')} VNĐ / đêm
                      </p>
                      <div className={styles.roomStatus}>
                        <span className={room.trangThai === 1 ? styles.available : styles.unavailable}>
                          {room.trangThai === 1 ? 'Còn phòng' : 'Hết phòng'}
                        </span>
                      </div>
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
