import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Table, Tag, Button, Space, Modal, Rate, Input, Card, Avatar, Tabs, Empty, List } from 'antd';
import { UserOutlined, StarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../../styles/Reviews.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';
import dayjs from 'dayjs';

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

export default function Reviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('my-reviews');

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      router.push('/login?redirect=reviews');
      return;
    }

    // Fetch reviews
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    // Mock data for reviews
    const mockReviews: Review[] = [
      {
        id: 1,
        bookingId: 2,
        roomNumber: '202',
        roomType: 'VIP',
        rating: 5,
        comment: 'Phòng rất tuyệt vời, sạch sẽ và thoải mái. Nhân viên phục vụ rất chu đáo và thân thiện. Tôi sẽ quay lại lần sau!',
        createdAt: '2025-04-16',
        status: 'published',
        response: 'Cảm ơn quý khách đã đánh giá tích cực. Chúng tôi rất vui khi quý khách hài lòng với dịch vụ của chúng tôi và mong được đón tiếp quý khách trong tương lai!'
      },
      {
        id: 2,
        bookingId: 3,
        roomNumber: '103',
        roomType: 'Duo',
        rating: 4,
        comment: 'Phòng đẹp, view tốt. Tuy nhiên, bữa sáng hơi ít lựa chọn.',
        createdAt: '2025-03-09',
        status: 'published'
      },
      {
        id: 3,
        bookingId: 5,
        roomNumber: '301',
        roomType: 'Triple',
        rating: 3,
        comment: 'Phòng ổn, nhưng hơi ồn vào buổi tối.',
        createdAt: '2025-02-15',
        status: 'pending'
      }
    ];

    setReviews(mockReviews);
    setLoading(false);
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
      onOk: () => {
        // Delete review logic
        setReviews(reviews.filter(review => review.id !== id));
      }
    });
  };

  const handleSaveReview = () => {
    if (editingReview) {
      // Update review logic
      setReviews(reviews.map(review => 
        review.id === editingReview.id ? editingReview : review
      ));
      setIsEditModalVisible(false);
      setEditingReview(null);
    }
  };

  // Get all hotel reviews for public tab
  const publicReviews = [
    {
      id: 1,
      author: 'Nguyễn Văn A',
      avatar: null,
      roomType: 'VIP',
      rating: 5,
      comment: 'Phòng rất tuyệt vời, sạch sẽ và thoải mái. Nhân viên phục vụ rất chu đáo và thân thiện.',
      createdAt: '2025-04-16',
      response: 'Cảm ơn quý khách đã đánh giá tích cực. Chúng tôi rất vui khi quý khách hài lòng với dịch vụ của chúng tôi!'
    },
    {
      id: 2,
      author: 'Trần Thị B',
      avatar: null,
      roomType: 'Single',
      rating: 4,
      comment: 'Phòng đẹp, view tốt. Tuy nhiên, bữa sáng hơi ít lựa chọn.',
      createdAt: '2025-03-09'
    },
    {
      id: 3,
      author: 'Lê Văn C',
      avatar: null,
      roomType: 'Duo',
      rating: 5,
      comment: 'Tuyệt vời! Sẽ quay lại lần sau.',
      createdAt: '2025-02-15'
    },
    {
      id: 4,
      author: 'Phạm Thị D',
      avatar: null,
      roomType: 'Triple',
      rating: 4,
      comment: 'Dịch vụ tốt, nhân viên thân thiện.',
      createdAt: '2025-01-20'
    }
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Đánh giá & Nhận xét</h1>
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Đánh giá của tôi" key="my-reviews">
              {reviews.length === 0 ? (
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
                    <div className={styles.ratingNumber}>4.5</div>
                    <Rate disabled defaultValue={4.5} allowHalf />
                    <div className={styles.totalReviews}>Dựa trên {publicReviews.length} đánh giá</div>
                  </div>
                  
                  <div className={styles.ratingBreakdown}>
                    <div className={styles.ratingRow}>
                      <span>5 sao</span>
                      <div className={styles.ratingBar}>
                        <div className={styles.ratingFill} style={{ width: '60%' }}></div>
                      </div>
                      <span>60%</span>
                    </div>
                    <div className={styles.ratingRow}>
                      <span>4 sao</span>
                      <div className={styles.ratingBar}>
                        <div className={styles.ratingFill} style={{ width: '30%' }}></div>
                      </div>
                      <span>30%</span>
                    </div>
                    <div className={styles.ratingRow}>
                      <span>3 sao</span>
                      <div className={styles.ratingBar}>
                        <div className={styles.ratingFill} style={{ width: '10%' }}></div>
                      </div>
                      <span>10%</span>
                    </div>
                    <div className={styles.ratingRow}>
                      <span>2 sao</span>
                      <div className={styles.ratingBar}>
                        <div className={styles.ratingFill} style={{ width: '0%' }}></div>
                      </div>
                      <span>0%</span>
                    </div>
                    <div className={styles.ratingRow}>
                      <span>1 sao</span>
                      <div className={styles.ratingBar}>
                        <div className={styles.ratingFill} style={{ width: '0%' }}></div>
                      </div>
                      <span>0%</span>
                    </div>
                  </div>
                </Card>
              </div>
              
              <List
                itemLayout="vertical"
                dataSource={publicReviews}
                renderItem={review => (
                  <List.Item
                    key={review.id}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={<span>{review.author} - Phòng {review.roomType}</span>}
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
                pagination={{ pageSize: 5 }}
              />
            </TabPane>
          </Tabs>
        </div>
        
        {/* Modal chỉnh sửa đánh giá */}
        <Modal
          title="Chỉnh sửa đánh giá"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          onOk={handleSaveReview}
          okText="Lưu"
          cancelText="Hủy"
        >
          {editingReview && (
            <div className={styles.editReviewForm}>
              <div className={styles.roomInfo}>
                <h3>Phòng {editingReview.roomNumber} - {editingReview.roomType}</h3>
              </div>
              
              <div className={styles.ratingEdit}>
                <span className={styles.ratingLabel}>Đánh giá của bạn:</span>
                <Rate 
                  value={editingReview.rating} 
                  onChange={value => setEditingReview({...editingReview, rating: value})}
                />
              </div>
              
              <div className={styles.commentEdit}>
                <span className={styles.commentLabel}>Nhận xét:</span>
                <TextArea 
                  rows={4} 
                  value={editingReview.comment}
                  onChange={e => setEditingReview({...editingReview, comment: e.target.value})}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
