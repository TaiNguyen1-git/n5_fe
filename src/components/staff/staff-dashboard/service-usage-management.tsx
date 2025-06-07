import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Card, Row, Col, message, Form, InputNumber, Select, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { serviceApi, PaginatedResponse, ApiResponse } from '../../../services/serviceApi';
import { getAllCustomersNoPagination, Customer } from '../../../services/customerService';
import styles from '../../../styles/ServiceUsageManagement.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Interface cho Service Usage
interface ServiceUsage {
  maSDDV: number;
  maKH: number;
  maDV: number;
  ngaySD: string;
  soLuong: number;
  thanhTien: number;
  trangThai: string;
  xoa: boolean;
  // Thông tin liên kết
  khachHang?: {
    tenKH: string;
    email: string;
    phone: string;
  };
  dichVu?: {
    ten: string;
    gia: number;
  };
}

// Interface cho Service
interface Service {
  maDichVu: number;
  ten: string;
  gia: number;
  moTa: string;
  hinhAnh: string;
  trangThai: number;
}

const ServiceUsageManagement: React.FC = () => {
  const [serviceUsages, setServiceUsages] = useState<ServiceUsage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUsage, setEditingUsage] = useState<ServiceUsage | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [form] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} bản ghi sử dụng dịch vụ`,
  });

  useEffect(() => {
    const initializeData = async () => {
      // Load customers and services first
      await Promise.all([fetchCustomers(), fetchServices()]);
      // Then load service usages
      await fetchServiceUsages(pagination.current, pagination.pageSize);
    };

    initializeData();
  }, []);

  // Fetch service usages
  const fetchServiceUsages = async (pageNumber: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      const response = await serviceApi.getServiceUsageHistory(pageNumber, pageSize);

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<ServiceUsage>;
        let serviceUsageItems = paginatedData.items || [];

        // Enrich data with customer and service information
        const enrichedItems = await Promise.all(
          serviceUsageItems.map(async (usage) => {
            // Find customer info
            const customer = customers.find(c => c.maKH === usage.maKH);
            // Find service info
            const service = services.find(s => s.maDichVu === usage.maDV);

            return {
              ...usage,
              khachHang: customer ? {
                tenKH: customer.tenKH,
                email: customer.email,
                phone: customer.phone || ''
              } : undefined,
              dichVu: service ? {
                ten: service.ten,
                gia: service.gia
              } : undefined
            };
          })
        );

        setServiceUsages(enrichedItems);
        setPagination(prev => ({
          ...prev,
          current: paginatedData.pageNumber,
          pageSize: paginatedData.pageSize,
          total: paginatedData.totalItems,
        }));
        message.success('Tải dữ liệu sử dụng dịch vụ thành công');
      } else {
        throw new Error(response.message || 'Failed to fetch service usages');
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu sử dụng dịch vụ. Vui lòng thử lại sau.");
      setServiceUsages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response = await getAllCustomersNoPagination();
      if (response.success && response.data) {
        // Filter out deleted customers
        const activeCustomers = response.data.filter(customer => !customer.xoa);
        setCustomers(activeCustomers);
      }
    } catch (error) {
      message.error("Không thể tải danh sách khách hàng");
    }
  };

  // Fetch services for dropdown
  const fetchServices = async () => {
    try {
      const response = await serviceApi.getAllServicesNoPagination();
      if (response && Array.isArray(response)) {
        // Filter active services
        const activeServices = response.filter((service: any) => service.trangThai === 1);
        setServices(activeServices);
      }
    } catch (error) {
      message.error("Không thể tải danh sách dịch vụ");
    }
  };

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPagination = {
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    fetchServiceUsages(page, pageSize || pagination.pageSize);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
  };

  // Filter service usages based on search and filters
  const filteredServiceUsages = serviceUsages.filter(usage => {
    const matchesSearch = !searchText || 
      usage.khachHang?.tenKH?.toLowerCase().includes(searchText.toLowerCase()) ||
      usage.dichVu?.ten?.toLowerCase().includes(searchText.toLowerCase()) ||
      usage.trangThai?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || usage.trangThai === statusFilter;
    
    const matchesDateRange = !dateRange || 
      (dayjs(usage.ngaySD).isAfter(dateRange[0].startOf('day')) && 
       dayjs(usage.ngaySD).isBefore(dateRange[1].endOf('day')));
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Get status tag
  const getStatusTag = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string } } = {
      'Đã đặt': { color: 'blue', text: 'Đã đặt' },
      'Đang sử dụng': { color: 'processing', text: 'Đang sử dụng' },
      'Hoàn thành': { color: 'success', text: 'Hoàn thành' },
      'Đã hủy': { color: 'error', text: 'Đã hủy' },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag
        color={statusInfo.color}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
          fontFeatureSettings: 'normal',
          fontVariantLigatures: 'normal'
        }}
      >
        <span style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
        }}>
          {statusInfo.text}
        </span>
      </Tag>
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchServiceUsages(pagination.current, pagination.pageSize);
    fetchCustomers();
    fetchServices();
  };

  // Handle add new service usage
  const handleAdd = () => {
    setEditingUsage(null);
    form.resetFields();
    form.setFieldsValue({
      ngaySD: dayjs().format('YYYY-MM-DD'),
      soLuong: 1,
      trangThai: 'Đã đặt'
    });
    setIsModalVisible(true);
  };

  // Handle edit service usage
  const handleEdit = (usage: ServiceUsage) => {
    setEditingUsage(usage);
    form.setFieldsValue({
      maKH: usage.maKH,
      maDV: usage.maDV,
      ngaySD: usage.ngaySD,
      soLuong: usage.soLuong,
      thanhTien: usage.thanhTien,
      trangThai: usage.trangThai,
    });
    setIsModalVisible(true);
  };

  // Handle delete service usage
  const handleDelete = async (usage: ServiceUsage) => {
    try {
      const response = await serviceApi.deleteServiceUsage(usage.maSDDV);
      if (response.success) {
        message.success('Xóa bản ghi sử dụng dịch vụ thành công');
        fetchServiceUsages(pagination.current, pagination.pageSize);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      message.error(error.message || "Không thể xóa bản ghi sử dụng dịch vụ. Vui lòng thử lại sau.");
    }
  };

  // Calculate total amount when service or quantity changes
  const handleServiceChange = (serviceId: number) => {
    const selectedService = services.find(s => s.maDichVu === serviceId);
    const quantity = form.getFieldValue('soLuong') || 1;
    if (selectedService) {
      const total = selectedService.gia * quantity;
      form.setFieldsValue({ thanhTien: total });
    }
  };

  const handleQuantityChange = (quantity: number) => {
    const serviceId = form.getFieldValue('maDV');
    const selectedService = services.find(s => s.maDichVu === serviceId);
    if (selectedService && quantity) {
      const total = selectedService.gia * quantity;
      form.setFieldsValue({ thanhTien: total });
    }
  };

  // Define table columns
  const columns: ColumnsType<ServiceUsage> = [
    {
      title: 'Mã SDDV',
      dataIndex: 'maSDDV',
      key: 'maSDDV',
      sorter: (a, b) => a.maSDDV - b.maSDDV,
      width: 100,
    },
    {
      title: 'Khách hàng',
      key: 'khachHang',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.khachHang?.tenKH || `KH-${record.maKH}`}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.khachHang?.email || ''}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.khachHang?.phone || ''}
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Dịch vụ',
      key: 'dichVu',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.dichVu?.ten || `DV-${record.maDV}`}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Giá: {record.dichVu?.gia?.toLocaleString('vi-VN') || 0} VNĐ
          </div>
        </div>
      ),
      width: 150,
    },
    {
      title: 'Ngày sử dụng',
      dataIndex: 'ngaySD',
      key: 'ngaySD',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.ngaySD).unix() - dayjs(b.ngaySD).unix(),
      width: 120,
    },
    {
      title: 'Số lượng',
      dataIndex: 'soLuong',
      key: 'soLuong',
      sorter: (a, b) => a.soLuong - b.soLuong,
      width: 100,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'thanhTien',
      key: 'thanhTien',
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.thanhTien - b.thanhTien,
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (status: string) => getStatusTag(status),
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bạn có chắc chắn muốn xóa bản ghi sử dụng dịch vụ này?',
                onOk: () => handleDelete(record),
              });
            }}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
      width: 120,
      fixed: 'right',
    },
  ];

  // Handle save service usage
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const serviceUsageData = {
        maKH: values.maKH,
        maDV: values.maDV,
        ngaySD: values.ngaySD,
        soLuong: values.soLuong,
        thanhTien: values.thanhTien,
        trangThai: values.trangThai,
      };

      if (editingUsage) {
        // Update existing service usage
        const response = await serviceApi.updateServiceUsage(editingUsage.maSDDV, serviceUsageData);
        if (response.success) {
          message.success('Cập nhật sử dụng dịch vụ thành công');
        } else {
          throw new Error(response.message);
        }
      } else {
        // Create new service usage
        const response = await serviceApi.createServiceUsage(serviceUsageData);
        if (response.success) {
          message.success('Thêm sử dụng dịch vụ mới thành công');
        } else {
          throw new Error(response.message);
        }
      }

      setIsModalVisible(false);
      fetchServiceUsages(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || "Không thể lưu sử dụng dịch vụ. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div className={styles.serviceUsageContainer}>
      <h2>Quản lý sử dụng dịch vụ</h2>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div>Tổng số bản ghi: {pagination.total}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Đã hoàn thành (trang hiện tại): {serviceUsages.filter(u => u.trangThai === 'Hoàn thành').length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Đang sử dụng (trang hiện tại): {serviceUsages.filter(u => u.trangThai === 'Đang sử dụng').length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Tổng doanh thu (trang hiện tại): {serviceUsages.reduce((sum, u) => sum + u.thanhTien, 0).toLocaleString('vi-VN')} VNĐ</div>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Controls */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm kiếm theo khách hàng, dịch vụ, trạng thái"
            style={{ width: 300 }}
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            onChange={handleStatusFilterChange}
            allowClear
          >
            <Option value="Đã đặt">Đã đặt</Option>
            <Option value="Đang sử dụng">Đang sử dụng</Option>
            <Option value="Hoàn thành">Hoàn thành</Option>
            <Option value="Đã hủy">Đã hủy</Option>
          </Select>
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
          />
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm sử dụng dịch vụ
          </Button>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Service Usage Table */}
      <Table
        columns={columns}
        dataSource={filteredServiceUsages}
        rowKey="maSDDV"
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          onShowSizeChange: handleTableChange,
        }}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      {/* Add/Edit Service Usage Modal */}
      <Modal
        title={editingUsage ? 'Cập nhật sử dụng dịch vụ' : 'Thêm sử dụng dịch vụ mới'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText={editingUsage ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="serviceUsageForm"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maKH"
                label="Khách hàng"
                rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
              >
                <Select
                  placeholder="Chọn khách hàng"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
                  }
                >
                  {customers.map(customer => (
                    <Option key={customer.maKH} value={customer.maKH}>
                      {customer.tenKH} - {customer.email}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maDV"
                label="Dịch vụ"
                rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
              >
                <Select
                  placeholder="Chọn dịch vụ"
                  onChange={handleServiceChange}
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
                  }
                >
                  {services.map(service => (
                    <Option key={service.maDichVu} value={service.maDichVu}>
                      {service.ten} - {service.gia.toLocaleString('vi-VN')} VNĐ
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ngaySD"
                label="Ngày sử dụng"
                rules={[{ required: true, message: 'Vui lòng chọn ngày sử dụng' }]}
              >
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  min={dayjs().format('YYYY-MM-DD')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="soLuong"
                label="Số lượng"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng"
                  onChange={handleQuantityChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="thanhTien"
                label="Thành tiền (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập thành tiền' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Thành tiền sẽ được tự động tính"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  readOnly
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trangThai"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="Đã đặt">Đã đặt</Option>
                  <Option value="Đang sử dụng">Đang sử dụng</Option>
                  <Option value="Hoàn thành">Hoàn thành</Option>
                  <Option value="Đã hủy">Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceUsageManagement;
