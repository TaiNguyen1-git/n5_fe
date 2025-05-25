import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Card, Row, Col, message, Form, InputNumber, Upload, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { DichVu, serviceApi, PaginatedResponse, ApiResponse } from '../../../services/serviceApi';
import type { UploadProps, UploadFile } from 'antd/es/upload/interface';

const { Option } = Select;
const { TextArea } = Input;

// Interface định nghĩa cấu trúc dữ liệu dịch vụ
interface Service {
  maDichVu: number;
  ten: string;
  gia: number;
  moTa: string;
  hinhAnh: string;
  trangThai: number;
}

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} dịch vụ`,
  });

  useEffect(() => {
    fetchServices(pagination.current, pagination.pageSize);
  }, []);

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPagination = {
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    fetchServices(page, pageSize || pagination.pageSize);
  };

  // Fetch dịch vụ từ API với phân trang
  const fetchServices = async (pageNumber: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      console.log(`Fetching services with pagination: page ${pageNumber}, size ${pageSize}`);

      const response = await serviceApi.getAllServices(pageNumber, pageSize);

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<DichVu>;

        // Chuyển đổi dữ liệu từ API sang định dạng Service
        const formattedData: Service[] = paginatedData.items.map((item: any) => ({
          maDichVu: item.maDichVu,
          ten: item.ten,
          gia: item.gia || 0,
          moTa: item.moTa || '',
          hinhAnh: item.hinhAnh || '',
          trangThai: item.trangThai || 0
        }));

        setServices(formattedData);
        setPagination(prev => ({
          ...prev,
          current: paginatedData.pageNumber,
          pageSize: paginatedData.pageSize,
          total: paginatedData.totalItems,
        }));

        console.log('Services loaded successfully with pagination:', formattedData.length);
        message.success('Tải dữ liệu dịch vụ thành công');
      } else {
        throw new Error(response.message || 'Failed to fetch services');
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      message.error("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.");

      // Fallback: try to get services without pagination
      try {
        const fallbackData = await serviceApi.getAllServicesNoPagination();
        const formattedData: Service[] = fallbackData.map((item: any) => ({
          maDichVu: item.maDichVu,
          ten: item.ten,
          gia: item.gia || 0,
          moTa: item.moTa || '',
          hinhAnh: item.hinhAnh || '',
          trangThai: item.trangThai || 0
        }));
        setServices(formattedData);
        setPagination(prev => ({
          ...prev,
          total: formattedData.length,
        }));
        message.warning('Đã tải dữ liệu dịch vụ với phương thức dự phòng');
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Xử lý lọc theo trạng thái
  const handleStatusFilterChange = (value: number | null) => {
    setStatusFilter(value);
  };

  // Làm mới dữ liệu
  const handleRefresh = () => {
    fetchServices(pagination.current, pagination.pageSize);
    message.info('Đang làm mới dữ liệu...');
  };

  // Lọc danh sách dịch vụ
  const filteredServices = services.filter(service => {
    const matchesSearch =
      (service.ten && service.ten.toLowerCase().includes(searchText.toLowerCase())) ||
      (service.moTa && service.moTa.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = statusFilter !== null ? service.trangThai === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Định nghĩa các cột cho bảng dịch vụ
  const columns: ColumnsType<Service> = [
    {
      title: 'Mã DV',
      dataIndex: 'maDichVu',
      key: 'maDichVu',
      sorter: (a, b) => a.maDichVu - b.maDichVu,
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'ten',
      key: 'ten',
      sorter: (a, b) => a.ten.localeCompare(b.ten),
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'gia',
      key: 'gia',
      render: (gia: number) => gia.toLocaleString('vi-VN'),
      sorter: (a, b) => a.gia - b.gia,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      key: 'moTa',
      ellipsis: true,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'hinhAnh',
      key: 'hinhAnh',
      render: (hinhAnh: string) => (
        hinhAnh ? <img src={hinhAnh} alt="Dịch vụ" style={{ width: '50px', height: '50px', objectFit: 'cover' }} /> : 'Không có hình'
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai: number) => {
        let color = trangThai === 1 ? 'green' : 'red';
        let text = trangThai === 1 ? 'Khả dụng' : 'Tạm ngưng';
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Khả dụng', value: 1 },
        { text: 'Tạm ngưng', value: 0 },
      ],
      onFilter: (value, record) => record.trangThai === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Xử lý sửa dịch vụ
  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      ten: service.ten,
      gia: service.gia,
      moTa: service.moTa,
      hinhAnh: service.hinhAnh,
      trangThai: service.trangThai,
    });
    setImageUrl(service.hinhAnh);
    setIsModalVisible(true);
  };

  // Xử lý xóa dịch vụ
  const handleDelete = async (service: Service) => {
    try {
      await serviceApi.deleteService(service.maDichVu);
      message.success('Xóa dịch vụ thành công');
      fetchServices(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Lỗi khi xóa dịch vụ:", error);
      message.error("Không thể xóa dịch vụ. Vui lòng thử lại sau.");
    }
  };

  // Xử lý thêm dịch vụ mới
  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setImageUrl('');
    setFileList([]);
    setIsModalVisible(true);
  };

  // Xử lý upload hình ảnh
  const handleUpload: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      setUploadLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      // Lấy URL từ response
      const imageUrl = info.file.response?.url || '';
      setImageUrl(imageUrl);
      form.setFieldsValue({ hinhAnh: imageUrl });
      setUploadLoading(false);
      message.success(`${info.file.name} đã được tải lên thành công`);
    } else if (info.file.status === 'error') {
      setUploadLoading(false);
      message.error(`${info.file.name} tải lên thất bại.`);
    }
  };

  // Xử lý lưu dịch vụ
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const serviceData: DichVu = {
        ten: values.ten,
        gia: values.gia,
        moTa: values.moTa,
        hinhAnh: values.hinhAnh || imageUrl,
        trangThai: values.trangThai,
      };

      if (editingService) {
        // Cập nhật dịch vụ hiện có
        await serviceApi.updateService(editingService.maDichVu, serviceData);
        message.success('Cập nhật dịch vụ thành công');
      } else {
        // Thêm dịch vụ mới
        await serviceApi.createService(serviceData);
        message.success('Thêm dịch vụ mới thành công');
      }

      setIsModalVisible(false);
      fetchServices(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Lỗi khi lưu dịch vụ:", error);
      message.error("Không thể lưu dịch vụ. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Quản lý dịch vụ</h2>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm dịch vụ
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

      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div>Tổng số dịch vụ: {pagination.total}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Dịch vụ khả dụng (trang hiện tại): {services.filter(s => s.trangThai === 1).length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Dịch vụ tạm ngưng (trang hiện tại): {services.filter(s => s.trangThai === 0).length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>Trang hiện tại: {pagination.current}/{Math.ceil(pagination.total / pagination.pageSize)}</div>
          </Card>
        </Col>
      </Row>

      {/* Tìm kiếm và lọc */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="Tìm kiếm dịch vụ theo tên, mô tả"
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
          <Option value={1}>Khả dụng</Option>
          <Option value={0}>Tạm ngưng</Option>
        </Select>
      </div>

      {/* Bảng dịch vụ */}
      <Table
        columns={columns}
        dataSource={filteredServices}
        rowKey="maDichVu"
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          onShowSizeChange: handleTableChange,
        }}
        loading={loading}
      />

      {/* Modal thêm/sửa dịch vụ */}
      <Modal
        title={editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText={editingService ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="serviceForm"
        >
          <Form.Item
            name="ten"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Form.Item
            name="gia"
            label="Giá dịch vụ (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ' }]}
          >
            <InputNumber
              placeholder="Nhập giá dịch vụ"
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="moTa"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả dịch vụ' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết dịch vụ" />
          </Form.Item>

          <Form.Item
            label="Hình ảnh"
            extra="Nhập URL hoặc tải lên từ máy tính"
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item
                name="hinhAnh"
                noStyle
              >
                <Input style={{ flex: 1 }} placeholder="URL hình ảnh" onChange={(e) => setImageUrl(e.target.value)} />
              </Form.Item>
              <Upload
                name="file"
                action="/api/upload"
                showUploadList={false}
                fileList={fileList}
                onChange={handleUpload}
                beforeUpload={(file) => {
                  // Kiểm tra kích thước file (tối đa 5MB)
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Hình ảnh phải nhỏ hơn 5MB!');
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadLoading}>
                  Tải lên
                </Button>
              </Upload>
            </div>
          </Form.Item>

          {imageUrl && (
            <div style={{ marginBottom: '16px' }}>
              <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </div>
          )}

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            initialValue={1}
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value={1}>Khả dụng</Option>
              <Option value={0}>Tạm ngưng</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceManagement;
