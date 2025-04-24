import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Select, Form, Card, Statistic, Row, Col, Tooltip, DatePicker, Divider, Steps, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, PrinterOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;
const { Step } = Steps;
const BASE_URL = 'https://ptud-web-1.onrender.com/api';

const BillManagement = () => {
  const [bills, setBills] = useState<any[]>([]);
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
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingActiveRooms, setLoadingActiveRooms] = useState(true);
  
  useEffect(() => {
    fetchBills();
    fetchActiveRooms();
    fetchServices();
  }, []);
  
  // Fetch bills from backend
  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/HoaDon/GetAll`);
      const formattedBills = response.data.map((bill: any) => ({
        id: bill.maHD,
        billNumber: `HD${String(bill.maHD).padStart(3, '0')}`,
        customerName: bill.tenKH,
        roomNumber: bill.maPhong,
        checkIn: bill.ngayBatDau,
        checkOut: bill.ngayKetThuc,
        createdAt: bill.ngayTao,
        totalAmount: bill.tongTien,
        paymentMethod: bill.phuongThucThanhToan || 'cash',
        status: bill.trangThai === 1 ? 'paid' : bill.trangThai === 0 ? 'cancelled' : 'pending',
        items: bill.chiTietHoaDon ? bill.chiTietHoaDon.map((item: any) => ({
          id: item.maChiTiet,
          description: item.moTa || 'Tiền phòng',
          quantity: item.soLuong || 1,
          price: item.donGia,
          amount: item.thanhTien
        })) : [{ 
          id: 1, 
          description: 'Tiền phòng', 
          quantity: 1, 
          price: bill.tongTien, 
          amount: bill.tongTien 
        }]
      }));
      setBills(formattedBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      message.error('Không thể lấy danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch active rooms from backend
  const fetchActiveRooms = async () => {
    setLoadingActiveRooms(true);
    try {
      const response = await axios.get(`${BASE_URL}/DatPhong/GetActive`);
      const formattedActiveRooms = response.data.map((booking: any) => ({
        id: booking.maHD,
        number: booking.maPhong,
        customerName: booking.tenKH,
        checkIn: booking.ngayBatDau,
        price: booking.tongTien / Math.max(1, dayjs(booking.ngayKetThuc).diff(dayjs(booking.ngayBatDau), 'day'))
      }));
      setActiveRooms(formattedActiveRooms);
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      message.error('Không thể lấy danh sách phòng đang hoạt động');
    } finally {
      setLoadingActiveRooms(false);
    }
  };
  
  // Fetch services from backend
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await axios.get(`${BASE_URL}/DichVu/GetAll`);
      const formattedServices = response.data.map((service: any) => ({
        id: service.maDichVu,
        name: service.ten,
        price: service.gia
      }));
      setServices(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Không thể lấy danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  // Xử lý xóa hóa đơn
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận hủy hóa đơn',
      content: 'Bạn chắc chắn muốn hủy hóa đơn này?',
      okText: 'Hủy hóa đơn',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          await axios.put(`${BASE_URL}/HoaDon/Cancel?id=${id}`);
          setBills(bills.map(bill => 
            bill.id === id ? {...bill, status: 'cancelled'} : bill
          ));
          message.success('Hủy hóa đơn thành công');
        } catch (error) {
          console.error('Error canceling bill:', error);
          message.error('Không thể hủy hóa đơn');
        }
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
    form.validateFields().then(async values => {
      try {
        const { roomId, paymentMethod, additionalServices } = values;
        const room = activeRooms.find(r => r.id === roomId);
        
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
            const service = services.find(s => s.id === serviceId);
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
        
        // Gửi yêu cầu tạo hóa đơn đến backend
        const billData = {
          maPhong: room?.number,
          tenKH: room?.customerName,
          ngayBatDau: room?.checkIn,
          ngayKetThuc: checkOut.format('YYYY-MM-DD'),
          tongTien: totalAmount,
          phuongThucThanhToan: paymentMethod,
          trangThai: 1,
          chiTietHoaDon: items.map(item => ({
            moTa: item.description,
            soLuong: item.quantity,
            donGia: item.price,
            thanhTien: item.amount
          }))
        };
        
        const response = await axios.post(`${BASE_URL}/HoaDon/Create`, billData);
        
        // Tạo hóa đơn mới thành công, thêm vào danh sách
        const newBill = {
          id: response.data.maHD,
          billNumber: `HD${String(response.data.maHD).padStart(3, '0')}`,
          customerName: room?.customerName || 'Khách hàng',
          roomNumber: room?.number || '',
          checkIn: room?.checkIn || '',
          checkOut: checkOut.format('YYYY-MM-DD'),
          createdAt: checkOut.format('YYYY-MM-DD'),
          totalAmount,
          paymentMethod,
          status: 'paid',
          items
        };
        
        setBills([...bills, newBill]);
        setIsNewBillModalVisible(false);
        form.resetFields();
        setBillItems([]);
        setSelectedRoom(null);
        message.success('Tạo hóa đơn thành công');
      } catch (error) {
        console.error('Error creating bill:', error);
        message.error('Không thể tạo hóa đơn mới');
      }
    });
  };

  // Xử lý chọn phòng khi tạo hóa đơn mới
  const handleRoomSelect = (roomId: number) => {
    const room = activeRooms.find(r => r.id === roomId);
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
      const service = services.find(s => s.id === serviceId);
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
    form.validateFields().then(async values => {
      try {
        const { paymentMethod } = values;
        
        // Gửi yêu cầu cập nhật hóa đơn đến backend
        await axios.put(`${BASE_URL}/HoaDon/Update`, {
          maHD: editingBill.id,
          phuongThucThanhToan: paymentMethod,
          trangThai: editingBill.status === 'paid' ? 1 : editingBill.status === 'cancelled' ? 0 : 2
        });
        
        // Cập nhật hóa đơn trong state
        setBills(bills.map(item => 
          item.id === editingBill.id ? {...editingBill, paymentMethod} : item
        ));
        
        setIsEditModalVisible(false);
        message.success('Cập nhật hóa đơn thành công');
      } catch (error) {
        console.error('Error updating bill:', error);
        message.error('Không thể cập nhật hóa đơn');
      }
    });
  };

  // Xử lý thanh toán hóa đơn
  const handlePayment = (bill: any) => {
    Modal.confirm({
      title: 'Xác nhận thanh toán',
      content: 'Xác nhận hóa đơn đã được thanh toán?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.put(`${BASE_URL}/HoaDon/Update`, {
            maHD: bill.id,
            phuongThucThanhToan: bill.paymentMethod,
            trangThai: 1 // Paid status
          });
          
          setBills(bills.map(item => 
            item.id === bill.id ? {...item, status: 'paid'} : item
          ));
          
          message.success('Cập nhật trạng thái thanh toán thành công');
        } catch (error) {
          console.error('Error updating payment status:', error);
          message.error('Không thể cập nhật trạng thái thanh toán');
        }
      }
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
                  onClick={() => handlePayment(record)}
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
              {activeRooms.map(room => (
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
                  {services.map(service => (
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

export default BillManagement;
