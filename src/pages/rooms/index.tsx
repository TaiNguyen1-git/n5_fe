import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Rooms.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../../services/roomService';
import { FaUser } from 'react-icons/fa';
import { Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

export default function Rooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceRange, setPriceRange] = useState({
    min: '1000000',
    max: '10000000'
  });
  const [sortOption, setSortOption] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getRooms();
      if (response.success && response.data) {
        setRooms(response.data);
      } else {
        setError('Failed to load rooms');
      }
    } catch (err) {
      setError('An error occurred while fetching rooms');
      console.error(err);
    } finally {
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
    console.log('Applying filters:', { priceRange, sortOption });
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => router.push('/profile')}>
        Hồ sơ cá nhân
      </Menu.Item>
      <Menu.Item key="logout" onClick={() => {
        // Add logout logic here
        router.push('/login');
      }}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <span>NHÓM 5</span>
          </Link>
          <div className={styles.userSection}>
            <Dropdown 
              overlay={userMenu} 
              trigger={['click']}
              onOpenChange={setIsUserMenuOpen}
            >
              <div className={styles.userProfile}>
                <span className={styles.userInitial}>N</span>
                <span className={styles.userName}>Nguyễn Trung Tài</span>
                <DownOutlined style={{ fontSize: '12px', color: '#666' }} />
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      <div className={styles.roomsContainer}>
        <div className={styles.filterSection}>
          <h2>Sắp xếp kết quả</h2>
          <div className={styles.sortOptions}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value="highest"
                checked={sortOption === 'highest'}
                onChange={(e) => setSortOption(e.target.value)}
              />
              <span>Giá cao nhất</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value="lowest"
                checked={sortOption === 'lowest'}
                onChange={(e) => setSortOption(e.target.value)}
              />
              <span>Giá thấp nhất</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value="mostBooked"
                checked={sortOption === 'mostBooked'}
                onChange={(e) => setSortOption(e.target.value)}
              />
              <span>Thuê nhiều nhất</span>
            </label>
          </div>

          <div className={styles.priceFilter}>
            <h2>Bộ lọc tìm kiếm</h2>
            <h3>Khoảng giá</h3>
            <div className={styles.priceInputs}>
              <div className={styles.priceInput}>
                <label>Tối thiểu</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  min="0"
                />
              </div>
              <span className={styles.priceSeparator}>—</span>
              <div className={styles.priceInput}>
                <label>Tối đa</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  min="0"
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M20 21C20 18.87 18.33 17.1 16 16.29C14.83 15.82 13.45 15.58 12 15.58C10.55 15.58 9.17 15.82 8 16.29C5.67 17.1 4 18.87 4 21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>2 người</span>
                      </div>
                      <div className={styles.price}>
                        {room.price.toLocaleString()} đ
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
  );
}