import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Rooms.module.css';
import Header from '../../components/Header';

interface Room {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  capacity: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
}

export default function Rooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomType: ''
  });

  // Danh sách phòng có sẵn
  useEffect(() => {
    // Giả lập API call
    setTimeout(() => {
      setRooms([
        {
          id: 1,
          name: 'Phòng Deluxe',
          description: 'Phòng sang trọng với tầm nhìn ra thành phố, đầy đủ tiện nghi hiện đại và không gian thoải mái.',
          price: 1200000,
          oldPrice: 1500000,
          discount: 20,
          image: '/images/room1.jpg',
          capacity: 2,
          beds: 1,
          bathrooms: 1,
          amenities: ['WiFi', 'TV', 'Minibar', 'Air Conditioning']
        },
        {
          id: 2,
          name: 'Phòng Family Suite',
          description: 'Phòng rộng rãi phù hợp cho gia đình, có khu vực phòng khách riêng và ban công với tầm nhìn đẹp.',
          price: 2500000,
          image: '/images/room2.jpg',
          capacity: 4,
          beds: 2,
          bathrooms: 2,
          amenities: ['WiFi', 'TV', 'Minibar', 'Air Conditioning', 'Balcony']
        },
        {
          id: 3,
          name: 'Phòng Superior',
          description: 'Phòng thoải mái với thiết kế hiện đại, đầy đủ tiện nghi cần thiết cho kỳ nghỉ của bạn.',
          price: 900000,
          oldPrice: 1100000,
          discount: 18,
          image: '/images/room3.jpg',
          capacity: 2,
          beds: 1,
          bathrooms: 1,
          amenities: ['WiFi', 'TV', 'Air Conditioning']
        },
        {
          id: 4,
          name: 'Phòng Executive',
          description: 'Phòng cao cấp với không gian làm việc riêng biệt, phù hợp cho doanh nhân.',
          price: 1800000,
          image: '/images/room4.jpg',
          capacity: 2,
          beds: 1,
          bathrooms: 1,
          amenities: ['WiFi', 'TV', 'Minibar', 'Air Conditioning', 'Work Desk']
        },
        {
          id: 5,
          name: 'Suite Tổng Thống',
          description: 'Suite sang trọng bậc nhất với không gian rộng lớn, dịch vụ riêng và tầm nhìn toàn cảnh.',
          price: 5000000,
          image: '/images/room5.jpg',
          capacity: 4,
          beds: 2,
          bathrooms: 2,
          amenities: ['WiFi', 'TV', 'Minibar', 'Air Conditioning', 'Balcony', 'Private Butler']
        },
        {
          id: 6,
          name: 'Phòng Standard',
          description: 'Phòng tiêu chuẩn thoải mái với tất cả các tiện nghi cơ bản cần thiết.',
          price: 700000,
          oldPrice: 850000,
          discount: 18,
          image: '/images/room6.jpg',
          capacity: 2,
          beds: 1,
          bathrooms: 1,
          amenities: ['WiFi', 'TV', 'Air Conditioning']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trong ứng dụng thực tế, đây sẽ là nơi lọc phòng dựa trên các tham số tìm kiếm
    console.log('Search params:', searchParams);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' đ';
  };

  const handleBookNow = (roomId: number) => {
    router.push(`/rooms/${roomId}`);
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Danh sách phòng có sẵn</h1>
          <p className={styles.subtitle}>
            Khách sạn của chúng tôi hiện có 6 loại phòng đang được cung cấp, phù hợp với mọi nhu cầu và ngân sách
          </p>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.searchBar}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <div className={styles.formGroup}>
                <label htmlFor="checkIn">Ngày nhận phòng</label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  value={searchParams.checkIn}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="checkOut">Ngày trả phòng</label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  value={searchParams.checkOut}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="guests">Số người</label>
                <select
                  id="guests"
                  name="guests"
                  value={searchParams.guests}
                  onChange={handleInputChange}
                >
                  <option value="1">1 người</option>
                  <option value="2">2 người</option>
                  <option value="3">3 người</option>
                  <option value="4">4 người</option>
                  <option value="5">5+ người</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="roomType">Loại phòng</label>
                <select
                  id="roomType"
                  name="roomType"
                  value={searchParams.roomType}
                  onChange={handleInputChange}
                >
                  <option value="">Tất cả các loại</option>
                  <option value="standard">Standard</option>
                  <option value="superior">Superior</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="executive">Executive</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
              
              <button type="submit" className={styles.searchButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
                </svg>
                Tìm phòng
              </button>
            </form>
          </div>

          {loading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : (
            <>
              <h2 className={styles.sectionTitle}>Tất cả loại phòng đang có sẵn</h2>
              <div className={styles.roomsGrid}>
                {rooms.map(room => (
                  <div key={room.id} className={styles.roomCard}>
                    <div className={styles.roomImage}>
                      <img src={room.image || '/images/room-placeholder.jpg'} alt={room.name} />
                      {room.discount && (
                        <div className={styles.discount}>-{room.discount}%</div>
                      )}
                    </div>
                    <div className={styles.roomContent}>
                      <h2 className={styles.roomName}>{room.name}</h2>
                      <div className={styles.amenities}>
                        <div className={styles.amenity}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 4C16.55 4 17 4.45 17 5V6H22V10H17V11C17 11.55 16.55 12 16 12H8C7.45 12 7 11.55 7 11V10H2V6H7V5C7 4.45 7.45 4 8 4H16ZM16 6H8V10H16V6ZM7 13C7.55 13 8 13.45 8 14V15H22V19H8V20C8 20.55 7.55 21 7 21H3C2.45 21 2 20.55 2 20V14C2 13.45 2.45 13 3 13H7ZM7 15H3V19H7V15Z" fill="currentColor"/>
                          </svg>
                          <span>{room.beds} giường</span>
                        </div>
                        <div className={styles.amenity}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                          </svg>
                          <span>{room.capacity} người</span>
                        </div>
                        <div className={styles.amenity}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 19L12 14L17 19H7ZM7 5H17L12 10L7 5Z" fill="currentColor"/>
                          </svg>
                          <span>{room.bathrooms} phòng tắm</span>
                        </div>
                      </div>
                      <p className={styles.roomDescription}>{room.description}</p>
                      <div className={styles.priceRow}>
                        <div>
                          {room.oldPrice && (
                            <span className={styles.oldPrice}>{formatPrice(room.oldPrice)}</span>
                          )}
                          <div className={styles.price}>
                            {formatPrice(room.price)}
                            <span> / đêm</span>
                          </div>
                        </div>
                        <button 
                          className={styles.bookButton}
                          onClick={() => handleBookNow(room.id)}
                        >
                          Đặt ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>Về chúng tôi</h3>
            <p>Khách sạn Nhóm 5 - Nơi nghỉ dưỡng lý tưởng với không gian sang trọng, tiện nghi hiện đại và dịch vụ chất lượng cao.</p>
            <div className={styles.socialLinks}>
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên kết nhanh</h3>
            <ul>
              <li><a href="/">Trang chủ</a></li>
              <li><a href="/rooms">Phòng</a></li>
              <li><a href="/services">Dịch vụ</a></li>
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Dịch vụ</h3>
            <ul>
              <li><a href="#">Đặt phòng</a></li>
              <li><a href="#">Nhà hàng</a></li>
              <li><a href="#">Spa & Wellness</a></li>
              <li><a href="#">Hội nghị & Sự kiện</a></li>
              <li><a href="#">Dịch vụ đặc biệt</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên hệ</h3>
            <p>10 Huỳnh Thúc Kháng, Tân Phú, Biên Hòa, Đồng Nai</p>
            <p>Điện thoại: (0251) 382 2288</p>
            <p>Email: info@lhu.edu.vn</p>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Khách sạn Nhóm 5. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}