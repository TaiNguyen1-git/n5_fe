import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Select, Form, Card, Statistic, Row, Col, DatePicker, Switch, message, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import { discountAPI, getDiscountErrorMessage } from '../../../utils/discountApiUtils';

const { Option } = Select;
const { RangePicker } = DatePicker;
const BASE_URL = '/api';

interface Discount {
  id: number;
  tenMa: string | null;
  loaiGiam: string | null;
  giaTri: number | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: boolean;
  hoaDons: any;
}

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validityFilter, setValidityFilter] = useState<string>('all');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    invalid: 0,
    expiringSoon: 0
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [discounts]);

  const fetchDiscounts = async (showSuccessMessage = false) => {
    setLoading(true);
    try {
      const response = await discountAPI.getAll();

      let discountsData = [];

      // Xử lý nhiều cấu trúc response khác nhau
      if (response.data?.success && response.data?.data?.items) {
        discountsData = response.data.data.items;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        discountsData = response.data.items;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        discountsData = response.data.value;
      } else if (Array.isArray(response.data)) {
        discountsData = response.data;
      }

      setDiscounts(discountsData);

      if (showSuccessMessage) {
        message.success('Đã tải danh sách mã giảm giá');
      }
    } catch (error: any) {
      console.error('Error fetching discounts:', error);

      const errorMessage = getDiscountErrorMessage(error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: discounts.length,
      active: 0,
      expired: 0,
      invalid: 0,
      expiringSoon: 0
    };

    discounts.forEach(discount => {
      // Check if discount is valid
      const isValid = discount.tenMa && discount.tenMa !== 'string' && 
                     discount.giaTri && discount.giaTri > 0;
      
      if (!isValid) {
        newStats.invalid++;
        return;
      }

      // Check if active
      if (discount.trangThai) {
        const endDate = new Date(discount.ngayKetThuc);
        
        if (endDate < now) {
          newStats.expired++;
        } else {
          newStats.active++;
          
          // Check if expiring soon
          if (endDate <= sevenDaysFromNow) {
            newStats.expiringSoon++;
          }
        }
      }
    });

    setStats(newStats);
  };

  const getDiscountStatus = (discount: Discount) => {
    const now = new Date();
    const endDate = new Date(discount.ngayKetThuc);
    const isValid = discount.tenMa && discount.tenMa !== 'string' && 
                   discount.giaTri && discount.giaTri > 0;

    if (!isValid) {
      return { status: 'invalid', color: 'red', text: 'Dữ liệu không hợp lệ' };
    }

    if (!discount.trangThai) {
      return { status: 'inactive', color: 'default', text: 'Tạm dừng' };
    }

    if (endDate < now) {
      return { status: 'expired', color: 'red', text: 'Đã hết hạn' };
    }

    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (endDate <= sevenDaysFromNow) {
      return { status: 'expiring', color: 'orange', text: 'Sắp hết hạn' };
    }

    return { status: 'active', color: 'green', text: 'Đang hoạt động' };
  };

  const handleAdd = () => {
    setEditingDiscount(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    form.setFieldsValue({
      tenMa: discount.tenMa,
      loaiGiam: discount.loaiGiam,
      giaTri: discount.giaTri,
      ngayBatDau: discount.ngayBatDau ? dayjs(discount.ngayBatDau) : null,
      ngayKetThuc: discount.ngayKetThuc ? dayjs(discount.ngayKetThuc) : null,
      trangThai: discount.trangThai
    });
    setIsModalVisible(true);
  };

  const handleToggleStatus = async (discount: Discount) => {
    setLoading(true);

    try {
      // Sử dụng utility function với retry logic
      const response = await discountAPI.toggleStatus(discount);

      if (response.data?.success !== false) {
        message.success(`Đã ${!discount.trangThai ? 'kích hoạt' : 'tạm dừng'} mã giảm giá`);

        // Cập nhật state local trước để UI phản hồi nhanh hơn
        setDiscounts(prev => prev.map(d =>
          d.id === discount.id ? { ...d, trangThai: !d.trangThai } : d
        ));

        // Fetch lại data sau một khoảng thời gian ngắn để đảm bảo đồng bộ
        setTimeout(() => {
          fetchDiscounts();
        }, 300);
      } else {
        throw new Error(response.data?.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      console.error('Error toggling discount status:', error);

      const errorMessage = getDiscountErrorMessage(error);
      message.error(errorMessage);

      // Khôi phục trạng thái ban đầu nếu có lỗi
      setDiscounts(prev => prev.map(d =>
        d.id === discount.id ? { ...d, trangThai: discount.trangThai } : d
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        tenMa: values.tenMa?.trim(),
        loaiGiam: values.loaiGiam,
        giaTri: Number(values.giaTri), // Ensure giaTri is a number
        ngayBatDau: values.ngayBatDau?.toISOString(),
        ngayKetThuc: values.ngayKetThuc?.toISOString(),
        trangThai: values.trangThai !== undefined ? values.trangThai : true
      };

      if (editingDiscount) {
        // Update existing discount
        const updateData = { id: editingDiscount.id, ...submitData };
        await discountAPI.update(editingDiscount.id, updateData);
        message.success('Đã cập nhật mã giảm giá');
      } else {
        // Create new discount
        await discountAPI.create(submitData);
        message.success('Đã tạo mã giảm giá mới');
      }

      setIsModalVisible(false);
      fetchDiscounts();
    } catch (error: any) {
      const errorMessage = getDiscountErrorMessage(error);
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await discountAPI.delete(id);
      message.success('Đã xóa mã giảm giá');
      fetchDiscounts();
    } catch (error: any) {
      const errorMessage = getDiscountErrorMessage(error);
      message.error(`Lỗi xóa: ${errorMessage}`);
    }
  };

  const columns: ColumnsType<Discount> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Tên mã',
      dataIndex: 'tenMa',
      key: 'tenMa',
      render: (text: string | null) => (
        text && text !== 'string' ? text : 
        <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>Chưa đặt tên</span>
      ),
    },
    {
      title: 'Loại giảm',
      dataIndex: 'loaiGiam',
      key: 'loaiGiam',
      render: (text: string | null) => (
        text && text !== 'string' ? text : 
        <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>Chưa xác định</span>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'giaTri',
      key: 'giaTri',
      render: (value: number | null) => (
        value && value > 0 ? 
        `${value.toLocaleString('vi-VN')} VNĐ` : 
        <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>Chưa có giá trị</span>
      ),
    },
    {
      title: 'Thời gian',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div>Từ: {dayjs(record.ngayBatDau).format('DD/MM/YYYY')}</div>
          <div>Đến: {dayjs(record.ngayKetThuc).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const status = getDiscountStatus(record);
        return (
          <div>
            <Tag color={status.color}>{status.text}</Tag>
            <div style={{ marginTop: 4 }}>
              <Switch
                size="small"
                checked={record.trangThai}
                onChange={() => handleToggleStatus(record)}
                checkedChildren="ON"
                unCheckedChildren="OFF"
                loading={loading}
                data-discount-id={record.id}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter discounts based on search and filters
  const filteredDiscounts = discounts.filter(discount => {
    // Search filter
    const matchesSearch = !searchText || 
      (discount.tenMa && discount.tenMa.toLowerCase().includes(searchText.toLowerCase())) ||
      (discount.loaiGiam && discount.loaiGiam.toLowerCase().includes(searchText.toLowerCase()));

    // Status filter
    const status = getDiscountStatus(discount);
    const matchesStatus = statusFilter === 'all' || status.status === statusFilter;

    // Validity filter
    const isValid = discount.tenMa && discount.tenMa !== 'string' && 
                   discount.giaTri && discount.giaTri > 0;
    const matchesValidity = validityFilter === 'all' || 
      (validityFilter === 'valid' && isValid) ||
      (validityFilter === 'invalid' && !isValid);

    return matchesSearch && matchesStatus && matchesValidity;
  });

  return (
    <div>
      <h2>Quản lý mã giảm giá</h2>
      
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Tổng số mã"
              value={stats.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Đã hết hạn"
              value={stats.expired}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Sắp hết hạn"
              value={stats.expiringSoon}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Dữ liệu lỗi"
              value={stats.invalid}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Bar */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Input.Search
            placeholder="Tìm kiếm mã giảm giá..."
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">Tất cả</Option>
            <Option value="active">Đang hoạt động</Option>
            <Option value="expiring">Sắp hết hạn</Option>
            <Option value="expired">Đã hết hạn</Option>
            <Option value="inactive">Tạm dừng</Option>
            <Option value="invalid">Dữ liệu lỗi</Option>
          </Select>
          <Select
            placeholder="Lọc theo tính hợp lệ"
            style={{ width: 150 }}
            value={validityFilter}
            onChange={setValidityFilter}
          >
            <Option value="all">Tất cả</Option>
            <Option value="valid">Hợp lệ</Option>
            <Option value="invalid">Có vấn đề</Option>
          </Select>
        </Space>
        
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchDiscounts(true)}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm mã giảm giá
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredDiscounts}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mã`,
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingDiscount ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText={editingDiscount ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tenMa"
                label="Tên mã giảm giá"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên mã' },
                  { min: 3, message: 'Tên mã phải có ít nhất 3 ký tự' },
                  { max: 50, message: 'Tên mã không được quá 50 ký tự' }
                ]}
              >
                <Input placeholder="VD: SUMMER2024" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="loaiGiam"
                label="Loại giảm giá"
                rules={[{ required: true, message: 'Vui lòng nhập loại giảm giá' }]}
              >
                <Select placeholder="Chọn loại giảm giá">
                  <Option value="fixed">Giảm số tiền cố định</Option>
                  <Option value="percent">Giảm theo phần trăm</Option>
                  <Option value="special">Ưu đãi đặc biệt</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="giaTri"
            label="Giá trị giảm (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá trị giảm' },
              {
                validator: (_, value) => {
                  const numValue = Number(value);
                  if (isNaN(numValue) || numValue < 1000) {
                    return Promise.reject(new Error('Giá trị giảm tối thiểu 1,000 VNĐ'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="number" placeholder="Nhập số tiền giảm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ngayBatDau"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ngayKetThuc"
                label="Ngày kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountManagement;
