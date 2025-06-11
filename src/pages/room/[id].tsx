import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from '../../styles/RoomDetail.module.css';
import { getRoomById, bookRoom, Room } from '../../services/roomService';
import { createCustomer } from '../../services/customerService';
import { format } from 'date-fns';
import { useUserStore } from '../../stores/userStore';
import { Modal, Button, Spin } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';
import DiscountInput from '../../components/client/DiscountInput';
import { Discount } from '../../services/discountService';

// Lazy load LoadingSpinner để giảm thời gian biên dịch
const LoadingSpinner = dynamic(() => import('../../components/LoadingSpinner'), {
  ssr: false,
  loading: () => <Spin size="large" />
});

// Helper function to format dates for input fields
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Room interface is imported from roomService now

// Booking form state interface
interface BookingFormState {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number | null;
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
    checkInDate: '',
    checkOutDate: '',
    totalPrice: 0,
  });

  const [bookingError, setBookingError] = useState('');

  const userStore = useUserStore();
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discount states
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    // Fetch room data when ID is available
    if (id) {
      fetchRoomData();
    }
  }, [id]);

  // Tự động điền thông tin người dùng đã đăng nhập
  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập chưa
    const user = userStore.user;
    if (user && user.token) {
      // Điền thông tin người dùng vào form
      setBookingForm(prev => ({
        ...prev,
        guestName: user.fullName || '',
        guestEmail: user.email || '',
        guestPhone: ''
      }));
    }
  }, [userStore.user]);

  const fetchRoomData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const roomId = Array.isArray(id) ? id[0] : id;
      const roomData = await getRoomById(roomId);

      if (roomData.success && roomData.data) {
        setRoom(roomData.data);
        // Set document title
        document.title = `${roomData.data.tenPhong} - Khách sạn Nhóm 5`;

        // If there's a warning message (like data from cache), show it
        const responseWithMessage = roomData as { message?: string };
        if (responseWithMessage.message && responseWithMessage.message.includes('bộ nhớ đệm')) {
          setError(responseWithMessage.message);
        }

        // Thiết lập thời gian nhận/trả phòng mặc định
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Thiết lập giá trị mặc định
        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);

        setBookingForm(prev => ({
          ...prev,
          checkInDate: formatDateForInput(tomorrow),
          checkOutDate: formatDateForInput(nextDay),
          totalPrice: calculateTotalPrice()
        }));
      } else {
        setError(roomData.message || 'Không tìm thấy thông tin phòng');
      }
    } catch (err) {
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
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = useCallback(() => {
    // Sử dụng giá mặc định nếu không có giá
    const roomPrice = room?.giaTien || 500000;

    if (!room || !checkInDate || !checkOutDate) return roomPrice;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Calculate number of nights
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));

    return roomPrice * nights;
  }, [room, checkInDate, checkOutDate]);

  // Calculate final price after discount
  const calculateFinalPrice = useCallback(() => {
    const originalPrice = calculateTotalPrice();
    return originalPrice - discountAmount;
  }, [calculateTotalPrice, discountAmount]);

  // Handle discount application
  const handleDiscountApplied = (discount: Discount | null, amount: number) => {
    setAppliedDiscount(discount);
    setDiscountAmount(amount);
  };

  // State cho modal thông báo đặt phòng thành công
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Xử lý đặt phòng
  const processBooking = async (bookingData: any) => {
    setIsSubmitting(true);
    setBookingMessage('');
    setBookingError('');

    try {
      if (!room) {
        setBookingError('Không tìm thấy thông tin phòng');
        setIsSubmitting(false);
        return;
      }

      if (!isDateRangeValid(bookingData.checkInDate, bookingData.checkOutDate)) {
        setBookingError('Ngày check-out phải sau ngày check-in ít nhất 1 ngày');
        setIsSubmitting(false);
        return;
      }

      // Lấy thông tin người dùng nếu đã đăng nhập
      const user = userStore.user;

      // Không cần tính tổng tiền cho API mới

      // Tạo khách hàng mới cho mọi đơn đặt phòng
      let customerId = user?.id;

      // Nếu không có ID khách hàng (chưa đăng nhập hoặc đăng nhập nhưng không có ID)
      if (!customerId) {
        console.log('🔍 [ProcessBooking] Creating new customer for guest booking');

        // Tạo khách hàng mới
        const customerResponse = await createCustomer({
          tenKH: bookingData.guestName || (user?.fullName || 'Khách hàng'),
          email: bookingData.email || (user?.email || 'guest@example.com'),
          phone: bookingData.phoneNumber || '',
          maVaiTro: 3 // Khách hàng
        });

        console.log('🔍 [ProcessBooking] Customer creation response:', customerResponse);

        if (!customerResponse.success) {
          console.error('❌ [ProcessBooking] Failed to create customer:', customerResponse.message);
          setBookingError(customerResponse.message || 'Không thể tạo thông tin khách hàng. Vui lòng thử lại sau.');
          setIsSubmitting(false);
          return;
        }

        // Lấy ID khách hàng từ response - thử nhiều cấu trúc khác nhau
        customerId = customerResponse.data?.maKH ||
                    customerResponse.data?.data?.maKH ||
                    customerResponse.data?.id;

        console.log('🔍 [ProcessBooking] Extracted customer ID:', customerId);

        if (!customerId) {
          console.error('❌ [ProcessBooking] Could not extract customer ID from response');
          console.log('🔄 [ProcessBooking] Using fallback customer ID for guest booking');
          // Fallback: sử dụng ID mặc định cho guest booking
          customerId = 1; // Hoặc ID khách hàng mặc định trong hệ thống
        }
      }

      // Lấy mã phòng từ dữ liệu phòng hoặc từ API
      let roomId = 0;

      try {
        // Đầu tiên, thử lấy mã phòng từ dữ liệu phòng hiện tại
        if (room.maPhong) {
          roomId = typeof room.maPhong === 'string' ? parseInt(room.maPhong) : room.maPhong;
        } else if (room.id) {
          roomId = parseInt(room.id);
        }

        // Nếu không có mã phòng hợp lệ, thử lấy từ API
        if (isNaN(roomId) || roomId === 0) {
          try {
            const roomIdResponse = await fetch(`/api/room-id?roomId=${room.id || room.maPhong}`);
            const roomIdData = await roomIdResponse.json();

            if (roomIdResponse.ok && roomIdData.success && roomIdData.data?.maPhong) {
              roomId = roomIdData.data.maPhong;
            } else {
              // Sử dụng ID dự phòng nếu không thể lấy từ API
              roomId = parseInt(room.id || '3');
            }
          } catch (apiError) {
            // Sử dụng ID dự phòng nếu không thể lấy từ API
            roomId = parseInt(room.id || '3');
          }
        }

        // Kiểm tra mã phòng hợp lệ
        if (isNaN(roomId) || roomId === 0) {
          throw new Error('Mã phòng không hợp lệ sau khi thử tất cả các cách');
        }
        // Chuẩn bị dữ liệu đặt phòng theo đúng cấu trúc API yêu cầu
        const bookingRequestData = {
          maKH: customerId ? parseInt(customerId.toString()) : 0,
          maPhong: roomId,
          ngayDat: new Date().toISOString(),
          ngayBD: format(new Date(bookingData.checkInDate), 'yyyy-MM-dd'), // Sử dụng ngayBD thay vì checkIn
          ngayKT: format(new Date(bookingData.checkOutDate), 'yyyy-MM-dd'), // Sử dụng ngayKT thay vì checkOut
          trangThai: 1, // Đang xử lý
          xoa: false,
          // Thêm thông tin khách hàng để API handler có thể tạo khách hàng nếu cần
          tenKH: bookingData.guestName || '',
          email: bookingData.email || '',
          soDienThoai: bookingData.phoneNumber || ''
        };
        // Thực hiện đặt phòng
        const response = await bookRoom(bookingRequestData);

        if (response.success) {
          // Lấy thông tin phòng từ response nếu có
          // Xử lý nhiều cấu trúc dữ liệu phản hồi khác nhau
          let bookingId = 'N/A';
          if (response.data?.maHD) {
            bookingId = response.data.maHD;
          } else if (response.data?.data?.maHD) {
            bookingId = response.data.data.maHD;
          } else if (response.data?.id) {
            bookingId = response.data.id;
          }

          const roomNumber = room.soPhong || room.id || 'N/A';

          // Thiết lập thông báo thành công với thông tin phòng
          setBookingMessage(`Đặt phòng thành công! Mã đặt phòng: ${bookingId}, Phòng: ${roomNumber}. Nhân viên sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đặt phòng.`);

          // Hiển thị modal thông báo thành công thay vì nội dung trong trang
          setIsSuccessModalVisible(true);

          // Làm sạch form
          setBookingForm({
            guestName: '',
            guestEmail: '',
            guestPhone: '',
            checkInDate: '',
            checkOutDate: '',
            totalPrice: null,
          });
          setCheckInDate('');
          setCheckOutDate('');
          setGuests(1);
        } else {
          setBookingError(response.message || 'Đặt phòng thất bại. Vui lòng thử lại sau.');
        }
      } catch (error) {
        setBookingError('Không thể xác định mã phòng hoặc đặt phòng. Vui lòng thử lại sau.');
      }
    } catch (err) {
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
            router.push('/login');
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
    return <LoadingSpinner />;
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


          {/* Booking Success Modal */}
          <Modal
            title="Đặt phòng thành công"
            open={isSuccessModalVisible}
            onCancel={() => setIsSuccessModalVisible(false)}
            footer={[
              <Button
                key="ok"
                type="primary"
                onClick={() => setIsSuccessModalVisible(false)}
              >
                Đóng
              </Button>
            ]}
          >
            <div className={styles.successModal}>
              <div className={styles.successIcon}>
                <CheckOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
              </div>
              <h3>Đặt phòng thành công!</h3>
              <p>{bookingMessage}</p>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            </div>
          </Modal>

          <div className={styles.roomDetailContainer}>
            {/* Room gallery */}
            <div className={styles.roomGallery}>
              <div className={styles.mainImage}>
                <img
                  src={room.images?.[activeImage] || room.hinhAnh || '/images/rooms/default-room.jpg'}
                  alt={room.tenPhong}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/rooms/default-room.jpg';
                  }}
                />
              </div>
              <div className={styles.thumbnails}>
                {(room.images?.length ? room.images : ['/images/rooms/default-room.jpg']).map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${index === activeImage ? styles.active : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img
                      src={image || '/images/rooms/default-room.jpg'}
                      alt={`${room.tenPhong} - hình ${index + 1}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/rooms/default-room.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Room information */}
            <div className={styles.roomInfo}>
              <h1 className={styles.roomName}>{room.tenPhong}</h1>
              <p className={styles.roomPrice}>
                {`${(room.giaTien || 500000).toLocaleString('vi-VN')} đ / đêm`}
              </p>

              <div className={styles.roomDescription}>
                <h2>Mô tả</h2>
                <p>{room.moTa || 'Đang tải mô tả...'}</p>
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

              <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = {
                    guestName: bookingForm.guestName,
                    email: bookingForm.guestEmail,
                    phoneNumber: bookingForm.guestPhone,
                    checkInDate: checkInDate,
                    checkOutDate: checkOutDate,
                    guestCount: guests
                  };
                  // Bỏ qua modal xác nhận và đặt phòng trực tiếp
                  await processBooking(formData);
                }}>
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

                  {/* Discount Input Component */}
                  <DiscountInput
                    originalPrice={calculateTotalPrice() || (room.giaTien || 500000)}
                    onDiscountApplied={handleDiscountApplied}
                    disabled={isSubmitting}
                  />

                  <div className={styles.totalPrice}>
                    <span>Tổng tiền</span>
                    <span className={styles.price}>
                      {appliedDiscount ? (
                        <>
                          <span className={styles.originalPrice}>
                            {calculateTotalPrice().toLocaleString('vi-VN')}đ
                          </span>
                          <span className={styles.finalPrice}>
                            {calculateFinalPrice().toLocaleString('vi-VN')}đ
                          </span>
                        </>
                      ) : (
                        `${(calculateTotalPrice() || (room.giaTien || 500000)).toLocaleString('vi-VN')}đ`
                      )}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className={styles.bookButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đặt ngay'}
                  </button>
                </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}