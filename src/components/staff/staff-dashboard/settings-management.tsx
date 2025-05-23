import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Tabs, Switch, Select, TimePicker, Divider, Row, Col, Upload, message, Avatar, Space, notification, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, UploadOutlined, SaveOutlined, BellOutlined, SettingOutlined, GlobalOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { getUserProfile, updateUserProfile } from '../../../services/userService';
import { getCurrentUser } from '../../../services/authService';

const { TabPane } = Tabs;
const { Option } = Select;

// Định nghĩa cấu trúc dữ liệu người dùng
interface UserData {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar: string | null;
}

// Định nghĩa cấu trúc dữ liệu cài đặt hệ thống
interface SystemSettings {
  language: string;
  theme: string;
  checkInTime: dayjs.Dayjs;
  checkOutTime: dayjs.Dayjs;
  emailNotifications: boolean;
  smsNotifications: boolean;
  desktopNotifications: boolean;
  autoLogout: number;
}

// Khởi tạo dữ liệu mặc định
const defaultUserData: UserData = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  avatar: null,
};

const defaultSystemSettings: SystemSettings = {
  language: 'vi',
  theme: 'light',
  checkInTime: dayjs('14:00', 'HH:mm'),
  checkOutTime: dayjs('12:00', 'HH:mm'),
  emailNotifications: false,
  smsNotifications: false,
  desktopNotifications: false,
  autoLogout: 30,
};

const SettingsManagement = () => {
  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [userData, setUserData] = useState(defaultUserData);
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Lấy thông tin người dùng khi component được tải
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setInitialLoading(true);

        // Thử lấy thông tin từ getCurrentUser trước
        const currentUser = getCurrentUser();
        console.log('Settings - Current user from auth service:', currentUser);

        if (currentUser) {
          // Cập nhật form với dữ liệu cơ bản
          const basicUserData = {
            username: currentUser.username || '',
            fullName: currentUser.fullName || '',
            email: currentUser.email || '',
            phone: '', // Mặc định là chuỗi rỗng vì không có trong User type
            role: currentUser.role || 'staff',
            department: 'reception', // Giá trị mặc định
          };

          setUserData(prev => ({ ...prev, ...basicUserData }));
          userForm.setFieldsValue(basicUserData);
        }

        // Lấy thông tin đầy đủ từ API
        const profileData = await getUserProfile();
        console.log('Settings - User profile from API:', profileData);

        if (profileData) {
          const updatedUserData = {
            username: profileData.username || profileData.tenTK || '',
            fullName: profileData.fullName || profileData.tenHienThi || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            role: profileData.role || 'staff',
            department: 'reception', // Giá trị mặc định, có thể cập nhật nếu API trả về
          };

          setUserData(prev => ({ ...prev, ...updatedUserData }));
          userForm.setFieldsValue(updatedUserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        message.error('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async (values: any) => {
    setLoading(true);

    try {
      // Lấy thông tin người dùng hiện tại
      const currentUser = getCurrentUser();

      if (!currentUser || !currentUser.username) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Lấy tên tài khoản từ thông tin người dùng hiện tại
      const username = currentUser.username || '';

      // Chuẩn bị dữ liệu cập nhật theo đúng cấu trúc API
      const updateData = {
        tenHienThi: values.fullName,
        phone: values.phone,
        email: values.email
      };

      console.log('Settings - Updating user profile with data:', updateData);
      console.log('Settings - Username for update:', username);

      // Gọi API cập nhật thông tin với tham số TenTK
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/User/Update?TenTK=${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Cập nhật state và form
        setUserData({ ...userData, ...values });
        message.success('Cập nhật thông tin thành công!');

        // Làm mới thông tin người dùng
        const updatedProfile = await getUserProfile();
        console.log('Settings - Updated profile:', updatedProfile);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || 'Cập nhật thông tin thất bại');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = (values: any) => {
    setLoading(true);

    // Giả lập API call
    setTimeout(() => {
      setLoading(false);
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    }, 1000);
  };

  // Xử lý cập nhật cài đặt hệ thống
  const handleUpdateSystemSettings = (values: any) => {
    setLoading(true);

    // Giả lập API call
    setTimeout(() => {
      setSystemSettings({ ...systemSettings, ...values });
      setLoading(false);
      message.success('Cập nhật cài đặt hệ thống thành công!');
    }, 1000);
  };

  // Xử lý cập nhật cài đặt thông báo
  const handleUpdateNotificationSettings = (values: any) => {
    setLoading(true);

    // Giả lập API call
    setTimeout(() => {
      setSystemSettings({ ...systemSettings, ...values });
      setLoading(false);
      message.success('Cập nhật cài đặt thông báo thành công!');
    }, 1000);
  };

  // Xử lý upload avatar
  const handleAvatarUpload: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} tải lên thành công`);
      // Trong thực tế, bạn sẽ lấy URL từ response của server
      // setUserData({ ...userData, avatar: info.file.response.url });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} tải lên thất bại.`);
    }
  };

  // Xử lý khôi phục cài đặt mặc định
  const handleResetSettings = () => {
    systemForm.resetFields();
    notificationForm.resetFields();
    message.info('Đã khôi phục cài đặt mặc định');
  };

  // Xử lý gửi thông báo test
  const handleSendTestNotification = () => {
    notification.open({
      message: 'Thông báo test',
      description: 'Đây là thông báo test để kiểm tra cài đặt thông báo của bạn.',
      icon: <BellOutlined style={{ color: '#1890ff' }} />,
    });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h2 style={{ marginBottom: 24 }}>Cài đặt</h2>

      {initialLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      ) : (
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={<span><UserOutlined />Thông tin cá nhân</span>}
            key="1"
          >
          <Row gutter={24}>
            <Col span={8}>
              <Card title="Ảnh đại diện" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    src={userData.avatar}
                    style={{ marginBottom: 16 }}
                  />
                  <Upload
                    onChange={handleAvatarUpload}
                    showUploadList={false}
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76" // Mock API endpoint
                  >
                    <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                  </Upload>
                </div>
              </Card>

              <Card title="Thông tin tài khoản">
                <p><strong>Tên đăng nhập:</strong> {userData.username}</p>
                <p><strong>Vai trò:</strong> {userData.role === 'staff' ? 'Nhân viên' : 'Quản lý'}</p>
                <p><strong>Bộ phận:</strong> {
                  userData.department === 'reception' ? 'Lễ tân' :
                  userData.department === 'housekeeping' ? 'Dọn phòng' :
                  userData.department === 'accounting' ? 'Kế toán' : 'Khác'
                }</p>
              </Card>
            </Col>

            <Col span={16}>
              <Card title="Thông tin cá nhân">
                <Form
                  form={userForm}
                  layout="vertical"
                  initialValues={userData}
                  onFinish={handleUpdateProfile}
                >
                  <Form.Item
                    name="fullName"
                    label="Họ tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Họ tên" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                    >
                      Cập nhật thông tin
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card title="Đổi mật khẩu" style={{ marginTop: 16 }}>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu hiện tại" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<LockOutlined />}
                    >
                      Đổi mật khẩu
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={<span><SettingOutlined />Cài đặt hệ thống</span>}
          key="2"
        >
          <Card title="Cài đặt chung">
            <Form
              form={systemForm}
              layout="vertical"
              initialValues={systemSettings}
              onFinish={handleUpdateSystemSettings}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="language"
                    label="Ngôn ngữ"
                  >
                    <Select>
                      <Option value="vi">Tiếng Việt</Option>
                      <Option value="en">Tiếng Anh</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="theme"
                    label="Giao diện"
                  >
                    <Select>
                      <Option value="light">Sáng</Option>
                      <Option value="dark">Tối</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="autoLogout"
                    label="Tự động đăng xuất sau (phút)"
                  >
                    <Select>
                      <Option value={15}>15 phút</Option>
                      <Option value={30}>30 phút</Option>
                      <Option value={60}>1 giờ</Option>
                      <Option value={120}>2 giờ</Option>
                      <Option value={0}>Không bao giờ</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="checkInTime"
                    label="Giờ nhận phòng mặc định"
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="checkOutTime"
                    label="Giờ trả phòng mặc định"
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Lưu cài đặt
                  </Button>
                  <Button onClick={handleResetSettings}>Khôi phục mặc định</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><BellOutlined />Cài đặt thông báo</span>}
          key="3"
        >
          <Card title="Cài đặt thông báo">
            <Form
              form={notificationForm}
              layout="vertical"
              initialValues={systemSettings}
              onFinish={handleUpdateNotificationSettings}
            >
              <Form.Item
                name="emailNotifications"
                label="Thông báo qua email"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="smsNotifications"
                label="Thông báo qua SMS"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="desktopNotifications"
                label="Thông báo trên màn hình"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Lưu cài đặt
                  </Button>
                  <Button onClick={handleSendTestNotification} icon={<BellOutlined />}>
                    Gửi thông báo test
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><GlobalOutlined />Giới thiệu</span>}
          key="4"
        >
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h2>Hệ thống quản lý khách sạn - Nhóm 5</h2>
              <p>Phiên bản: 1.0.0</p>
              <p>© 2025 Nhóm 5. Tất cả các quyền được bảo lưu.</p>
              <p>Được phát triển bởi Nhóm 5</p>
            </div>
          </Card>
        </TabPane>
      </Tabs>
      )}
    </div>
  );
};

export default SettingsManagement;
