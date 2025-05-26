import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Table, Tag, Button, Space, Modal, Rate, Input, Card, Avatar, Tabs, Empty, List } from 'antd';
import { UserOutlined, StarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../../styles/Reviews.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';
import dayjs from 'dayjs';
import axios from 'axios';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface Review {
  id: number;
  bookingId: number;
  roomNumber: string;
  roomType: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'published' | 'pending' | 'rejected';
  response?: string;
}

// Tạo component Comment tùy chỉnh thay vì sử dụng từ antd
const CommentComponent = ({ author, content, datetime }: { author: React.ReactNode, content: React.ReactNode, datetime: React.ReactNode }) => (
  <div className={styles.commentContainer}>
    <div className={styles.commentAuthor}>{author}</div>
    <div className={styles.commentContent}>{content}</div>
    <div className={styles.commentDatetime}>{datetime}</div>
  </div>
);

// API endpoints
const BASE_URL = 'https://ptud-web-1.onrender.com/api';
const REVIEWS_API = `${BASE_URL}/DanhGia`;

export default function Reviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [publicReviewsList, setPublicReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      router.push('/login?redirect=reviews');
      return;
    }

    // Fetch reviews
    fetchReviews();
    fetchPublicReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = getCurrentUser();
      if (!user) {
        setReviews([]);
        setLoading(false);
        return;
      }
      
      // Call API to get user reviews
      const response = await axios.get(`${REVIEWS_API}/GetByUser?userId=${user.id}`, {
        timeout: 8000
      });
      
      if (response.data && Array.isArray(response.data)) {
        const formattedReviews = response.data.map((item: any) => ({
          id: item.maDG || item.id,
          bookingId: item.maHD || item.bookingId,
          roomNumber: item.soPhong || item.roomNumber,
          roomType: item.loaiPhong || item.roomType,
          rating: item.soSao || item.rating,
          comment: item.noiDung || item.comment,
          createdAt: item.ngayTao || item.createdAt,
          status: item.trangThai === 1 ? 'published' as const : 
                 item.trangThai === 0 ? 'pending' as const : 'rejected' as const,
          response: item.phanHoi || item.response
        }));
        
        setReviews(formattedReviews);
      } else {
        // If API fails or returns unexpected format, initialize with empty array
        setReviews([]);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu đánh giá. Vui lòng thử lại sau.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPublicReviews = async () => {
    try {
      // Call API to get public reviews
      const response = await axios.get(`${REVIEWS_API}/GetAll`, {
        timeout: 8000
      });
      
      if (response.data && Array.isArray(response.data)) {
        const formattedReviews = response.data
          .filter((item: any) => item.trangThai === 1) // Only published reviews
          .map((item: any) => ({
            id: item.maDG || item.id,
            author: item.tenKH || item.hoTen || 'Khách hàng',
            avatar: null,
            roomType: item.loaiPhong || item.roomType,
            rating: item.soSao || item.rating,
            comment: item.noiDung || item.comment,
            createdAt: item.ngayTao || item.createdAt,
            response: item.phanHoi || item.response
          }));
        
        setPublicReviewsList(formattedReviews);
      } else {
        // If API fails or returns unexpected format, initialize with empty array
        setPublicReviewsList([]);
      }
    } catch (err) {
      setPublicReviewsList([]);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsEditModalVisible(true);
  };

  const handleDeleteReview = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa đánh giá',
      content: 'Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          // Call API to delete review
          await axios.delete(`${REVIEWS_API}/Delete?id=${id}`);
          
          // Update UI
          setReviews(reviews.filter(review => review.id !== id));
        } catch (err) {
          Modal.error({
            title: 'Lỗi',
            content: 'Không thể xóa đánh giá. Vui lòng thử lại sau.'
          });
        }
      }
    });
  };

  const handleSaveReview = async () => {
    if (editingReview) {
      try {
        // Call API to update review
        await axios.put(`${REVIEWS_API}/Update`, {
          maDG: editingReview.id,
          noiDung: editingReview.comment,
          soSao: editingReview.rating
        });
        
        // Update UI
        setReviews(reviews.map(review => 
          review.id === editingReview.id ? editingReview : review
        ));
        setIsEditModalVisible(false);
        setEditingReview(null);
      } catch (err) {
        Modal.error({
          title: 'Lỗi',
          content: 'Không thể cập nhật đánh giá. Vui lòng thử lại sau.'
        });
      }
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Đánh giá & Nhận xét</h1>
          
          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Đánh giá của tôi" key="my-reviews">
              {loading ? (
                <div className={styles.loading}>Đang tải dữ liệu...</div>
              ) : reviews.length === 0 ? (
                <Empty 
                  description="Bạn chưa có đánh giá nào" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  itemLayout="vertical"
                  dataSource={reviews}
                  renderItem={review => (
                    <List.Item
                      key={review.id}
                      actions={[
                        <Space key="actions">
                          <Button 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditReview(review)}
                            disabled={review.status !== 'pending'}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            Xóa
                          </Button>
                        </Space>
                      ]}
                      extra={
                        <div className={styles.reviewStatus}>
                          <Tag color={
                            review.status === 'published' ? 'green' : 
                            review.status === 'pending' ? 'orange' : 'red'
                          }>
                            {review.status === 'published' ? 'Đã đăng' : 
                             review.status === 'pending' ? 'Đang chờ duyệt' : 'Đã từ chối'}
                          </Tag>
                        </div>
                      }
                    >
                      <List.Item.Meta
                        title={<span>Phòng {review.roomNumber} - {review.roomType}</span>}
                        description={
                          <div>
                            <Rate disabled defaultValue={review.rating} />
                            <div className={styles.reviewDate}>
                              Đăng ngày: {dayjs(review.createdAt).format('DD/MM/YYYY')}
                            </div>
                          </div>
                        }
                      />
                      <div className={styles.reviewContent}>
                        <p>{review.comment}</p>
                      </div>
                      
                      {review.response && (
                        <div className={styles.reviewResponse}>
                          <CommentComponent
                            author={<span className={styles.responseAuthor}>Phản hồi từ khách sạn</span>}
                            content={<p>{review.response}</p>}
                            datetime={<span>Ngày phản hồi: {dayjs(review.createdAt).add(1, 'day').format('DD/MM/YYYY')}</span>}
                          />
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
            
            <TabPane tab="Tất cả đánh giá" key="all-reviews">
              <div className={styles.reviewStats}>
                <Card className={styles.statsCard}>
                  <div className={styles.overallRating}>
                    <div className={styles.ratingNumber}>
                      {publicReviewsList.length > 0 
                        ? (publicReviewsList.reduce((sum, review) => sum + review.rating, 0) / publicReviewsList.length).toFixed(1) 
                        : '0.0'}
                    </div>
                    <Rate 
                      disabled 
                      defaultValue={publicReviewsList.length > 0 
                        ? publicReviewsList.reduce((sum, review) => sum + review.rating, 0) / publicReviewsList.length 
                        : 0} 
                      allowHalf 
                    />
                    <div className={styles.totalReviews}>
                      Dựa trên {publicReviewsList.length} đánh giá
                    </div>
                  </div>
                </Card>
              </div>
              
              {publicReviewsList.length === 0 ? (
                <Empty 
                  description="Chưa có đánh giá nào" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  itemLayout="vertical"
                  dataSource={publicReviewsList}
                  renderItem={review => (
                    <List.Item key={review.id}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={<span>{review.author}</span>}
                        description={
                          <div>
                            <Rate disabled defaultValue={review.rating} />
                            <div className={styles.reviewDate}>
                              Đăng ngày: {dayjs(review.createdAt).format('DD/MM/YYYY')}
                            </div>
                            <div className={styles.roomType}>
                              Loại phòng: {review.roomType}
                            </div>
                          </div>
                        }
                      />
                      <div className={styles.reviewContent}>
                        <p>{review.comment}</p>
                      </div>
                      
                      {review.response && (
                        <div className={styles.reviewResponse}>
                          <CommentComponent
                            author={<span className={styles.responseAuthor}>Phản hồi từ khách sạn</span>}
                            content={<p>{review.response}</p>}
                            datetime={<span>Ngày phản hồi: {dayjs(review.createdAt).add(2, 'day').format('DD/MM/YYYY')}</span>}
                          />
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
          </Tabs>
        </div>
        
        <Modal
          title="Chỉnh sửa đánh giá"
          open={isEditModalVisible}
          onOk={handleSaveReview}
          onCancel={() => setIsEditModalVisible(false)}
          okText="Lưu"
          cancelText="Hủy"
        >
          {editingReview && (
            <>
              <div className={styles.editRating}>
                <label>Đánh giá sao:</label>
                <Rate 
                  value={editingReview.rating} 
                  onChange={value => setEditingReview({...editingReview, rating: value})} 
                />
              </div>
              <div className={styles.editComment}>
                <label>Nhận xét:</label>
                <TextArea 
                  rows={4} 
                  value={editingReview.comment}
                  onChange={e => setEditingReview({...editingReview, comment: e.target.value})}
                />
              </div>
            </>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
