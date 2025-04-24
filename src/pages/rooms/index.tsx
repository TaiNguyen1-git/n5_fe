import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Rooms.module.css';
import Link from 'next/link';
import { getRooms, Room } from '../../services/roomService';
import Layout from '../../components/Layout';
import { Slider, Rate, Checkbox, Select, Tag, Tooltip, Pagination, Input, DatePicker, Button, Spin, Empty, Badge } from 'antd';
import { SearchOutlined, FilterOutlined, WifiOutlined, CoffeeOutlined, CarOutlined, HeartOutlined, HeartFilled, 
  EnvironmentOutlined, InfoCircleOutlined, StarFilled, ThunderboltOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Extended Room type with additional properties
interface ExtendedRoom {
  id?: string;
  maPhong?: number;
  tenPhong: string;
  moTa: string;
  hinhAnh: string;
  giaTien: number;
  soLuongKhach: number;
  trangThai: number;
  loaiPhong?: string;
  images?: string[];
  features?: string[];
  beds?: {
    type: string;
    count: number;
  }[];
  // Additional properties for the UI
  rating?: number;
  reviewCount?: number;
  discount?: number;
  amenities?: string[];
  distanceFromCenter?: number;
  isFavorite?: boolean;
  tags?: string[];
  capacity?: number;
  imageUrl?: string;
}

export default function Rooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [displayRooms, setDisplayRooms] = useState<ExtendedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([100000, 10000000]);
  const [sortOption, setSortOption] = useState<string>('recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const pageSize = 5;

  // List of amenities for filtering
  const amenitiesList = [
    { label: 'Wi-Fi miễn phí', value: 'wifi' },
    { label: 'Điều hòa', value: 'ac' },
    { label: 'TV', value: 'tv' },
    { label: 'Minibar', value: 'minibar' },
    { label: 'Bữa sáng', value: 'breakfast' },
    { label: 'Bãi đỗ xe', value: 'parking' },
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [priceRange, sortOption, searchTerm, amenitiesFilter, ratingFilter, rooms]);

  const fetchRooms = async () => {
    try {
      // Simulating room data for the UI demonstration with extended properties
      const mockRooms: ExtendedRoom[] = [
        {
          id: '101',
          tenPhong: 'Phòng Deluxe Hướng Biển',
          giaTien: 1200000,
          imageUrl: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          hinhAnh: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          soLuongKhach: 2,
          trangThai: 1,
          moTa: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản và view biển tuyệt đẹp',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar'],
          images: ['https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          rating: 4.7,
          reviewCount: 124,
          discount: 15,
          amenities: ['wifi', 'ac', 'tv', 'minibar'],
          distanceFromCenter: 0.5,
          isFavorite: false,
          tags: ['Hot deal', 'Phòng đẹp'],
          beds: [{ type: 'Giường đôi', count: 1 }]
        },
        {
          id: '102',
          tenPhong: 'Phòng Suite Gia Đình',
          giaTien: 2500000,
          imageUrl: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          hinhAnh: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 4,
          soLuongKhach: 4,
          trangThai: 1,
          moTa: 'Phòng suite rộng rãi dành cho gia đình với không gian riêng biệt',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Bồn tắm'],
          images: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          rating: 4.9,
          reviewCount: 87,
          amenities: ['wifi', 'ac', 'tv', 'minibar', 'breakfast'],
          distanceFromCenter: 0.5,
          isFavorite: true,
          tags: ['Phòng gia đình'],
          beds: [{ type: 'Giường đôi', count: 1 }, { type: 'Giường đơn', count: 2 }]
        },
        {
          id: '103',
          tenPhong: 'Phòng Standard Twin',
          giaTien: 800000,
          imageUrl: 'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          hinhAnh: 'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          soLuongKhach: 2,
          trangThai: 1,
          moTa: 'Phòng tiêu chuẩn với hai giường đơn, phù hợp cho bạn bè hoặc đồng nghiệp',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng'],
          images: ['https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          rating: 4.5,
          reviewCount: 56,
          discount: 10,
          amenities: ['wifi', 'ac', 'tv', 'parking'],
          distanceFromCenter: 0.7,
          isFavorite: false,
          tags: ['Tiết kiệm'],
          beds: [{ type: 'Giường đơn', count: 2 }]
        },
        {
          id: '104',
          tenPhong: 'Phòng Executive Suite',
          giaTien: 3500000,
          imageUrl: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          hinhAnh: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          soLuongKhach: 2,
          trangThai: 1,
          moTa: 'Phòng hạng sang với không gian làm việc riêng và dịch vụ đặc biệt',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Phòng làm việc'],
          images: ['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          rating: 4.8,
          reviewCount: 42,
          amenities: ['wifi', 'ac', 'tv', 'minibar', 'breakfast', 'parking'],
          distanceFromCenter: 0.3,
          isFavorite: false,
          tags: ['Sang trọng', 'Doanh nhân'],
          beds: [{ type: 'Giường King', count: 1 }]
        },
        {
          id: '105',
          tenPhong: 'Phòng Superior Đôi',
          giaTien: 1500000,
          imageUrl: 'https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          hinhAnh: 'https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          capacity: 2,
          soLuongKhach: 2,
          trangThai: 1,
          moTa: 'Phòng superior với không gian rộng rãi và view thành phố',
          features: ['Wi-Fi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar'],
          images: ['https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
          rating: 4.6,
          reviewCount: 78,
          amenities: ['wifi', 'ac', 'tv', 'minibar', 'breakfast'],
          distanceFromCenter: 0.6,
          isFavorite: false,
          tags: ['View đẹp'],
          beds: [{ type: 'Giường đôi', count: 1 }]
        },
      ];
      
      setRooms(mockRooms);
      setDisplayRooms(mockRooms);
      setLoading(false);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu phòng');
      console.error(err);
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let result = [...rooms];
    
    // Filter by price range
    result = result.filter(room => 
      room.giaTien >= priceRange[0] && room.giaTien <= priceRange[1]
    );
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(room => 
        room.tenPhong.toLowerCase().includes(term) || 
        room.moTa.toLowerCase().includes(term)
      );
    }
    
    // Filter by amenities
    if (amenitiesFilter.length > 0) {
      result = result.filter(room => 
        amenitiesFilter.every(amenity => 
          room.amenities?.includes(amenity.toString())
        )
      );
    }
    
    // Filter by rating
    if (ratingFilter > 0) {
      result = result.filter(room => 
        (room.rating || 0) >= ratingFilter
      );
    }
    
    // Sort rooms
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.giaTien - b.giaTien);
        break;
      case 'price-desc':
        result.sort((a, b) => b.giaTien - a.giaTien);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'recommended':
      default:
        // Sort by a combination of rating and price
        result.sort((a, b) => (b.rating || 0) * 0.7 - (a.rating || 0) * 0.7 + 
                              (a.giaTien - b.giaTien) * 0.0001);
        break;
    }
    
    setDisplayRooms(result);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (value: number | number[]) => {
    setPriceRange(value as [number, number]);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAmenitiesChange = (checkedValues: string[]) => {
    setAmenitiesFilter(checkedValues);
  };

  const handleRatingChange = (value: number) => {
    setRatingFilter(value);
  };

  const toggleFavorite = (roomId: string) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === roomId 
          ? { ...room, isFavorite: !room.isFavorite } 
          : room
      )
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const getDiscountedPrice = (room: ExtendedRoom) => {
    if (!room.discount) return room.giaTien;
    return room.giaTien * (1 - room.discount / 100);
  };

  // Calculate pagination
  const paginatedRooms = displayRooms.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Filtered rooms based on search term (memoized to improve performance)
  const filteredSearchRooms = useMemo(() => {
    if (!searchTerm) {
      return rooms;
    }
    
    const term = searchTerm.toLowerCase();
    return rooms.filter(room => 
      room.tenPhong.toLowerCase().includes(term) ||
      room.moTa.toLowerCase().includes(term)
    );
  }, [rooms, searchTerm]);

  return (
    <Layout>
      <div className={styles.container}>
        {/* Search bar section */}
        <div className={styles.searchBarSection}>
          <div className={styles.searchBarContainer}>
            <div className={styles.searchInputGroup}>
              <Input 
                placeholder="Tìm kiếm phòng..." 
                prefix={<SearchOutlined />} 
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              <RangePicker 
                placeholder={['Ngày nhận phòng', 'Ngày trả phòng']}
                className={styles.datePicker}
              />
              <Select 
                defaultValue="2" 
                className={styles.guestSelect}
              >
                <Option value="1">1 khách</Option>
                <Option value="2">2 khách</Option>
                <Option value="3">3 khách</Option>
                <Option value="4">4 khách</Option>
                <Option value="5">5+ khách</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} className={styles.searchButton}>
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.roomsContainer}>
          {/* Filter section */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h2><FilterOutlined /> Bộ lọc tìm kiếm</h2>
            </div>

            <div className={styles.filterGroup}>
              <h3>Sắp xếp kết quả</h3>
              <Select
                value={sortOption}
                onChange={handleSortChange}
                className={styles.sortSelect}
                style={{ width: '100%' }}
              >
                <Option value="recommended">Đề xuất</Option>
                <Option value="price-asc">Giá thấp đến cao</Option>
                <Option value="price-desc">Giá cao đến thấp</Option>
                <Option value="rating">Đánh giá cao nhất</Option>
                <Option value="discount">Khuyến mãi tốt nhất</Option>
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <h3>Khoảng giá (VNĐ)</h3>
              <Slider
                range
                min={100000}
                max={5000000}
                step={100000}
                value={priceRange}
                onChange={handlePriceRangeChange}
                tipFormatter={value => value?.toLocaleString('vi-VN')}
              />
              <div className={styles.priceRangeLabels}>
                <span>{priceRange[0].toLocaleString('vi-VN')}đ</span>
                <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>Tiện nghi</h3>
              <Checkbox.Group 
                options={amenitiesList} 
                value={amenitiesFilter}
                onChange={handleAmenitiesChange}
                className={styles.amenitiesCheckboxes}
              />
            </div>

            <div className={styles.filterGroup}>
              <h3>Đánh giá tối thiểu</h3>
              <div className={styles.ratingFilter}>
                <Rate 
                  allowHalf 
                  value={ratingFilter} 
                  onChange={handleRatingChange} 
                />
                <span className={styles.ratingText}>
                  {ratingFilter > 0 ? `${ratingFilter} sao trở lên` : 'Tất cả đánh giá'}
                </span>
              </div>
            </div>

            <Button 
              type="primary" 
              className={styles.applyButton}
              onClick={filterRooms}
            >
              Áp dụng
            </Button>
            
            <Button 
              type="default" 
              className={styles.resetButton}
              onClick={() => {
                setPriceRange([100000, 10000000]);
                setSortOption('recommended');
                setSearchTerm('');
                setAmenitiesFilter([]);
                setRatingFilter(0);
              }}
            >
              Đặt lại
            </Button>
          </div>

          {/* Room list section */}
          <div className={styles.roomsList}>
            <div className={styles.resultsHeader}>
              <h1>Kết quả tìm kiếm</h1>
              <div className={styles.resultsActions}>
                <span className={styles.resultCount}>
                  {displayRooms.length} phòng được tìm thấy
                </span>
                <div className={styles.viewToggle}>
                  <Button.Group>
                    <Button 
                      type={viewMode === 'list' ? 'primary' : 'default'}
                      onClick={() => setViewMode('list')}
                    >
                      Danh sách
                    </Button>
                    <Button 
                      type={viewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setViewMode('grid')}
                    >
                      Lưới
                    </Button>
                  </Button.Group>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <Spin size="large" />
                <p>Đang tải danh sách phòng...</p>
              </div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : displayRooms.length === 0 ? (
              <Empty 
                description="Không tìm thấy phòng nào phù hợp với tiêu chí tìm kiếm" 
                className={styles.emptyResults}
              />
            ) : (
              <div className={viewMode === 'grid' ? styles.roomsGrid : styles.roomsList}>
                {paginatedRooms.map((room) => (
                  <div key={room.id} className={viewMode === 'grid' ? styles.roomCardGrid : styles.roomCard}>
                    <div className={styles.roomImage}>
                      {room.discount && (
                        <div className={styles.discountBadge}>
                          <ThunderboltOutlined /> {room.discount}% GIẢM
                        </div>
                      )}
                      <img src={room.imageUrl || room.hinhAnh} alt={room.tenPhong} />
                      <button 
                        className={styles.favoriteButton}
                        onClick={() => room.id && toggleFavorite(room.id)}
                        aria-label={room.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                      >
                        {room.isFavorite ? <HeartFilled /> : <HeartOutlined />}
                      </button>
                    </div>
                    <div className={styles.roomInfo}>
                      <div className={styles.roomHeader}>
                        <h3>{room.tenPhong}</h3>
                        <div className={styles.roomRating}>
                          <Rate disabled defaultValue={room.rating} allowHalf />
                          <span className={styles.reviewCount}>({room.reviewCount} đánh giá)</span>
                        </div>
                      </div>
                      
                      <div className={styles.roomLocation}>
                        <EnvironmentOutlined /> <span>Cách trung tâm {room.distanceFromCenter} km</span>
                      </div>
                      
                      <div className={styles.roomTags}>
                        {room.tags?.map((tag, index) => (
                          <Tag key={index} color="blue">{tag}</Tag>
                        ))}
                      </div>
                      
                      <p className={styles.roomDescription}>
                        {room.moTa}
                      </p>
                      
                      <div className={styles.roomAmenities}>
                        {room.amenities?.includes('wifi') && (
                          <Tooltip title="Wi-Fi miễn phí">
                            <span className={styles.amenity}><WifiOutlined /></span>
                          </Tooltip>
                        )}
                        {room.amenities?.includes('breakfast') && (
                          <Tooltip title="Bữa sáng miễn phí">
                            <span className={styles.amenity}><CoffeeOutlined /></span>
                          </Tooltip>
                        )}
                        {room.amenities?.includes('parking') && (
                          <Tooltip title="Bãi đỗ xe">
                            <span className={styles.amenity}><CarOutlined /></span>
                          </Tooltip>
                        )}
                        <Tooltip title="Xem tất cả tiện nghi">
                          <span className={styles.amenity}><InfoCircleOutlined /></span>
                        </Tooltip>
                      </div>
                      
                      <div className={styles.roomDetails}>
                        <div className={styles.occupancy}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M20 21C20 18.87 18.33 17.1 16 16.29C14.83 15.82 13.45 15.58 12 15.58C10.55 15.58 9.17 15.82 8 16.29C5.67 17.1 4 18.87 4 21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{room.capacity || room.soLuongKhach} người</span>
                        </div>
                        <div className={styles.priceContainer}>
                          {room.discount ? (
                            <>
                              <div className={styles.originalPrice}>
                                {formatPrice(room.giaTien)}
                              </div>
                              <div className={styles.price}>
                                {formatPrice(getDiscountedPrice(room))}
                              </div>
                            </>
                          ) : (
                            <div className={styles.price}>
                              {formatPrice(room.giaTien)}
                            </div>
                          )}
                          <span className={styles.pricePerNight}>/ đêm</span>
                        </div>
                      </div>
                      
                      <div className={styles.roomActions}>
                        <Button 
                          type="default"
                          onClick={() => router.push(`/room/${room.id}`)}
                          className={styles.detailsButton}
                        >
                          Chi tiết
                        </Button>
                        <Button 
                          type="primary"
                          onClick={() => router.push(`/bookings/create?roomId=${room.id}`)}
                          className={styles.bookButton}
                        >
                          Đặt ngay
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {displayRooms.length > pageSize && (
              <div className={styles.pagination}>
                <Pagination
                  current={currentPage}
                  total={displayRooms.length}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}