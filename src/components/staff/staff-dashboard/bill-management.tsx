import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Select, Form, Card, Statistic, Row, Col, Tooltip, DatePicker, Divider, Steps } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, PrinterOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { Step } = Steps;

// Mock data cho hóa đơn
const mockBills = [
  {
    id: 1,
    billNumber: 'HD001',
    customerName: 'Nguyễn Văn A',
    roomNumber: '101',
    checkIn: '2025-04-01',
    checkOut: '2025-04-03',
    createdAt: '2025-04-03',
    totalAmount: 3000000,
    paymentMethod: 'cash',
    status: 'paid',
    items: [
      { id: 1, description: 'Tiền phòng', quantity: 2, price: 1000000, amount: 2000000 },
      { id: 2, description: 'Dịch vụ ăn uống', quantity: 1, price: 500000, amount: 500000 },
      { id: 3, description: 'Dịch vụ giặt ủi', quantity: 1, price: 300000, amount: 300000 },
      { id: 4, description: 'Minibar', quantity: 1, price: 200000, amount: 200000 },
    ]
  },
  {
    id: 2,
    billNumber: 'HD002',
    customerName: 'Trần Thị B',
    roomNumber: '102',
    checkIn: '2025-03-10',
    checkOut: '2025-03-15',
    createdAt: '2025-03-15',
    totalAmount: 10000000,
    paymentMethod: 'card',
    status: 'paid',
    items: [
      { id: 1, description: 'Tiền phòng', quantity: 5, price: 1800000, amount: 9000000 },
      { id: 2, description: 'Dịch vụ spa', quantity: 1, price: 1000000, amount: 1000000 },
    ]
  },
  {
    id: 3,
    billNumber: 'HD003',
    customerName: 'Lê Văn C',
    roomNumber: '201',
    checkIn: '2025-04-15',
    checkOut: '2025-04-18',
    createdAt: '2025-04-18',
    totalAmount: 4500000,
    paymentMethod: 'transfer',
    status: 'pending',
    items: [
      { id: 1, description: 'Tiền phòng', quantity: 3, price: 1500000, amount: 4500000 },
    ]
  },
  {
    id: 4,
    billNumber: 'HD004',
    customerName: 'Phạm Thị D',
    roomNumber: '202',
    checkIn: '2025-03-01',
    checkOut: '2025-03-05',
    createdAt: '2025-03-05',
    totalAmount: 7500000,
    paymentMethod: 'ewallet',
    status: 'cancelled',
    items: [
      { id: 1, description: 'Tiền phòng', quantity: 4, price: 1500000, amount: 6000000 },
      { id: 2, description: 'Dịch vụ đưa đón', quantity: 1, price: 1500000, amount: 1500000 },
    ]
  }
];

// Mock data cho phòng đang sử dụng (để tạo hóa đơn mới)
const mockActiveRooms = [
  { id: 1, number: '103', customerName: 'Hoàng Văn E', checkIn: '2025-04-19', price: 1000000 },
  { id: 2, number: '104', customerName: 'Vũ Thị F', checkIn: '2025-04-20', price: 1500000 },
];

// Mock data cho dịch vụ
const mockServices = [
  { id: 1, name: 'Dịch vụ ăn uống', price: 500000 },
  { id: 2, name: 'Dịch vụ giặt ủi', price: 300000 },
  { id: 3, name: 'Dịch vụ spa', price: 1000000 },
  { id: 4, name: 'Dịch vụ đưa đón', price: 1500000 },
  { id: 5, name: 'Minibar', price: 200000 },
];

const BillManagement = () => {
  const [bills, setBills] = useState(mockBills);
  const [viewBill, setViewBill] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewBillModalVisible, setIsNewBillModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [billItems, setBillItems] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Xử lý xóa hóa đơn
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận hủy hóa đơn',
      content: 'Bạn chắc chắn muốn hủy hóa đơn này?',
      okText: 'Hủy hóa đơn',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: () => {
        setBills(bills.map(bill => 
          bill.id === id ? {...bill, status: 'cancelled'} : bill
        ));
      },
    });
  };

  // Xử lý xem chi tiết hóa đơn
  const handleView = (bill: any) => {
    setViewBill(bill);
    setIsModalVisible(true);
  };

  // Xử lý in hóa đơn
  const handlePrint = (bill: any) => {
    message.success('Đang in hóa đơn ' + bill.billNumber);
  };

  // Xử lý thêm hóa đơn mới
  const handleAddBill = () => {
    form.validateFields().then(values => {
      const { roomId, paymentMethod, additionalServices } = values;
      const room = mockActiveRooms.find(r => r.id === roomId);
      
      // Tính số ngày và tiền phòng
      const checkIn = dayjs(room?.checkIn);
      const checkOut = dayjs();
      const days = checkOut.diff(checkIn, 'day') || 1;
      const roomAmount = (room?.price || 0) * days;
      
      // Tạo danh sách các mục trong hóa đơn
      const items = [
        { id: Date.now(), description: 'Tiền phòng', quantity: days, price: room?.price || 0, amount: roomAmount }
      ];
      
      // Thêm các dịch vụ bổ sung
      if (additionalServices && additionalServices.length > 0) {
        additionalServices.forEach((serviceId: number) => {
          const service = mockServices.find(s => s.id === serviceId);
          if (service) {
            items.push({
              id: Date.now() + serviceId,
              description: service.name,
              quantity: 1,
              price: service.price,
              amount: service.price
            });
          }
        });
      }
      
      // Tính tổng tiền
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // Tạo hóa đơn mới
      const newBill = {
        id: Date.now(),
        billNumber: `HD${String(bills.length + 1).padStart(3, '0')}`,
        customerName: room?.customerName || 'Khách hàng',
        roomNumber: room?.number || '',
        checkIn: room?.checkIn || '',
        checkOut: checkOut.format('YYYY-MM-DD'),
        createdAt: checkOut.format('YYYY-MM-DD'),
        totalAmount,
        paymentMethod,
        status: 'pending',
        items
      };
      
      setBills([...bills, newBill]);
      setIsNewBillModalVisible(false);
      form.resetFields();
      setBillItems([]);
      setSelectedRoom(null);
    });
  };

  // Xử lý chọn phòng khi tạo hóa đơn mới
  const handleRoomSelect = (roomId: number) => {
    const room = mockActiveRooms.find(r => r.id === roomId);
    setSelectedRoom(room);
    
    if (room) {
      const checkIn = dayjs(room.checkIn);
      const checkOut = dayjs();
      const days = checkOut.diff(checkIn, 'day') || 1;
      const roomAmount = room.price * days;
      
      setBillItems([
        { id: Date.now(), description: 'Tiền phòng', quantity: days, price: room.price, amount: roomAmount }
      ]);
    } else {
      setBillItems([]);
    }
  };

  // Xử lý thêm dịch vụ vào hóa đơn
  const handleAddService = (serviceIds: number[]) => {
    // Xóa các dịch vụ hiện có (trừ tiền phòng)
    const roomFee = billItems.find(item => item.description === 'Tiền phòng');
    let newItems = roomFee ? [roomFee] : [];
    
    // Thêm các dịch vụ mới
    serviceIds.forEach(serviceId => {
      const service = mockServices.find(s => s.id === serviceId);
      if (service) {
        newItems.push({
          id: Date.now() + serviceId,
          description: service.name,
          quantity: 1,
          price: service.price,
          amount: service.price
        });
      }
    });
    
    setBillItems(newItems);
  };

  // Xử lý chỉnh sửa hóa đơn
  const handleEdit = (bill: any) => {
    setEditingBill({...bill});
    setIsEditModalVisible(true);
  };

  // Xử lý lưu chỉnh sửa hóa đơn
  const handleSaveEdit = () => {
    form.validateFields().then(values => {
      const { paymentMethod } = values;
      
      // Cập nhật hóa đơn
      setBills(bills.map(item => 
        item.id === editingBill.id ? {...editingBill, paymentMethod} : item
      ));
      
      setIsEditModalVisible(false);
      message.success('Cập nhật hóa đơn thành công!');
    });
  };

  // Lọc hóa đơn theo trạng thái và tìm kiếm
  const filteredBills = bills.filter(bill => {
    const matchesStatus = statusFilter ? bill.status === statusFilter : true;
    const matchesSearch = searchText 
      ? bill.billNumber.toLowerCase().includes(searchText.toLowerCase()) || 
        bill.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        bill.roomNumber.includes(searchText)
      : true;
    return matchesStatus && matchesSearch;
  });

  // Định nghĩa cột cho bảng hóa đơn
  const columns: ColumnsType<any> = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        let text = '';
        switch(method) {
          case 'cash': text = 'Tiền mặt'; break;
          case 'card': text = 'Thẻ'; break;
          case 'transfer': text = 'Chuyển khoản'; break;
          case 'ewallet': text = 'Ví điện tử'; break;
          default: text = method;
        }
        return text;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = 'Không xác định';
        
        switch(status) {
          case 'paid':
            color = 'green';
            text = 'Đã thanh toán';
            break;
          case 'pending':
            color = 'orange';
            text = 'Chờ thanh toán';
            break;
          case 'cancelled':
            color = 'red';
            text = 'Đã hủy';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="In hóa đơn">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={() => handlePrint(record)}
              size="small"
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Xác nhận thanh toán">
                <Button 
                  icon={<CheckCircleOutlined />} 
                  type="primary"
                  size="small"
                  onClick={() => {
                    setBills(bills.map(bill => 
                      bill.id === record.id ? {...bill, status: 'paid'} : bill
                    ));
                  }}
                />
              </Tooltip>
              <Tooltip title="Hủy hóa đơn">
                <Button 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDelete(record.id)}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(record)}
                  size="small"
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Định nghĩa cột cho bảng chi tiết hóa đơn
  const billItemColumns: ColumnsType<any> = [
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Quản lý hóa đơn</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsNewBillModalVisible(true)}
        >
          Tạo hóa đơn mới
        </Button>
      </div>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng hóa đơn" 
              value={bills.length} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đã thanh toán" 
              value={bills.filter(b => b.status === 'paid').length} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Chờ thanh toán" 
              value={bills.filter(b => b.status === 'pending').length} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đã hủy" 
              value={bills.filter(b => b.status === 'cancelled').length} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input.Search
          placeholder="Tìm theo mã hóa đơn, tên khách, số phòng"
          allowClear
          style={{ width: 300 }}
          onSearch={value => setSearchText(value)}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ width: 200 }}
          onChange={value => setStatusFilter(value)}
        >
          <Option value="paid">Đã thanh toán</Option>
          <Option value="pending">Chờ thanh toán</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={filteredBills}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
      
      {/* Modal xem chi tiết hóa đơn */}
      <Modal
        title={`Chi tiết hóa đơn ${viewBill?.billNumber}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => handlePrint(viewBill)}>
            In hóa đơn
          </Button>,
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {viewBill && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Khách hàng:</strong> {viewBill.customerName}</p>
                <p><strong>Phòng:</strong> {viewBill.roomNumber}</p>
                <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBill.checkIn).format('DD/MM/YYYY')}</p>
                <p><strong>Ngày trả phòng:</strong> {dayjs(viewBill.checkOut).format('DD/MM/YYYY')}</p>
              </Col>
              <Col span={12}>
                <p><strong>Mã hóa đơn:</strong> {viewBill.billNumber}</p>
                <p><strong>Ngày tạo:</strong> {dayjs(viewBill.createdAt).format('DD/MM/YYYY')}</p>
                <p><strong>Phương thức thanh toán:</strong> {
                  viewBill.paymentMethod === 'cash' ? 'Tiền mặt' :
                  viewBill.paymentMethod === 'card' ? 'Thẻ' :
                  viewBill.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Ví điện tử'
                }</p>
                <p><strong>Trạng thái:</strong> {
                  viewBill.status === 'paid' ? 'Đã thanh toán' :
                  viewBill.status === 'pending' ? 'Chờ thanh toán' : 'Đã hủy'
                }</p>
              </Col>
            </Row>
            
            <Divider />
            
            <Table 
              columns={billItemColumns} 
              dataSource={viewBill.items}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <strong>Tổng cộng:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{viewBill.totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
            
            <div style={{ marginTop: 24 }}>
              <Steps current={
                viewBill.status === 'paid' ? 2 :
                viewBill.status === 'pending' ? 1 :
                viewBill.status === 'cancelled' ? 3 : 0
              }>
                <Step title="Tạo hóa đơn" description={dayjs(viewBill.createdAt).format('DD/MM/YYYY')} />
                <Step title="Chờ thanh toán" />
                <Step title="Đã thanh toán" status={viewBill.status === 'cancelled' ? 'error' : undefined} />
                {viewBill.status === 'cancelled' && <Step title="Đã hủy" status="error" />}
              </Steps>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal tạo hóa đơn mới */}
      <Modal
        title="Tạo hóa đơn mới"
        open={isNewBillModalVisible}
        onCancel={() => {
          setIsNewBillModalVisible(false);
          form.resetFields();
          setBillItems([]);
          setSelectedRoom(null);
        }}
        onOk={handleAddBill}
        okText="Tạo hóa đơn"
        cancelText="Hủy"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="roomId"
            label="Chọn phòng đang sử dụng"
            rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
          >
            <Select 
              placeholder="Chọn phòng" 
              onChange={handleRoomSelect}
            >
              {mockActiveRooms.map(room => (
                <Option key={room.id} value={room.id}>
                  {room.number} - {room.customerName} (Nhận phòng: {dayjs(room.checkIn).format('DD/MM/YYYY')})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {selectedRoom && (
            <>
              <Form.Item
                name="additionalServices"
                label="Dịch vụ bổ sung"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn dịch vụ bổ sung"
                  onChange={handleAddService}
                  style={{ width: '100%' }}
                >
                  {mockServices.map(service => (
                    <Option key={service.id} value={service.id}>
                      {service.name} - {service.price.toLocaleString('vi-VN')} VNĐ
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                initialValue="cash"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
              >
                <Select placeholder="Chọn phương thức thanh toán">
                  <Option value="cash">Tiền mặt</Option>
                  <Option value="card">Thẻ</Option>
                  <Option value="transfer">Chuyển khoản</Option>
                  <Option value="ewallet">Ví điện tử</Option>
                </Select>
              </Form.Item>
              
              <Divider />
              
              <h3>Chi tiết hóa đơn</h3>
              <Table 
                columns={billItemColumns} 
                dataSource={billItems}
                rowKey="id"
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <strong>Tổng cộng:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong>{billItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString('vi-VN')} VNĐ</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </>
          )}
        </Form>
      </Modal>
      
      {/* Modal chỉnh sửa hóa đơn */}
      <Modal
        title={`Chỉnh sửa hóa đơn ${editingBill?.billNumber}`}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleSaveEdit}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        {editingBill && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              paymentMethod: editingBill.paymentMethod
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <p><strong>Khách hàng:</strong> {editingBill.customerName}</p>
              <p><strong>Phòng:</strong> {editingBill.roomNumber}</p>
              <p><strong>Tổng tiền:</strong> {editingBill.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            </div>
            
            <Form.Item
              name="paymentMethod"
              label="Phương thức thanh toán"
              rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
            >
              <Select>
                <Option value="cash">Tiền mặt</Option>
                <Option value="card">Thẻ</Option>
                <Option value="transfer">Chuyển khoản</Option>
                <Option value="ewallet">Ví điện tử</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

// Thêm message từ antd
const { message } = require('antd');

export default BillManagement;
