import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/RoomDetail.module.css';
import { getRoomById, bookRoom, Room, Booking } from '../../services/roomService';
import { isAuthenticated, getCurrentUser, redirectToLoginIfNotAuthenticated } from '../../services/authService';
import Layout from '../../components/Layout';
import { format } from 'date-fns';
import { useUserStore } from '../../stores/userStore';

// Room interface is imported from roomService now

// Booking form state interface
interface BookingFormState {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}


export default function RoomDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeImage, setActiveImage] = useState(0);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const userStore = useUserStore();
  const [requireLogin, setRequireLogin] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      if (!id) {
        setError('Không tìm thấy mã phòng');
        setLoading(false);
        return;
      }
      
      const roomId = Array.isArray(id) ? id[0] : id;
      const response = await getRoomById(roomId);
      
      if (response.success && response.data) {
        setRoom(response.data);
        // Set document title
        document.title = `${response.data.tenPhong} - Khách sạn Nhóm 5`;
        
        // If there's a warning message (like data from cache), show it
        if (response.message && response.message.includes('bộ nhớ đệm')) {
          setError(response.message);
        }
      } else {
        setError(response.message || 'Không tìm thấy thông tin phòng');
      }
    } catch (err) {
      console.error('Error fetching room data:', err);
      if (err instanceof Error) {
        // Hiển thị thông báo lỗi thân thiện với người dùng
        if ('isAxiosError' in err) {
          if ((err as any).code === 'ECONNABORTED' || 
              (err as any).code === 'ERR_NETWORK' || 
              err.message.includes('timeout') || 
              err.message.includes('Network Error')) {
            setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.');
          } else {
            setError('Có lỗi xảy ra khi tải thông tin phòng. Vui lòng thử lại sau.');
          }
        } else {
          setError('Có lỗi xảy ra khi tải thông tin phòng. Vui lòng thử lại sau.');
        }
      } else {
        setError('Có lỗi xảy ra khi tải thông tin phòng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };
  
  const calculateTotalPrice = () => {
    if (!room || !checkInDate || !checkOutDate) return room?.giaTien || 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Calculate number of nights
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    
    return room.giaTien * nights;
  };
  
  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room) return;
    
    // Check if user is authenticated first
    if (!isAuthenticated()) {
      // Store booking details in localStorage for after login
      const bookingDetails = {
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guests
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
      
      // Redirect to login page with return URL
      const currentPath = window.location.pathname;
      redirectToLoginIfNotAuthenticated(currentPath);
      return;
    }
    
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
        maPhong: parseInt(room.id || '0'),
        tenKH: bookingForm.guestName,
        email: bookingForm.guestEmail,
        soDienThoai: bookingForm.guestPhone,
        ngayBatDau: checkInDate,
        ngayKetThuc: checkOutDate,
        soLuongKhach: guests,
        tongTien: totalPrice
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
        // Remove any pending booking data
        localStorage.removeItem('pendingBooking');
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
  
  // Check for pending booking data after login
  useEffect(() => {
    if (isAuthenticated() && room) {
      const pendingBookingStr = localStorage.getItem('pendingBooking');
      if (pendingBookingStr) {
        try {
          const pendingBooking = JSON.parse(pendingBookingStr);
          // Only apply if it's for the same room
          if (pendingBooking.roomId === room.id) {
            setCheckInDate(pendingBooking.checkInDate);
            setCheckOutDate(pendingBooking.checkOutDate);
            setGuests(pendingBooking.guests);
          }
        } catch (e) {
          console.error('Error parsing pending booking:', e);
        }
      }
    }
  }, [room]);
  
  const handleBooking = async (bookingData: any) => {
    setIsSubmitting(true);
    setBookingMessage('');
    setBookingError('');

    try {
      if (!room) {
        setBookingError('Không tìm thấy thông tin phòng');
        return;
      }

      if (!isDateRangeValid(bookingData.checkInDate, bookingData.checkOutDate)) {
        setBookingError('Ngày check-out phải sau ngày check-in ít nhất 1 ngày');
        return;
      }

      // Kiểm tra người dùng đã đăng nhập chưa
      const user = userStore.user;
      if (!user || !user.token) {
        // Lưu thông tin đặt phòng vào localStorage để xử lý sau khi đăng nhập
        setPendingBooking({
          roomId: room.id,
          ...bookingData
        });
        setRequireLogin(true);
        return;
      }

      // Thực hiện đặt phòng
      const response = await bookRoom({
        maPhong: parseInt(room.id || '0'),
        maKH: user.id ? user.id.toString() : '',
        tenKH: bookingData.guestName,
        email: bookingData.email,
        soDienThoai: bookingData.phoneNumber,
        ngayBatDau: format(new Date(bookingData.checkInDate), 'yyyy-MM-dd'),
        ngayKetThuc: format(new Date(bookingData.checkOutDate), 'yyyy-MM-dd'),
        soLuongKhach: bookingData.guestCount,
        tongTien: room.giaTien * Math.max(1, Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 3600 * 24)))
      });

      if (response.success) {
        setBookingMessage('Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.');
        // Làm sạch form
        setBookingForm({
          guestName: '',
          guestEmail: '',
          guestPhone: '',
        });
        setCheckInDate('');
        setCheckOutDate('');
        setGuests(1);
      } else {
        setBookingError(response.message || 'Đặt phòng thất bại. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error booking room:', err);
      if (err instanceof Error) {
        // Phân loại lỗi để hiển thị thông báo phù hợp
        if ((err as any).code === 'ECONNABORTED' || err.message.includes('timeout') || err.message.includes('Network Error')) {
          setBookingError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại sau.');
        } else if (err.message.includes('409') || err.message.includes('conflict')) {
          setBookingError('Phòng này đã được đặt trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác.');
        } else if (err.message.includes('401') || err.message.includes('403')) {
          setBookingError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đặt phòng.');
          userStore.logout();
          setTimeout(() => {
            setRequireLogin(true);
          }, 1500);
        } else {
          setBookingError('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại sau.');
        }
      } else {
        setBookingError('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Thêm hàm kiểm tra ngày
  const isDateRangeValid = (checkInDate: string, checkOutDate: string): boolean => {
    if (!checkInDate || !checkOutDate) return false;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Kiểm tra nếu ngày checkout sau ngày checkin ít nhất 1 ngày
    return checkOut.getTime() > checkIn.getTime() && 
           Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)) >= 1;
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
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.roomDetailContainer}>
            {/* Room gallery */}
            <div className={styles.roomGallery}>
              <div className={styles.mainImage}>
                <img src={room.images?.[activeImage] || room.hinhAnh} alt={room.tenPhong} />
              </div>
              <div className={styles.thumbnails}>
                {(room.images || [room.hinhAnh]).map((image, index) => (
                  <div 
                    key={index} 
                    className={`${styles.thumbnail} ${index === activeImage ? styles.active : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={image} alt={`${room.tenPhong} - hình ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Room information */}
            <div className={styles.roomInfo}>
              <h1 className={styles.roomName}>{room.tenPhong}</h1>
              <p className={styles.roomPrice}>{room.giaTien?.toLocaleString()} đ / đêm</p>
              
              <div className={styles.roomDescription}>
                <h2>Mô tả</h2>
                <p>{room.moTa}</p>
              </div>
              
              <div className={styles.roomFeatures}>
                <h2>Tiện nghi</h2>
                <ul className={styles.featureList}>
                  {(room.features || []).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className={styles.roomDetails}>
                <h2>Chi tiết</h2>
                <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                    <span className={styles.detailIcon}>👥</span>
                    <span className={styles.detailLabel}>Số khách:</span>
                    <span className={styles.detailValue}>{room.soLuongKhach} người</span>
                </div>
                  
                <div className={styles.detailItem}>
                    <span className={styles.detailIcon}>🛏️</span>
                    <span className={styles.detailLabel}>Giường:</span>
                    <span className={styles.detailValue}>
                      {(room.beds || []).map((bed, index) => (
                        <span key={index}>{bed.count} {bed.type}{index < (room.beds?.length || 0) - 1 ? ', ' : ''}</span>
                  ))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Booking form */}
            <div className={styles.bookingForm}>
              <h2>Đặt phòng</h2>
              
              {bookingSuccess ? (
                <div className={styles.bookingSuccess}>
                  <h3>Đặt phòng thành công!</h3>
                  <p>{bookingMessage}</p>
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
                    <label htmlFor="guests">Số lượng khách</label>
                    <select 
                      id="guests" 
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                    >
                      {Array.from({length: room.soLuongKhach}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} người</option>
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
      </div>
    </Layout>
  );
} 