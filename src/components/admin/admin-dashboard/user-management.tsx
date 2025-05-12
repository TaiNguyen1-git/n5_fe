import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Typography, Avatar, Card, Row, Col, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import userService, { User, PaginatedResponse } from '@/services/userService';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Thêm state mới để quản lý modal xác nhận xóa
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string>('');

  // Fetch danh sách người dùng khi component được mount hoặc khi pagination thay đổi
  useEffect(() => {
    loadUsers(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  // Hàm load danh sách người dùng từ API với phân trang
  const loadUsers = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      console.log(`Loading users with page=${page}, pageSize=${pageSize}`);

      // Hiển thị thông báo đang tải
      const loadingMessage = message.loading('Đang tải danh sách người dùng...', 0);

      // Tạo dữ liệu mẫu trong trường hợp API không hoạt động
      const sampleUsers: User[] = [
        {
          maTK: 1,
          tenTK: 'admin',
          tenHienThi: 'Administrator',
          email: 'admin@example.com',
          phone: '0123456789',
          isVerified: true,
          createAt: new Date().toISOString()
        },
        {
          maTK: 2,
          tenTK: 'user1',
          tenHienThi: 'Người dùng 1',
          email: 'user1@example.com',
          phone: '0987654321',
          isVerified: true,
          createAt: new Date().toISOString()
        },
        {
          maTK: 3,
          tenTK: 'user2',
          tenHienThi: 'Người dùng 2',
          email: 'user2@example.com',
          phone: '0123498765',
          isVerified: false,
          createAt: new Date().toISOString()
        }
      ];

      try {
        // Sử dụng fetch thay vì axios để thử một cách tiếp cận khác
        const fetchResponse = await fetch(`/api/users?pageNumber=${page}&pageSize=${pageSize}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }

        const response = await fetchResponse.json();
        console.log('API response:', response);

        // Đóng thông báo đang tải
        loadingMessage();

        if (response && response.data && response.data.items && response.data.items.length > 0) {
          setUsers(response.data.items);
          setPagination({
            ...pagination,
            current: response.data.pageNumber,
            total: response.data.totalItems
          });
          message.success('Tải danh sách người dùng thành công');
        } else {
          console.warn('API returned empty data, using sample data');
          message.warning('API trả về dữ liệu trống, sử dụng dữ liệu mẫu');
          setUsers(sampleUsers);
          setPagination({
            ...pagination,
            current: 1,
            total: sampleUsers.length
          });
        }
      } catch (error) {
        // Đóng thông báo đang tải
        loadingMessage();

        console.error('Error loading users:', error);
        message.error('Không thể kết nối đến máy chủ. Hiển thị dữ liệu mẫu.');

        // Sử dụng dữ liệu mẫu khi có lỗi
        setUsers(sampleUsers);
        setPagination({
          ...pagination,
          current: 1,
          total: sampleUsers.length
        });
      }
    } catch (error) {
      console.error('Unexpected error in loadUsers:', error);
      message.error('Đã xảy ra lỗi không mong muốn khi tải dữ liệu');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi phân trang
  const handleTableChange = (pagination: any) => {
    setPagination({
      ...pagination,
      current: pagination.current
    });
  };

  // Tính toán thống kê
  const totalUsers = users.length;
  const verifiedUsers = users.filter(user => user.isVerified).length;
  const unverifiedUsers = totalUsers - verifiedUsers;

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.imgAvt}
            icon={!record.imgAvt && <UserOutlined />}
          />
          <span>{record.tenHienThi || 'Không có tên'}</span>
        </Space>
      ),
    },
    {
      title: 'Tên tài khoản',
      dataIndex: 'tenTK',
      key: 'tenTK',
      sorter: (a, b) => (a.tenTK || '').localeCompare(b.tenTK || ''),
      render: (text) => text || 'Không có tên tài khoản',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || 'Không có email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || 'Không có số điện thoại',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified) => (
        <span style={{ color: isVerified ? 'green' : 'red' }}>
          {isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
        </span>
      ),
      filters: [
        { text: 'Đã xác thực', value: true },
        { text: 'Chưa xác thực', value: false },
      ],
      onFilter: (value, record) => record.isVerified === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'Không có dữ liệu',
      sorter: (a, b) => {
        if (!a.createAt) return -1;
        if (!b.createAt) return 1;
        return new Date(a.createAt).getTime() - new Date(b.createAt).getTime();
      },
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
            onClick={() => handleDelete(record.tenTK)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Xử lý chỉnh sửa người dùng
  const handleEdit = (user: User) => {
    console.log('Editing user:', user);
    setEditingUser(user);
    form.setFieldsValue({
      tenTK: user.tenTK,
      tenHienThi: user.tenHienThi,
      email: user.email,
      phone: user.phone,
      matKhau: '', // Không hiển thị mật khẩu cũ
      isVerified: user.isVerified
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa người dùng
  const handleDelete = (tenTK?: string) => {
    if (!tenTK) {
      message.error('Không thể xóa người dùng: Tên tài khoản không hợp lệ');
      return;
    }
    
    // Tìm người dùng với tenTK này để xem có tồn tại không
    const userInfo = users.find(u => u.tenTK === tenTK);
    
    // Lưu tenTK và hiển thị modal xác nhận
    setUserToDelete(tenTK);
    setDeleteModalVisible(true);
  };

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    const tenTK = userToDelete;
    
    // Hiển thị thông báo đang xử lý
    const loadingMessage = message.loading('Đang xóa người dùng...', 0);

    try {
      // Phương pháp đơn giản: gọi API trực tiếp để xóa
      const response = await fetch(`/api/direct-delete?TenTK=${encodeURIComponent(tenTK)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Phân tích phản hồi
      const responseText = await response.text();
      
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        result = { success: false, message: 'Lỗi khi phân tích dữ liệu JSON' };
      }

      // Đóng thông báo đang xử lý
      loadingMessage();

      // Đóng modal xác nhận
      setDeleteModalVisible(false);

      // Kiểm tra kết quả xóa từ API
      if (response.ok && result && result.success) {
        // Xóa thành công, cập nhật UI
        message.success('Đã xóa người dùng thành công');
        // Cập nhật UI sau khi xóa thành công
        setUsers(users.filter(user => user.tenTK !== tenTK));
        
        // Làm mới danh sách để đảm bảo dữ liệu đồng bộ
        loadUsers(pagination.current, pagination.pageSize);
      } else {
        // Xóa không thành công
        throw new Error(result?.message || response.statusText || 'Không thể xóa người dùng');
      }
    } catch (error) {
      // Đóng thông báo đang xử lý
      loadingMessage();

      // Hiển thị thông báo lỗi chi tiết hơn
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else if (error.response) {
          // Lỗi từ server
          message.error(`Lỗi từ máy chủ: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
        } else {
          message.error(`Lỗi kết nối: ${error.message}`);
        }
      } else {
        message.error(`Không thể xóa người dùng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      }
      
      // Làm mới danh sách để đảm bảo dữ liệu đồng bộ
      loadUsers(pagination.current, pagination.pageSize);
    }
  };

  // Hủy xóa
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
  };

  // Xử lý thêm người dùng mới
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      isVerified: true // Mặc định là đã xác thực
    });
    setIsModalVisible(true);
  };

  // Xử lý lưu thông tin người dùng
  const handleSave = () => {
    form.validateFields().then(async values => {
      try {
        console.log('Form values:', values);

        if (editingUser) {
          // Cập nhật người dùng hiện có
          const userData: Partial<User> = {
            maTK: editingUser.maTK,
            tenTK: values.tenTK,
            tenHienThi: values.tenHienThi,
            email: values.email,
            phone: values.phone,
            isVerified: values.isVerified
          };

          // Chỉ thêm mật khẩu nếu người dùng nhập mật khẩu mới
          if (values.matKhau) {
            userData.matKhau = values.matKhau;
          }

          console.log('Updating user with data:', userData);

          // Gọi API cập nhật người dùng
          await userService.updateUser(editingUser.maTK!, userData);

          // Cập nhật UI
          setUsers(users.map(user =>
            user.maTK === editingUser.maTK
              ? { ...user, ...userData }
              : user
          ));

          message.success('Cập nhật người dùng thành công');
        } else {
          // Tạo người dùng mới
          const userData = {
            tenTK: values.tenTK,
            tenHienThi: values.tenHienThi,
            matKhau: values.matKhau,
            email: values.email,
            phone: values.phone,
            isVerified: values.isVerified
          };

          console.log('Creating new user with data:', userData);

          // Gọi API tạo người dùng mới
          const response = await userService.createUser(userData);
          console.log('API response after create:', response);

          // Thêm người dùng mới vào danh sách
          if (response && response.success) {
            const newUser = {
              ...userData,
              maTK: response.data?.maTK || Date.now(),
              createAt: new Date().toISOString()
            };

            setUsers([...users, newUser]);
            message.success('Thêm người dùng mới thành công');
          } else {
            message.error(response?.message || 'Không thể tạo người dùng mới');
          }
        }

        // Đóng modal và làm mới danh sách
        setIsModalVisible(false);
        loadUsers(pagination.current, pagination.pageSize);
      } catch (error) {
        console.error('Error saving user:', error);
        message.error('Không thể lưu thông tin người dùng. Vui lòng thử lại sau.');
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Quản lý người dùng</h2>
        <p>Xem và quản lý tất cả người dùng trong hệ thống</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đã xác thực"
              value={verifiedUsers}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Chưa xác thực"
              value={unverifiedUsers}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Danh sách người dùng</Title>
        <Space>
          <Button onClick={() => loadUsers(pagination.current, pagination.pageSize)} type="default">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={handleAdd}
          >
            Thêm người dùng
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.maTK?.toString() || Math.random().toString()}
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Tổng ${total} người dùng`
        }}
        onChange={handleTableChange}
      />

      {/* Modal xác nhận xóa người dùng */}
      <Modal
        title="Xác nhận xóa người dùng"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa người dùng "{userToDelete}" không?</p>
      </Modal>

      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {editingUser ? "Cập nhật" : "Thêm"}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenTK"
            label="Tên tài khoản"
            rules={[
              { required: true, message: 'Vui lòng nhập tên tài khoản' },
              { min: 3, message: 'Tên tài khoản phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tên tài khoản" />
          </Form.Item>

          <Form.Item
            name="tenHienThi"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
          >
            <Input placeholder="Nhập tên hiển thị" />
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
            name="matKhau"
            label="Mật khẩu"
            rules={[
              {
                required: !editingUser,
                message: 'Vui lòng nhập mật khẩu'
              },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
              }
            ]}
          >
            <Input.Password
              placeholder={editingUser ? "Nhập mật khẩu mới (để trống nếu không đổi)" : "Nhập mật khẩu"}
            />
          </Form.Item>

          <Form.Item
            name="isVerified"
            label="Trạng thái xác thực"
            initialValue={true}
          >
            <Select placeholder="Chọn trạng thái xác thực">
              <Option value={true}>Đã xác thực</Option>
              <Option value={false}>Chưa xác thực</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
