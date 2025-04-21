import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Card, Statistic, Row, Col, Avatar, Tabs, message } from 'antd';
import { EyeOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

// Mock data cho khách hàng
const mockCustomers = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@gmail.com',
    address: 'Hồ Chí Minh',
    visits: 5,
    totalSpent: 15000000,
    lastVisit: '2025-04-10',
    status: 'active'
  },
  {
    id: 2,
    name: 'Trần Thị B',
    phone: '0909876543',
    email: 'tranthib@gmail.com',
    address: 'Hà Nội',
    visits: 2,
    totalSpent: 6000000,
    lastVisit: '2025-03-15',
    status: 'active'
  },
  {
    id: 3,
    name: 'Lê Văn C',
    phone: '0977889900',
    email: 'levanc@gmail.com',
    address: 'Đà Nẵng',
    visits: 8,
    totalSpent: 24000000,
    lastVisit: '2025-04-18',
    status: 'vip'
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    phone: '0966778899',
    email: 'phamthid@gmail.com',
    address: 'Cần Thơ',
    visits: 1,
    totalSpent: 3000000,
    lastVisit: '2025-02-20',
    status: 'inactive'
  }
];

// Mock data cho lịch sử đặt phòng
const mockBookingHistory = [
  {
    id: 1,
    customerId: 1,
    roomNumber: '101',
    checkIn: '2025-04-05',
    checkOut: '2025-04-08',
    totalAmount: 3000000,
    status: 'completed'
  },
  {
    id: 2,
    customerId: 1,
    roomNumber: '202',
    checkIn: '2025-03-15',
    checkOut: '2025-03-18',
    totalAmount: 4500000,
    status: 'completed'
  },
  {
    id: 3,
    customerId: 1,
    roomNumber: '305',
    checkIn: '2025-02-10',
    checkOut: '2025-02-15',
    totalAmount: 7500000,
    status: 'completed'
  },
  {
    id: 4,
    customerId: 2,
    roomNumber: '103',
    checkIn: '2025-03-12',
    checkOut: '2025-03-15',
    totalAmount: 3000000,
    status: 'completed'
  },
  {
    id: 5,
    customerId: 2,
    roomNumber: '201',
    checkIn: '2025-01-20',
    checkOut: '2025-01-22',
    totalAmount: 3000000,
    status: 'completed'
  },
  {
    id: 6,
    customerId: 3,
    roomNumber: 'VIP01',
    checkIn: '2025-04-15',
    checkOut: '2025-04-18',
    totalAmount: 9000000,
    status: 'completed'
  },
  {
    id: 7,
    customerId: 3,
    roomNumber: 'VIP02',
    checkIn: '2025-03-25',
    checkOut: '2025-03-28',
    totalAmount: 9000000,
    status: 'completed'
  },
  {
    id: 8,
    customerId: 3,
    roomNumber: '401',
    checkIn: '2025-02-05',
    checkOut: '2025-02-08',
    totalAmount: 6000000,
    status: 'completed'
  },
  {
    id: 9,
    customerId: 4,
    roomNumber: '102',
    checkIn: '2025-02-18',
    checkOut: '2025-02-20',
    totalAmount: 3000000,
    status: 'completed'
  }
];

const CustomerManagement = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Xử lý xem chi tiết khách hàng
  const handleView = (customer: any) => {
    setViewCustomer(customer);
    setIsModalVisible(true);
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
    return mockBookingHistory.filter(booking => booking.customerId === customerId);
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
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => handleView(record)}
          type="primary"
          size="small"
        >
          Xem
        </Button>
      ),
    },
  ];

  // Định nghĩa các cột cho bảng lịch sử đặt phòng
  const bookingHistoryColumns: ColumnsType<any> = [
    {
      title: 'Phòng',
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
      title: 'Số ngày',
      key: 'days',
      render: (_, record) => dayjs(record.checkOut).diff(dayjs(record.checkIn), 'day'),
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
        let color = status === 'completed' ? 'green' : 'blue';
        let text = status === 'completed' ? 'Hoàn thành' : 'Đang xử lý';
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tổng khách hàng" 
                value={customers.length} 
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
                title="Khách hàng hoạt động" 
                value={customers.filter(c => c.status === 'active').length} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Khách hàng không hoạt động" 
                value={customers.filter(c => c.status === 'inactive').length} 
                valueStyle={{ color: '#999' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên, SĐT, email"
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />
        
        <select
          style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            border: '1px solid #d9d9d9',
            width: '200px',
            backgroundColor: '#fff',
            color: '#333'
          }}
          value={statusFilter || ''}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="vip">VIP</option>
        </select>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      
      {/* Modal xem chi tiết khách hàng */}
      <Modal
        title="Chi tiết khách hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {viewCustomer && (
          <div>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Thông tin cá nhân" key="1">
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: viewCustomer.status === 'vip' ? '#f56a00' : '#1890ff' }} />
                  <div style={{ marginLeft: '20px' }}>
                    <h2 style={{ margin: '0 0 5px 0' }}>{viewCustomer.name}</h2>
                    <Tag color={
                      viewCustomer.status === 'active' ? 'green' : 
                      viewCustomer.status === 'vip' ? 'gold' : 'gray'
                    }>
                      {viewCustomer.status === 'active' ? 'Hoạt động' : 
                       viewCustomer.status === 'vip' ? 'VIP' : 'Không hoạt động'}
                    </Tag>
                  </div>
                </div>
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Số điện thoại</div>
                      <div>{viewCustomer.phone}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Email</div>
                      <div>{viewCustomer.email}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Địa chỉ</div>
                      <div>{viewCustomer.address}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Lần cuối ghé thăm</div>
                      <div>{dayjs(viewCustomer.lastVisit).format('DD/MM/YYYY')}</div>
                    </div>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Số lần ghé thăm" 
                        value={viewCustomer.visits} 
                        prefix={<HistoryOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Tổng chi tiêu" 
                        value={viewCustomer.totalSpent.toLocaleString('vi-VN')} 
                        suffix="VNĐ"
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Chi tiêu trung bình/lần" 
                        value={Math.round(viewCustomer.totalSpent / viewCustomer.visits).toLocaleString('vi-VN')} 
                        suffix="VNĐ"
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Lịch sử đặt phòng" key="2">
                <Table
                  columns={bookingHistoryColumns}
                  dataSource={getCustomerBookingHistory(viewCustomer.id)}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;
