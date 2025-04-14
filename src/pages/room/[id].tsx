import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/RoomDetail.module.css';
import { getRoomById, bookRoom, Room as RoomType, Booking } from '../../services/roomService';

// Room type interface
interface Room {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  images: string[];
  maxGuests: number;
  beds: {
    type: string;
    count: number;
  }[];
}

// Mock data for rooms
const roomsData: { [key: string]: Room } = {
  '101': {
    id: '101',
    name: 'Phòng 101',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: ['/room1.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  '102': {
    id: '102',
    name: 'Phòng 102',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: ['/room2.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  '103': {
    id: '103',
    name: 'Phòng 103',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: ['/room3.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  '104': {
    id: '104',
    name: 'Phòng 104',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: ['/room4.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
  '105': {
    id: '105',
    name: 'Phòng 105',
    price: 100000,
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho cặp đôi hoặc khách du lịch một mình.',
    features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng tắm riêng'],
    images: ['/room5.jpg', '/room-detail1.jpg', '/room-detail2.jpg'],
    maxGuests: 2,
    beds: [{ type: 'Giường đôi', count: 1 }]
  },
};

export default function RoomDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [room, setRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeImage, setActiveImage] = useState(0);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  useEffect(() => {
    // Fetch room data when ID is available
    if (id) {
      fetchRoomData();
    }
  }, [id]);
  
  const fetchRoomData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getRoomById(id as string);
      
      if (response.success && response.data) {
        setRoom(response.data);
      } else {
        setError(response.message || 'Failed to load room data');
      }
    } catch (err) {
      setError('An error occurred while loading room data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };
  
  const calculateTotalPrice = () => {
    if (!room || !checkInDate || !checkOutDate) return room?.price || 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Calculate number of nights
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    
    return room.price * nights;
  };
  
  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room) return;
    
    if (!checkInDate || !checkOutDate) {
      setBookingError('Vui lòng chọn ngày nhận phòng và trả phòng');
      return;
    }
    
    if (!bookingForm.guestName || !bookingForm.guestEmail) {
      setBookingError('Vui lòng điền đầy đủ thông tin cần thiết');
      return;
    }
    
    setBookingLoading(true);
    setBookingError('');
    
    try {
      const totalPrice = calculateTotalPrice();
      
      const bookingData: Booking = {
        roomId: room.id,
        guestName: bookingForm.guestName,
        guestEmail: bookingForm.guestEmail,
        guestPhone: bookingForm.guestPhone,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice
      };
      
      const response = await bookRoom(bookingData);
      
      if (response.success) {
        setBookingSuccess(true);
        // Reset form
        setBookingForm({
          guestName: '',
          guestEmail: '',
          guestPhone: '',
        });
        setCheckInDate('');
        setCheckOutDate('');
        setGuests(1);
      } else {
        setBookingError(response.message || 'Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại.');
      }
    } catch (err) {
      setBookingError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <img src="/hotel-loading.jpg" alt="Loading" className={styles.loadingImage} />
          <p>Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }
  
  if (error || !room) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Phòng không tìm thấy</h2>
          <p>{error || 'Không tìm thấy thông tin phòng bạn yêu cầu.'}</p>
          <Link href="/" className={styles.backButton}>
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Link href="/">
              <h1 style={{ color: '#0078c2' }}>NHÓM 5</h1>
            </Link>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.contact}>
              <span>Thời gian hỗ trợ</span>
              <div className={styles.phoneNumber}>
                <img src="/phone-support-icon.png" alt="Phone" className={styles.icon} />
                <span>+84 123 456 789</span>
              </div>
            </div>
            <Link href="/login" className={styles.loginButton}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>
      
      <div className={styles.content}>
        <div className={styles.roomDetailContainer}>
          {/* Room gallery */}
          <div className={styles.roomGallery}>
            <div className={styles.mainImage}>
              <img src={room.images[activeImage]} alt={room.name} />
            </div>
            <div className={styles.thumbnails}>
              {room.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`${styles.thumbnail} ${index === activeImage ? styles.active : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${room.name} - hình ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Room information */}
          <div className={styles.roomInfo}>
            <h1 className={styles.roomName}>{room.name}</h1>
            <p className={styles.roomPrice}>{room.price.toLocaleString()} đ / đêm</p>
            
            <div className={styles.roomDescription}>
              <h2>Mô tả</h2>
              <p>{room.description}</p>
            </div>
            
            <div className={styles.roomFeatures}>
              <h2>Tiện nghi</h2>
              <ul>
                {room.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.roomDetails}>
              <div className={styles.detailItem}>
                <h3>Số khách tối đa</h3>
                <p>{room.maxGuests} người</p>
              </div>
              <div className={styles.detailItem}>
                <h3>Giường</h3>
                {room.beds.map((bed, index) => (
                  <p key={index}>{bed.count} {bed.type}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Booking form */}
          <div className={styles.bookingForm}>
            <h2>Đặt phòng</h2>
            
            {bookingSuccess ? (
              <div className={styles.bookingSuccess}>
                <h3>Đặt phòng thành công!</h3>
                <p>Cảm ơn bạn đã đặt phòng tại Khách sạn Nhóm 5. Chúng tôi đã gửi thông tin xác nhận đến email của bạn.</p>
                <button 
                  onClick={() => setBookingSuccess(false)}
                  className={styles.newBookingButton}
                >
                  Đặt phòng khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookNow}>
                {bookingError && (
                  <div className={styles.bookingError}>
                    {bookingError}
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="checkIn">Ngày nhận phòng</label>
                  <input 
                    type="date" 
                    id="checkIn" 
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="checkOut">Ngày trả phòng</label>
                  <input 
                    type="date" 
                    id="checkOut" 
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="guests">Số khách</label>
                  <select 
                    id="guests" 
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    {[...Array(room.maxGuests)].map((_, i) => (
                      <option key={i} value={i + 1}>{i + 1} người</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="guestName">Họ tên</label>
                  <input 
                    type="text" 
                    id="guestName"
                    name="guestName" 
                    value={bookingForm.guestName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="guestEmail">Email</label>
                  <input 
                    type="email" 
                    id="guestEmail"
                    name="guestEmail" 
                    value={bookingForm.guestEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="guestPhone">Số điện thoại</label>
                  <input 
                    type="tel" 
                    id="guestPhone"
                    name="guestPhone" 
                    value={bookingForm.guestPhone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className={styles.totalPrice}>
                  <span>Tổng tiền</span>
                  <span className={styles.price}>{calculateTotalPrice().toLocaleString()} đ</span>
                </div>
                
                <button 
                  type="submit" 
                  className={styles.bookButton}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Đang xử lý...' : 'Đặt ngay'}
                </button>
              </form>
            )}
          </div>
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