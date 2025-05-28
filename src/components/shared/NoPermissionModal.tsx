import React from 'react';
import { Modal, Result, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface NoPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  action?: string; // Hành động bị hạn chế (ví dụ: "chỉnh sửa", "xóa")
  title?: string;
  description?: string;
}

const NoPermissionModal: React.FC<NoPermissionModalProps> = ({
  visible,
  onClose,
  action = "thực hiện hành động này",
  title = "Không có quyền truy cập",
  description
}) => {
  const defaultDescription = `Bạn không có quyền ${action}. Chỉ có Admin mới có thể thực hiện chức năng này.`;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      closable={false}
    >
      <Result
        icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
        title={title}
        subTitle={description || defaultDescription}
        extra={
          <Button type="primary" onClick={onClose}>
            Đã hiểu
          </Button>
        }
      />
    </Modal>
  );
};

export default NoPermissionModal;
