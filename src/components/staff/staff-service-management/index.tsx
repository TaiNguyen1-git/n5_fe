import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import styles from './styles.module.css';
import { DichVu } from '../../../services/serviceApi';
import { mockServiceApi as serviceApi } from '../../../services/mockServiceApi';
import type { ColumnProps } from 'antd/es/table';

// Cập nhật interface Service để phù hợp với API từ backend
interface Service {
  maDichVu: number;
  ten: string;
  gia: number;
  moTa: string;
  hinhAnh: string;
  trangThai: number;
}

const StaffServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  // Fetch dữ liệu dịch vụ khi component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Hàm để lấy dữ liệu dịch vụ từ API
  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getAllServices();
      // Chuyển đổi dữ liệu từ API sang định dạng Service
      const formattedData: Service[] = data.map((item: any) => ({
        maDichVu: item.maDichVu,
        ten: item.ten,
        gia: item.gia || 0,
        moTa: item.moTa || '',
        hinhAnh: item.hinhAnh || '',
        trangThai: item.trangThai || 0
      }));
      setServices(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dịch vụ:", error);
      message.error("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // Định nghĩa columns cho bảng với ColumnProps chính xác
  const columns: ColumnProps<Service>[] = [
    {
      title: 'ID',
      dataIndex: 'maDichVu',
      key: 'maDichVu',
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'ten',
      key: 'ten',
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'gia',
      key: 'gia',
      render: (gia: number) => gia.toLocaleString('vi-VN'),
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
      render: (trangThai: number) => (
        <span className={trangThai === 1 ? styles.statusAvailable : styles.statusUnavailable}>
          {trangThai === 1 ? 'Khả dụng' : 'Tạm ngưng'}
        </span>
      ),
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
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record.maDichVu)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await serviceApi.deleteService(id);
      message.success('Xóa dịch vụ thành công');
      fetchServices(); // Làm mới danh sách sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa dịch vụ:", error);
      message.error("Không thể xóa dịch vụ. Vui lòng thử lại sau.");
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const serviceData: DichVu = {
        ten: values.ten,
        gia: values.gia,
        moTa: values.moTa,
        hinhAnh: values.hinhAnh || '',
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
      
      setModalVisible(false);
      fetchServices(); // Làm mới danh sách sau khi thêm/cập nhật
    } catch (error) {
      console.error("Lỗi khi lưu dịch vụ:", error);
      message.error("Không thể lưu dịch vụ. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div className={styles.serviceManagement}>
      <div className={styles.header}>
        <h2>Quản lý dịch vụ</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Thêm dịch vụ mới
        </Button>
      </div>

      <Card className={styles.serviceTable}>
        <Table 
          columns={columns} 
          dataSource={services} 
          rowKey="maDichVu"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingService ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
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
            <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết dịch vụ" />
          </Form.Item>

          <Form.Item
            name="hinhAnh"
            label="Đường dẫn hình ảnh"
            rules={[{ required: false }]}
          >
            <Input placeholder="Nhập đường dẫn hình ảnh" />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={1}>Khả dụng</Select.Option>
              <Select.Option value={0}>Tạm ngưng</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffServiceManagement; 