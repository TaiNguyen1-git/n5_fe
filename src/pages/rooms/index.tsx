import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/RoomsList.module.css';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Card,
  Row,
  Col,
  Select,
  Slider,
  Button,
  Input,
  Pagination,
  Spin,
  Empty,
  Tag,
  message
} from 'antd';
import { SearchOutlined, HomeOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

// Định nghĩa kiểu dữ liệu cho phòng
interface Room {
  maPhong: number;
  soPhong: string;
  soNguoi: number;
  hinhAnh?: string;
  moTa?: string;
  trangThai: number;
  loaiPhong?: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
  };
  trangThaiPhong?: {
    maTT: number;
    tenTT: string;
  };
  // Các trường bổ sung cho UI
  id?: number;
  tenPhong?: string;
  giaTien?: number;
  loaiPhongText?: string;
  trangThaiText?: string;
  features?: string[];
}

const RoomsPage = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 9;

  // Các state cho bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [roomType, setRoomType] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<number | null>(null);
  const [allRoomTypes, setAllRoomTypes] = useState<string[]>([]);

  // Fetch room types from API
  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('/api/LoaiPhong/GetAll');

      if (response.ok) {
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const types = result.data.map((type: any) => type.tenLoai).filter(Boolean);
          setAllRoomTypes(types);
        } else {
          setAllRoomTypes(['Single', 'Double', 'Triple', 'Vip', 'Deluxe']);
        }
      } else {
        setAllRoomTypes(['Single', 'Double', 'Triple', 'Vip', 'Deluxe']);
      }
    } catch (error) {
      // Fallback to default types if API fails
      setAllRoomTypes(['Single', 'Double', 'Triple', 'Vip', 'Deluxe']);
    }
  };

  // Lấy danh sách phòng từ API với pagination
  const fetchRooms = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString()
      });

      // Add filter parameters
      if (guestCount) {
        params.append('soLuongKhach', guestCount.toString());
      }

      if (priceRange[0] > 0) {
        params.append('giaMin', priceRange[0].toString());
      }

      if (priceRange[1] < 2000000) {
        params.append('giaMax', priceRange[1].toString());
      }

      params.append('_t', Date.now().toString());
      const response = await fetch(`/api/rooms?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const { items, totalItems, totalPages, pageNumber } = result.data;

        // Convert API data to Room interface format
        const normalizedRooms = items.map((room: any) => ({
          maPhong: room.maPhong || room.id || 0,
          id: room.maPhong || room.id || 0,
          soPhong: room.soPhong || `Phòng ${room.maPhong || ''}`,
          tenPhong: room.tenPhong || `Phòng ${room.soPhong || room.maPhong || ''}`,
          soNguoi: room.soLuongKhach || room.soNguoi || 2,
          hinhAnh: room.hinhAnh || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
          moTa: room.moTa || 'Thông tin phòng đang được cập nhật',
          trangThai: room.trangThai || 1,
          trangThaiText: room.trangThaiTen || getTrangThaiText(room.trangThai || 1),
          giaTien: room.giaTien || 500000,
          loaiPhongText: room.loaiPhong || 'Standard',
          features: room.features || ['WiFi', 'TV', 'Điều hòa', 'Minibar']
        }));

        // Filter by search term, room type, and room status on frontend (since API doesn't support these filters)
        let filteredRooms = normalizedRooms;

        if (searchTerm) {
          filteredRooms = filteredRooms.filter((room: Room) =>
            room.tenPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.soPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (roomType) {
          filteredRooms = filteredRooms.filter((room: Room) => room.loaiPhongText === roomType);
        }

        if (roomStatus !== null) {
          filteredRooms = filteredRooms.filter((room: Room) => room.trangThai === roomStatus);
        }

        setRooms(filteredRooms);
        setTotalItems(totalItems || filteredRooms.length);
        setTotalPages(totalPages || Math.ceil((totalItems || filteredRooms.length) / pageSize));
        setCurrentPage(pageNumber || page);

        // Collect unique room types for filter
        const uniqueTypes = Array.from(new Set(normalizedRooms.map((room: Room) => room.loaiPhongText).filter(Boolean)));

        // Don't override room types from API with room data
        // Room types should come from the dedicated API endpoint
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      setError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');

      // Sử dụng dữ liệu mẫu khi có lỗi
      const mockRooms = generateMockRooms();
      setRooms(mockRooms);
      setTotalItems(mockRooms.length);
      setTotalPages(Math.ceil(mockRooms.length / pageSize));

      // Set room types from mock data
      const mockTypes = Array.from(new Set(mockRooms.map(room => room.loaiPhongText)));
      setAllRoomTypes(mockTypes);

      message.warning('Không thể kết nối đến máy chủ. Hiển thị dữ liệu mẫu.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch room types when component mounts
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // Fetch rooms when component mounts or filters change
  useEffect(() => {
    fetchRooms(1);
  }, [guestCount, priceRange]);

  // Handle search, room type, and room status filter changes (client-side filtering)
  useEffect(() => {
    fetchRooms(currentPage);
  }, [searchTerm, roomType, roomStatus]);



  // Hàm tạo dữ liệu mẫu khi không có API
  const generateMockRooms = (): Room[] => {
    const roomTypes = ['Single', 'Double', 'Triple', 'Vip', 'Deluxe'];
    const mockRooms: Room[] = [];

    for (let i = 1; i <= 12; i++) {
      const roomTypeIndex = (i % 5);
      const roomType = roomTypes[roomTypeIndex];
      const price = (roomTypeIndex + 1) * 500000;

      mockRooms.push({
        maPhong: i,
        id: i,
        soPhong: `${100 + i}`,
        tenPhong: `Phòng ${100 + i}`,
        soNguoi: roomTypeIndex === 4 ? 4 : roomTypeIndex === 3 ? 3 : 2,
        hinhAnh: `https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop`,
        moTa: `Phòng ${roomType} thoáng mát, đầy đủ tiện nghi`,
        trangThai: i % 3 === 0 ? 2 : 1,
        trangThaiText: i % 3 === 0 ? 'Đã đặt' : 'Trống',
        giaTien: price,
        loaiPhongText: roomType,
        features: ['WiFi', 'TV', 'Điều hòa', 'Minibar']
      });
    }

    return mockRooms;
  };

  // Hàm lấy text trạng thái phòng
  const getTrangThaiText = (trangThai: number): string => {
    switch (trangThai) {
      case 1: return 'Phòng trống';
      case 2: return 'Đã đặt';
      case 3: return 'Có khách';
      case 4: return 'Trả phòng';
      case 5: return 'Đang dọn';
      default: return 'Không xác định';
    }
  };

  // Danh sách trạng thái phòng cho filter
  const roomStatusOptions = [
    { value: 1, label: 'Phòng trống', color: 'green' },
    { value: 2, label: 'Đã đặt', color: 'orange' },
    { value: 3, label: 'Có khách', color: 'red' },
    { value: 4, label: 'Trả phòng', color: 'blue' },
    { value: 5, label: 'Đang dọn', color: 'purple' }
  ];

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRooms(page);
  };

  // Xử lý khi click vào phòng
  const handleRoomClick = (room: Room) => {
    // Sử dụng soPhong thay vì maPhong vì API cần soPhong
    const roomIdentifier = room.soPhong || room.maPhong || room.id;
    router.push(`/room/${roomIdentifier}`);
  };

  return (
    <Layout>
      <div className={styles.roomsContainer}>
        <div className={styles.roomsHeader}>
          <h1>Danh sách phòng</h1>
          <p>Khám phá các loại phòng tại khách sạn của chúng tôi</p>
        </div>

        <div className={styles.filterSection}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Search
                placeholder="Tìm kiếm phòng..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={(value) => setSearchTerm(value)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            <Col xs={24} sm={8} md={4} lg={4} xl={4}>
              <Select
                placeholder={<><UserOutlined /> Số khách</>}
                style={{ width: '100%' }}
                onChange={(value) => setGuestCount(value)}
                allowClear
                size="large"
              >
                <Option value={1}>1 khách</Option>
                <Option value={2}>2 khách</Option>
                <Option value={3}>3 khách</Option>
                <Option value={4}>4+ khách</Option>
              </Select>
            </Col>

            <Col xs={24} sm={8} md={4} lg={4} xl={4}>
              <Select
                placeholder={<><HomeOutlined /> Loại phòng</>}
                style={{ width: '100%' }}
                onChange={(value) => setRoomType(value)}
                allowClear
                size="large"
                value={roomType}
              >
                <Option value={null}>Tất cả loại phòng</Option>
                {allRoomTypes.map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={4} lg={4} xl={4}>
              <Select
                placeholder="Tình trạng phòng"
                style={{ width: '100%' }}
                onChange={(value) => setRoomStatus(value)}
                allowClear
                size="large"
                value={roomStatus}
              >
                <Option value={null}>Tất cả tình trạng</Option>
                {roomStatusOptions.map((status) => (
                  <Option key={status.value} value={status.value}>
                    <span style={{ color: status.color === 'green' ? '#52c41a' :
                                         status.color === 'orange' ? '#fa8c16' :
                                         status.color === 'red' ? '#f5222d' :
                                         status.color === 'blue' ? '#1890ff' :
                                         status.color === 'purple' ? '#722ed1' : '#000' }}>
                      ● {status.label}
                    </span>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <div className={styles.priceFilter}>
                <DollarOutlined /> Giá: {priceRange[0].toLocaleString('vi-VN')}đ - {priceRange[1].toLocaleString('vi-VN')}đ
                <Slider
                  range
                  min={0}
                  max={2000000}
                  step={100000}
                  defaultValue={[0, 2000000]}
                  onChange={(value) => setPriceRange(value as [number, number])}
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className={styles.roomsResults}>
          <p>{totalItems} phòng được tìm thấy</p>
        </div>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <Button type="primary" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <Empty description="Không tìm thấy phòng nào phù hợp với tiêu chí tìm kiếm" />
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {rooms.map((room) => (
                <Col xs={24} sm={12} md={8} key={room.id}>
                  <Card
                    hoverable
                    className={styles.roomCard}
                    cover={
                      <div className={styles.roomImageContainer}>
                        <img
                          alt={room.tenPhong}
                          src={room.hinhAnh}
                          className={styles.roomImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop';
                          }}
                        />
                        <Tag
                          color={
                            room.trangThai === 1 ? 'green' :
                            room.trangThai === 2 ? 'orange' :
                            room.trangThai === 3 ? 'red' :
                            room.trangThai === 4 ? 'blue' :
                            room.trangThai === 5 ? 'purple' : 'default'
                          }
                          className={styles.roomStatus}
                        >
                          {room.trangThaiText}
                        </Tag>
                      </div>
                    }
                    onClick={() => handleRoomClick(room)}
                  >
                    <div className={styles.roomCardContent}>
                      <h3>{room.tenPhong}</h3>
                      <div className={styles.roomType}>{room.loaiPhongText}</div>
                      <div className={styles.roomFeatures}>
                        <span><UserOutlined /> {room.soNguoi} khách</span>
                        {room.features?.slice(0, 2).map((feature, index) => (
                          <span key={index}>{feature}</span>
                        ))}
                      </div>
                      <div className={styles.roomPrice}>
                        <span>{room.giaTien?.toLocaleString('vi-VN')}đ</span>
                        <small>/ đêm</small>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className={styles.pagination}>
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} phòng`
                }
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default RoomsPage;
