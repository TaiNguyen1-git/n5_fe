import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Typography, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch danh sách người dùng khi component được mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Hàm load danh sách người dùng từ API
  const loadUsers = async () => {
    try {
      // Trong thực tế, bạn sẽ gọi API để lấy danh sách người dùng
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        message.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Đã xảy ra lỗi khi tải danh sách người dùng');
      // Khởi tạo mảng rỗng nếu có lỗi
      setUsers([]);
    }
  };

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<any> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
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
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Xử lý chỉnh sửa người dùng
  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa người dùng
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa người dùng',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          // Trong thực tế, bạn sẽ gọi API để xóa người dùng
          const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            // Xóa người dùng khỏi state
            setUsers(users.filter(user => user.id !== id));
            message.success('Đã xóa người dùng thành công');
          } else {
            message.error('Không thể xóa người dùng');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          message.error('Đã xảy ra lỗi khi xóa người dùng');
        }
      }
    });
  };

  // Xử lý lưu thông tin người dùng
  const handleSave = () => {
    form.validateFields().then(async values => {
      try {
        // Trong thực tế, bạn sẽ gọi API để cập nhật thông tin người dùng
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            phone: values.phone,
            status: values.status
          }),
        });

        if (response.ok) {
          // Cập nhật trên UI
          setUsers(users.map(user =>
            user.id === editingUser.id
              ? { ...user, ...values }
              : user
          ));

          setIsModalVisible(false);
          message.success('Cập nhật người dùng thành công');
        } else {
          message.error('Không thể cập nhật thông tin người dùng');
        }
      } catch (error) {
        console.error('Error updating user:', error);
        message.error('Đã xảy ra lỗi khi cập nhật thông tin người dùng');
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Quản lý người dùng</Title>
        <Button onClick={loadUsers} type="primary">Làm mới</Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        bordered
      />

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            Cập nhật
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
