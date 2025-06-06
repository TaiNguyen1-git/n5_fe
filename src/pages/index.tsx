import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../services/roomService';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';
import axios from 'axios';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import PromotionBanner from '../components/client/PromotionBanner';
import UrgentStatsBar from '../components/client/UrgentStatsBar';
import CountdownTimer from '../components/client/CountdownTimer';
import AnimatedCounter from '../components/client/AnimatedCounter';

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

  // Thêm trạng thái kiểm tra xác thực
  const [authChecking, setAuthChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  // Kiểm tra nếu người dùng là admin hoặc nhân viên, chuyển hướng đến trang tương ứng
  useEffect(() => {
    const checkUserRole = async () => {
      setAuthChecking(true);

      // Thêm độ trễ nhỏ để đảm bảo cookies được đọc đúng
      await new Promise(resolve => setTimeout(resolve, 100));

      if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user) {
          // Kiểm tra tài khoản nhanvien2 đặc biệt
          if (user.username === 'nhanvien2' || (user as any).tenTK === 'nhanvien2') {
            router.push('/staff');
            return;
          }

          // Kiểm tra loaiTK hoặc role
          const loaiTK = typeof user.loaiTK === 'string' ? parseInt(user.loaiTK, 10) : user.loaiTK;
          const isAdmin = user.role === 'admin' || loaiTK === 1;
          const isStaff = user.role === 'staff' || loaiTK === 2;
          // Kiểm tra admin trước, sau đó mới kiểm tra staff
          if (isAdmin) {
            router.push('/admin');
            return; // Không render trang home
          } else if (isStaff) {
            router.push('/staff');
            return; // Không render trang home
          }
        }
      }

      // Nếu không phải admin hoặc staff, cho phép hiển thị trang home
      setAuthChecking(false);
      setShouldRender(true);
    };

    checkUserRole();
  }, [router]);

  useEffect(() => {
    fetchAllRooms();
  }, []);

  // Lấy tất cả phòng từ API với pagination
  const fetchAllRooms = async () => {
    setLoading(true);
    setError('');

    try {
      let allRoomsData: FormattedRoom[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const pageSize = 50; // Lấy 50 phòng mỗi lần

      // Lấy tất cả phòng qua nhiều trang
      while (hasMorePages) {
        const response = await axios.get('/api/rooms', {
          params: {
            pageNumber: currentPage,
            pageSize: pageSize
          },
          timeout: 20000,
          headers: {
            'Accept': '*/*'
          }
        });

        if (response.data && response.data.success && response.data.data) {
          const { items, totalPages } = response.data.data;

          // Format dữ liệu phòng
          const formattedRooms: FormattedRoom[] = items.map((room: any) => ({
            id: room.maPhong.toString(),
            maPhong: room.maPhong,
            tenPhong: room.tenPhong || room.soPhong || `Phòng ${room.maPhong}`,
            moTa: room.moTa || 'Thông tin phòng đang được cập nhật',
            hinhAnh: room.hinhAnh || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
            giaTien: room.giaTien || 500000,
            soLuongKhach: room.soLuongKhach || 2,
            trangThai: room.trangThai || 1,
            loaiPhong: room.loaiPhong || 'Standard',
            features: room.moTa ? room.moTa.split(',').map((item: string) => item.trim()) : ['Wi-Fi miễn phí', 'Điều hòa', 'TV']
          }));

          allRoomsData = [...allRoomsData, ...formattedRooms];

          // Kiểm tra có trang tiếp theo không
          hasMorePages = currentPage < totalPages;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }

      setHotelRooms(allRoomsData);

      // Cache dữ liệu
      try {
        localStorage.setItem('cached_rooms', JSON.stringify(allRoomsData));
        localStorage.setItem('rooms_cache_time', new Date().toISOString());
      } catch (cacheError) {
        // Ignore cache errors
      }
    } catch (err) {
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

  // Hiển thị màn hình loading khi đang kiểm tra xác thực
  if (authChecking) {
    return <LoadingSpinner />;
  }

  // Chỉ render trang chính khi đã kiểm tra xong và xác định đây là trang cần hiển thị
  if (!shouldRender) {
    return null; // Không hiển thị gì nếu đang chuyển hướng
  }

  return (
    <Layout>
      <div className={styles.container}>
        {/* Hero section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>🔥 Đặt Phòng Ngay - Giá Tốt Nhất Hôm Nay!</h1>
            <p className={styles.heroSubtitle}>
              ⚡ Hiện có <span className={styles.urgentNumber}>
                {!loading && hotelRooms.length > 0 ? (
                  <AnimatedCounter
                    end={hotelRooms.filter(room => room.trangThai === 1).length}
                    duration={1500}
                    suffix=" phòng"
                  />
                ) : (
                  `${hotelRooms.filter(room => room.trangThai === 1).length} phòng`
                )}
              </span> trống hôm nay
            </p>

            <div className={styles.searchBox}>
              <div className={styles.searchTabs}>
                <div className={styles.searchTab}>Đặt phòng</div>
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
                    <button type="submit" className={styles.searchButton}>🚀 TÌM PHÒNG TRỐNG NGAY</button>
                  </div>
                </div>
              </form>
            </div>

            {/* Trust signals */}
            <div className={styles.trustSignals}>
              <span>✅ Miễn phí hủy</span>
              <span>⚡ Xác nhận ngay</span>
              <span>🏆 Giá tốt nhất</span>
            </div>
          </div>
        </section>

        {/* Urgent Stats Bar */}
        <UrgentStatsBar
          availableRooms={hotelRooms.filter(room => room.trangThai === 1).length}
          totalRooms={hotelRooms.length}
        />
      </div>

      {/* Enhanced Promotion Banner with Countdown - Full Width */}
      <PromotionBanner />

      <div className={styles.container}>

        {/* Featured Rooms - Hot Deals */}
        <section className={styles.featuredRooms} id="popular-rooms">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>🏨 Phòng Trống Hôm Nay</h2>
            <p className={styles.sectionSubtitle}>⚡ Đặt ngay để có giá tốt nhất!</p>

            {loading ? (
              <div className={styles.loading}>Đang tải phòng...</div>
            ) : error ? (
              <div className={styles.error}>
                {error}
                <button className={styles.retryButton} onClick={fetchAllRooms}>Thử lại</button>
              </div>
            ) : (
              <div className={styles.roomGrid}>
                {hotelRooms
                  .filter(room => room.trangThai === 1) // Chỉ hiển thị phòng trống
                  .slice(0, 6) // Giới hạn 6 phòng đầu tiên
                  .map((room, index) => (
                  <div
                    key={room.id}
                    className={styles.roomCard}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.6s ease-out both'
                    }}
                  >
                    {/* Hot badge for top 3 rooms */}
                    {index < 3 && (
                      <div className={styles.hotBadge}>🔥 TOP #{index + 1}</div>
                    )}

                    {/* Pressure indicators */}
                    <div className={styles.pressureBar}>
                      <span className={styles.pressureItem}>
                        👥 <AnimatedCounter
                          end={Math.floor(Math.random() * 8) + 3}
                          duration={1000}
                          suffix=" người đang xem"
                        />
                      </span>
                      <span className={styles.pressureItem}>
                        ✅ Phòng trống
                      </span>
                    </div>

                    <Link href={`/room/${room.id}`}>
                      <img
                        src={room.hinhAnh || '/images/rooms/default-room.jpg'}
                        alt={room.tenPhong}
                        className={styles.roomImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/rooms/default-room.jpg';
                        }}
                      />
                    </Link>

                    <div className={styles.roomInfo}>
                      <div className={styles.roomHeader}>
                        <h3 className={styles.roomName}>{room.tenPhong}</h3>
                        <span className={styles.roomType}>{room.loaiPhong}</span>
                      </div>

                      <p className={styles.roomFeatures}>
                        {room.soLuongKhach} khách · {room.features?.slice(0, 2).join(' · ')}
                      </p>

                      {/* Price with discount */}
                      <div className={styles.priceSection}>
                        <span className={styles.originalPrice}>
                          {((room.giaTien || 500000) * 1.3).toLocaleString('vi-VN')}đ
                        </span>
                        <span className={styles.salePrice}>
                          {(room.giaTien || 500000).toLocaleString('vi-VN')}đ
                          <span className={styles.discount}>-30%</span>
                        </span>
                      </div>

                      {/* Urgent CTA */}
                      <Link href={`/room/${room.id}`}>
                        <button className={styles.urgentBookBtn}>
                          🚀 ĐẶT NGAY - PHÒNG TRỐNG
                        </button>
                      </Link>

                      <div className={styles.trustBadges}>
                        <span>✅ Miễn phí hủy</span>
                        <span>⚡ Xác nhận ngay</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
