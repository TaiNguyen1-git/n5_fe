import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Select, DatePicker, Card, Statistic, Row, Col, Tooltip, message, Divider } from 'antd';
import { EyeOutlined, PrinterOutlined, SearchOutlined, UserOutlined, HomeOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;
const { RangePicker } = DatePicker;
// API endpoints are handled by Next.js API routes in /pages/api

// Interface for bill data
interface Bill {
  id: number;
  billNumber: string;
  customerName: string;
  customerId?: number;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items?: BillItem[];
}

// Interface for bill item
interface BillItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total?: number; // Added total property for the bill item
}

// Interface for customer data
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

const BillManagement = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Fetch bills on component mount
  useEffect(() => {
    fetchBills();
  }, []);

  // Fetch bills from backend with retry logic
  const fetchBills = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues
      const billsPromise = axios.get(`/api/bills`, {
        timeout: 15000, // 15 second timeout
      });

      // Fetch bill details separately
      const billDetailsPromise = axios.get(`/api/bill-details`, {
        timeout: 15000, // 15 second timeout
      });

      // Use Promise.allSettled to handle partial failures
      const [billsResult, billDetailsResult] = await Promise.allSettled([
        billsPromise,
        billDetailsPromise
      ]);

      // Process bills data
      let billsData: any[] = [];
      if (billsResult.status === 'fulfilled' && billsResult.value.data) {
        // Handle both array and object with items property formats for bills
        billsData = Array.isArray(billsResult.value.data) ? billsResult.value.data :
                    (billsResult.value.data.items && Array.isArray(billsResult.value.data.items)) ?
                    billsResult.value.data.items : [];
      } else {
        console.error('Failed to fetch bills data');
      }

      // Process bill details data
      let billDetailsMap: Record<number, any[]> = {};
      if (billDetailsResult.status === 'fulfilled' &&
          billDetailsResult.value.data &&
          billDetailsResult.value.data.items &&
          Array.isArray(billDetailsResult.value.data.items)) {

        // Group bill details by bill ID
        billDetailsResult.value.data.items.forEach((item: any) => {
          if (item.idHoaDon) {
            if (!billDetailsMap[item.idHoaDon]) {
              billDetailsMap[item.idHoaDon] = [];
            }
            billDetailsMap[item.idHoaDon].push(item);
          }
        });
      } else {
        console.error('Failed to fetch bill details data');
      }

      // Format bills with available data
      const formattedBills = billsData.map((bill: any) => {
        const billId = bill.maHD || 0;
        const billDetails = billDetailsMap[billId] || [];

        return {
          id: billId,
          billNumber: `HD${String(billId).padStart(3, '0')}`,
          customerName: bill.tenKH || 'Khách hàng',
          customerId: bill.maKH,
          roomNumber: bill.maPhong || '',
          checkIn: bill.ngayBatDau || dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
          checkOut: bill.ngayKetThuc || dayjs().format('YYYY-MM-DD'),
          createdAt: bill.ngayTao || dayjs().format('YYYY-MM-DD'),
          totalAmount: bill.tongTien || 0,
          paymentMethod: bill.phuongThucThanhToan || 'cash',
          status: bill.trangThai === 1 ? 'paid' : bill.trangThai === 0 ? 'cancelled' : 'pending',
          items: billDetails.map((item: any) => ({
            id: item.maChiTiet || Date.now() + Math.floor(Math.random() * 1000),
            description: item.moTa || 'Tiền phòng',
            quantity: item.soLuong || 1,
            price: item.donGia || 0,
            total: item.thanhTien || (item.soLuong * item.donGia) || 0
          }))
        };
      });

      setBills(formattedBills);
    } catch (error: any) {
      console.error('Error fetching bills:', error);

      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        message.warning(`Đang thử kết nối lại... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchBills(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // If all retries fail, show error
      message.error('Không thể tải danh sách hóa đơn từ máy chủ.');

      // Set empty bills array
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details with retry logic
  const fetchCustomerDetails = async (customerId: number, retryCount = 0) => {
    setCustomerLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues
      const response = await axios.get(`/api/customers/${customerId}`, {
        timeout: 8000, // 8 second timeout
        validateStatus: function () {
          // Accept all status codes to handle them manually
          return true;
        }
      }).catch(error => {
        console.error('Error in customer API request:', error.message);
        return { data: null, status: 500 };
      });

      // Check if the response status is successful
      if (response.status >= 200 && response.status < 300 && response.data && Object.keys(response.data).length > 0) {
        setCustomerDetails({
          id: response.data.maKH || customerId,
          name: response.data.hoTen || `Khách hàng #${customerId}`,
          phone: response.data.soDienThoai || '',
          email: response.data.email || '',
        });
      } else {
        console.log(`Customer API returned status ${response.status} or empty data`);
        throw new Error(`Failed to fetch customer data: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error processing customer details:', error.message);

      // Implement retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying customer details fetch (${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchCustomerDetails(customerId, retryCount + 1);
        }, 1500 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // Use bill data as fallback
      if (viewBill) {
        setCustomerDetails({
          id: customerId,
          name: viewBill.customerName || `Khách hàng #${customerId}`,
          phone: '',
          email: '',
        });
      } else {
        setCustomerDetails(null);
      }
    } finally {
      setCustomerLoading(false);
    }
  };

  // Handle view bill details
  const handleView = (bill: Bill) => {
    setViewBill(bill);
    setIsModalVisible(true);
    if (bill.customerId) {
      fetchCustomerDetails(bill.customerId);
    } else {
      setCustomerDetails(null);
    }
  };

  // Handle print bill
  const handlePrint = (bill: Bill) => {
    message.info(`Đang in hóa đơn ${bill.billNumber}`);
    // Implement print functionality here
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Filter bills based on search, date range, and status
  const filteredBills = bills.filter(bill => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      bill.roomNumber.toString().includes(searchText);

    const matchesStatus = statusFilter ? bill.status === statusFilter : true;

    let matchesDateRange = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const billDate = dayjs(bill.createdAt);
      const filterStart = dateRange[0];
      const filterEnd = dateRange[1];
      matchesDateRange = billDate.isAfter(filterStart) && billDate.isBefore(filterEnd);
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate statistics
  const totalRevenue = bills.reduce((sum, bill) => bill.status === 'paid' ? sum + bill.totalAmount : sum, 0);
  const paidBillsCount = bills.filter(bill => bill.status === 'paid').length;
  const pendingBillsCount = bills.filter(bill => bill.status === 'pending').length;

  // Define columns for the table
  const columns: ColumnsType<Bill> = [
    {
      title: 'Số hóa đơn',
      dataIndex: 'billNumber',
      key: 'billNumber',
      sorter: (a, b) => a.billNumber.localeCompare(b.billNumber),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
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
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = '';

        switch(status) {
          case 'paid':
            color = 'green';
            text = 'Đã thanh toán';
            break;
          case 'pending':
            color = 'gold';
            text = 'Chờ thanh toán';
            break;
          case 'cancelled':
            color = 'red';
            text = 'Đã hủy';
            break;
          default:
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Đã thanh toán', value: 'paid' },
        { text: 'Chờ thanh toán', value: 'pending' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Quản lý hóa đơn</h2>
        <p>Xem và quản lý tất cả hóa đơn trong hệ thống</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')} VNĐ`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Hóa đơn đã thanh toán"
              value={paidBillsCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Hóa đơn chờ thanh toán"
              value={pendingBillsCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo số hóa đơn, khách hàng, phòng"
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />

        <RangePicker
          onChange={handleDateRangeChange}
          placeholder={['Từ ngày', 'Đến ngày']}
        />

        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          allowClear
          onChange={handleStatusFilterChange}
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
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Chi tiết hóa đơn ${viewBill?.billNumber}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => viewBill && handlePrint(viewBill)}>
            In hóa đơn
          </Button>
        ]}
        width={700}
      >
        {viewBill && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <h3>Thông tin hóa đơn</h3>
                <p><strong>Số hóa đơn:</strong> {viewBill.billNumber}</p>
                <p><strong>Ngày tạo:</strong> {dayjs(viewBill.createdAt).format('DD/MM/YYYY')}</p>
                <p><strong>Trạng thái:</strong> <Tag color={
                  viewBill.status === 'paid' ? 'green' :
                  viewBill.status === 'pending' ? 'gold' : 'red'
                }>
                  {viewBill.status === 'paid' ? 'Đã thanh toán' :
                   viewBill.status === 'pending' ? 'Chờ thanh toán' : 'Đã hủy'}
                </Tag></p>
                <p><strong>Phương thức thanh toán:</strong> {
                  viewBill.paymentMethod === 'cash' ? 'Tiền mặt' :
                  viewBill.paymentMethod === 'card' ? 'Thẻ tín dụng' :
                  viewBill.paymentMethod === 'transfer' ? 'Chuyển khoản' : viewBill.paymentMethod
                }</p>
              </Col>
              <Col span={12}>
                <h3>Thông tin khách hàng</h3>
                {customerLoading ? (
                  <p>Đang tải thông tin khách hàng...</p>
                ) : customerDetails ? (
                  <>
                    <p><strong>Họ tên:</strong> {customerDetails.name}</p>
                    <p><strong>Số điện thoại:</strong> {customerDetails.phone}</p>
                    <p><strong>Email:</strong> {customerDetails.email}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Họ tên:</strong> {viewBill.customerName}</p>
                    <p><strong>Thông tin khách hàng không có trong hệ thống</strong></p>
                  </>
                )}
              </Col>
            </Row>

            <Divider />

            <h3>Thông tin phòng</h3>
            <p><strong>Số phòng:</strong> {viewBill.roomNumber}</p>
            <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBill.checkIn).format('DD/MM/YYYY')}</p>
            <p><strong>Ngày trả phòng:</strong> {dayjs(viewBill.checkOut).format('DD/MM/YYYY')}</p>
            <p><strong>Số ngày:</strong> {dayjs(viewBill.checkOut).diff(dayjs(viewBill.checkIn), 'day')}</p>

            <Divider />

            <h3>Chi tiết hóa đơn</h3>
            <Table
              dataSource={viewBill.items || []}
              rowKey="id"
              pagination={false}
              columns={[
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
                  dataIndex: 'total',
                  key: 'total',
                  align: 'right',
                  render: (total, record) => `${(total || (record.price * record.quantity)).toLocaleString('vi-VN')} VNĐ`,
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}><strong>Tổng cộng</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong>{viewBill.totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillManagement;
