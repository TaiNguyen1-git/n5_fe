import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Card, Statistic, Row, Col, Avatar, Tabs, message, Select } from 'antd';
import { EyeOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;
const BASE_URL = 'https://ptud-web-1.onrender.com/api';

// Interface định nghĩa cấu trúc dữ liệu khách hàng
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  status: string;
}

// Interface định nghĩa cấu trúc dữ liệu lịch sử đặt phòng
interface BookingHistory {
  id: number;
  customerId: number;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch khách hàng từ API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/KhachHang/GetAll`);
      
      // Chuyển đổi dữ liệu từ API thành định dạng phù hợp
      const formattedCustomers = response.data.map((customer: any) => ({
        id: customer.maKH,
        name: customer.hoTen,
        phone: customer.soDienThoai || '',
        email: customer.email || '',
        address: customer.diaChi || '',
        visits: customer.soLanGheTham || 1,
        totalSpent: customer.tongChiTieu || 0,
        lastVisit: customer.lanCuoiGheTham || dayjs().format('YYYY-MM-DD'),
        status: customer.trangThai === 1 ? 'active' : customer.trangThai === 2 ? 'vip' : 'inactive'
      }));
      
      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Không thể lấy danh sách khách hàng từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch lịch sử đặt phòng của khách hàng
  const fetchCustomerBookingHistory = async (customerId: number) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${BASE_URL}/DatPhong/GetByUser?id=${customerId}`);
      
      // Chuyển đổi dữ liệu từ API thành định dạng phù hợp
      const formattedHistory = response.data.map((booking: any) => ({
        id: booking.maHD,
        customerId: booking.maKH,
        roomNumber: booking.maPhong.toString(),
        checkIn: booking.ngayBatDau,
        checkOut: booking.ngayKetThuc,
        totalAmount: booking.tongTien,
        status: booking.trangThai === 1 ? 'completed' : booking.trangThai === 0 ? 'cancelled' : 'pending'
      }));
      
      setBookingHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      message.error('Không thể lấy lịch sử đặt phòng từ máy chủ');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Xử lý xem chi tiết khách hàng
  const handleView = (customer: any) => {
    setViewCustomer(customer);
    setIsModalVisible(true);
    fetchCustomerBookingHistory(customer.id);
  };

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Xử lý lọc theo trạng thái
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Lọc danh sách khách hàng
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.phone.includes(searchText) ||
      customer.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter ? customer.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Lấy lịch sử đặt phòng của khách hàng
  const getCustomerBookingHistory = (customerId: number) => {
    return bookingHistory.filter(booking => booking.customerId === customerId);
  };

  // Định nghĩa các cột cho bảng khách hàng
  const columns: ColumnsType<any> = [
    {
      title: 'Khách hàng',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.status === 'vip' ? '#f56a00' : '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.phone}</div>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Số lần ghé thăm',
      dataIndex: 'visits',
      key: 'visits',
      sorter: (a, b) => a.visits - b.visits,
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Lần cuối ghé thăm',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.lastVisit).unix() - dayjs(b.lastVisit).unix(),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = '';
        
        switch(status) {
          case 'active':
            color = 'green';
            text = 'Hoạt động';
            break;
          case 'inactive':
            color = 'gray';
            text = 'Không hoạt động';
            break;
          case 'vip':
            color = 'gold';
            text = 'VIP';
            break;
          default:
            text = status;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Không hoạt động', value: 'inactive' },
        { text: 'VIP', value: 'vip' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          type="primary"
          size="small"
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  // Định nghĩa các cột cho bảng lịch sử đặt phòng
  const bookingColumns: ColumnsType<any> = [
    {
      title: 'Mã đặt phòng',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Số phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let text = '';
        
        switch(status) {
          case 'completed':
            color = 'green';
            text = 'Hoàn thành';
            break;
          case 'pending':
            color = 'geekblue';
            text = 'Đang xử lý';
            break;
          case 'cancelled':
            color = 'volcano';
            text = 'Đã hủy';
            break;
          default:
            text = status;
            color = 'default';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Quản lý khách hàng</h2>
      
      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số khách hàng"
              value={customers.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Khách hàng hoạt động"
              value={customers.filter(c => c.status === 'active').length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Khách hàng VIP"
              value={customers.filter(c => c.status === 'vip').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu từ khách hàng"
              value={customers.reduce((sum, customer) => sum + customer.totalSpent, 0)}
              suffix="VNĐ"
              precision={0}
              formatter={(value) => `${value.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Tìm kiếm và lọc */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại"
          style={{ width: 400 }}
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
        />
        
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          onChange={handleStatusFilterChange}
          allowClear
        >
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Không hoạt động</Option>
          <Option value="vip">VIP</Option>
        </Select>
      </div>
      
      {/* Bảng khách hàng */}
      <Table 
        columns={columns} 
        dataSource={filteredCustomers} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
      
      {/* Modal xem chi tiết khách hàng */}
      <Modal
        title="Chi tiết khách hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewCustomer && (
          <>
            <div style={{ display: 'flex', marginBottom: '24px' }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: viewCustomer.status === 'vip' ? '#f56a00' : '#1890ff' }} />
              <div style={{ marginLeft: '16px' }}>
                <h2 style={{ margin: 0 }}>{viewCustomer.name}</h2>
                <p>{viewCustomer.email}</p>
                <Tag color={viewCustomer.status === 'active' ? 'green' : viewCustomer.status === 'vip' ? 'gold' : 'default'}>
                  {viewCustomer.status === 'active' ? 'Hoạt động' : viewCustomer.status === 'vip' ? 'VIP' : 'Không hoạt động'}
                </Tag>
              </div>
            </div>
            
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Số lần ghé thăm"
                    value={viewCustomer.visits}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng chi tiêu"
                    value={viewCustomer.totalSpent}
                    precision={0}
                    suffix="VNĐ"
                    formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Lần cuối ghé thăm"
                    value={dayjs(viewCustomer.lastVisit).format('DD/MM/YYYY')}
                  />
                </Card>
              </Col>
            </Row>
            
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab={<span><UserOutlined />Thông tin cá nhân</span>}
                key="1"
              >
                <p><strong>Họ tên:</strong> {viewCustomer.name}</p>
                <p><strong>Email:</strong> {viewCustomer.email}</p>
                <p><strong>Số điện thoại:</strong> {viewCustomer.phone}</p>
                <p><strong>Địa chỉ:</strong> {viewCustomer.address}</p>
              </TabPane>
              <TabPane
                tab={<span><HistoryOutlined />Lịch sử đặt phòng</span>}
                key="2"
              >
                <Table 
                  columns={bookingColumns}
                  dataSource={getCustomerBookingHistory(viewCustomer.id)}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  loading={loadingHistory}
                />
              </TabPane>
            </Tabs>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;
