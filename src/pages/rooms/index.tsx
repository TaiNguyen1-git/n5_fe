import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Rooms.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../../services/roomService';
import Layout from '../../components/Layout';

export default function Rooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceRange, setPriceRange] = useState({
    min: '1000000',
    max: '10000000'
  });
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Simulating room data for the UI demonstration
      setRooms([
        {
          id: '101',
          name: 'Phòng 101',
          price: 100000,
          imageUrl: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng'],
          images: ['https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          maxGuests: 2,
          beds: [{ type: 'Giường đôi', count: 1 }]
        },
        {
          id: '102',
          name: 'Phòng 102',
          price: 150000,
          imageUrl: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          description: 'Phòng cao cấp với view đẹp',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar'],
          images: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          maxGuests: 2,
          beds: [{ type: 'Giường đôi', count: 1 }]
        },
      ]);
      setLoading(false);
    } catch (err) {
      setError('An error occurred while fetching rooms');
      console.error(err);
      setLoading(false);
    }
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleApplyFilter = () => {
    // Implement filter logic here
    console.log('Applying filters:', { priceRange, selectedOption });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.roomsContainer}>
          <div className={styles.filterSection}>
            <h2>Sắp xếp kết quả</h2>
            <div className={styles.sortOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="highest"
                  checked={selectedOption === 'highest'}
                  onChange={() => setSelectedOption('highest')}
                />
                <span>Giá cao nhất</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="lowest"
                  checked={selectedOption === 'lowest'}
                  onChange={() => setSelectedOption('lowest')}
                />
                <span>Giá thấp nhất</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="mostBooked"
                  checked={selectedOption === 'mostBooked'}
                  onChange={() => setSelectedOption('mostBooked')}
                />
                <span>Phổ biến nhất</span>
              </label>
            </div>

            <div className={styles.priceFilter}>
              <h3>Khoảng giá</h3>
              <div className={styles.priceInputs}>
                <div className={styles.priceInput}>
                  <label>Tối thiểu</label>
                  <input
                    type="text"
                    value={priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                    min="0"
                    placeholder="1000000"
                  />
                </div>
                <span className={styles.priceSeparator}>—</span>
                <div className={styles.priceInput}>
                  <label>Tối đa</label>
                  <input
                    type="text"
                    value={priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                    min="0"
                    placeholder="10000000"
                  />
                </div>
              </div>
              <button className={styles.applyButton} onClick={handleApplyFilter}>
                Áp dụng
              </button>
            </div>
          </div>

          <div className={styles.roomsList}>
            <h1>Kết quả tìm kiếm</h1>
            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : (
              <div className={styles.roomsGrid}>
                {rooms.map((room) => (
                  <div key={room.id} className={styles.roomCard}>
                    <div className={styles.roomImage}>
                      <img src={room.imageUrl} alt={room.name} />
                    </div>
                    <div className={styles.roomInfo}>
                      <h3>{room.name}</h3>
                      <div className={styles.roomDetails}>
                        <div className={styles.occupancy}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M20 21C20 18.87 18.33 17.1 16 16.29C14.83 15.82 13.45 15.58 12 15.58C10.55 15.58 9.17 15.82 8 16.29C5.67 17.1 4 18.87 4 21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{room.capacity} người</span>
                        </div>
                        <div className={styles.price}>
                          {formatPrice(room.price)}
                        </div>
                      </div>
                      <button 
                        className={styles.bookButton}
                        onClick={() => router.push(`/room/${room.id}`)}
                      >
                        Đặt phòng
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}