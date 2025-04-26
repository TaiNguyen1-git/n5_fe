import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import styles from '../styles/Terms.module.css';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Chính sách bảo mật</h1>
          <p>Cập nhật và có hiệu lực từ ngày 01/07/2023</p>
        </div>

        <div className={styles.section}>
          <h2>1. Giới thiệu</h2>
          <p>Chào mừng bạn đến với Chính sách Bảo mật của chúng tôi. Tại Khách sạn Nhóm 5, chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ thông tin cá nhân của bạn.</p>
          <p>Chính sách Bảo mật này mô tả cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng trang web và dịch vụ của chúng tôi. Vui lòng đọc kỹ để hiểu rõ các thực hành của chúng tôi về dữ liệu của bạn.</p>
        </div>

        <div className={styles.section}>
          <h2>2. Thông tin chúng tôi thu thập</h2>
          <p>Chúng tôi có thể thu thập các loại thông tin sau đây:</p>
          
          <h3>Thông tin cá nhân</h3>
          <p>Khi bạn đăng ký tài khoản, đặt phòng hoặc tương tác với dịch vụ của chúng tôi, chúng tôi có thể thu thập:</p>
          <ul>
            <li>Tên, địa chỉ email, số điện thoại, địa chỉ liên lạc</li>
            <li>Thông tin thanh toán và hóa đơn</li>
            <li>Thông tin giấy tờ tùy thân (như số CMND/CCCD hoặc hộ chiếu)</li>
            <li>Nhu cầu ở đặc biệt và sở thích cá nhân liên quan đến kỳ nghỉ của bạn</li>
            <li>Thông tin về bất kỳ thành viên nào đi cùng bạn</li>
          </ul>

          <h3>Thông tin kỹ thuật</h3>
          <p>Khi bạn truy cập trang web hoặc ứng dụng của chúng tôi, chúng tôi có thể tự động thu thập thông tin kỹ thuật như:</p>
          <ul>
            <li>Địa chỉ IP và loại thiết bị</li>
            <li>Trình duyệt web và hệ điều hành</li>
            <li>Cookie và công nghệ theo dõi tương tự</li>
            <li>Dữ liệu nhật ký máy chủ và thông tin sử dụng</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>3. Cách chúng tôi sử dụng thông tin của bạn</h2>
          <p>Chúng tôi sử dụng thông tin cá nhân của bạn để:</p>
          <ul>
            <li>Xử lý và xác nhận đặt phòng của bạn</li>
            <li>Cung cấp dịch vụ khách sạn và đáp ứng yêu cầu của bạn</li>
            <li>Gửi thông báo quan trọng về đặt phòng hoặc thay đổi dịch vụ</li>
            <li>Quản lý tài khoản của bạn và cập nhật hồ sơ</li>
            <li>Gửi thông tin về các chương trình khuyến mãi và ưu đãi (nếu bạn đã đăng ký)</li>
            <li>Cải thiện trải nghiệm người dùng và phát triển dịch vụ của chúng tôi</li>
            <li>Phát hiện và ngăn chặn hoạt động gian lận và bảo mật hệ thống của chúng tôi</li>
            <li>Tuân thủ nghĩa vụ pháp lý và quy định</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Chia sẻ thông tin cá nhân</h2>
          <p>Chúng tôi có thể chia sẻ thông tin cá nhân của bạn với:</p>
          <ul>
            <li><strong>Nhà cung cấp dịch vụ:</strong> Các công ty thứ ba cung cấp dịch vụ thay mặt cho chúng tôi, như xử lý thanh toán, phân tích dữ liệu, dịch vụ email.</li>
            <li><strong>Đối tác kinh doanh:</strong> Khi cần thiết để cung cấp dịch vụ bạn đã yêu cầu (như dịch vụ đưa đón, du lịch).</li>
            <li><strong>Cơ quan chức năng:</strong> Khi luật pháp yêu cầu hoặc để bảo vệ quyền, tài sản và sự an toàn của chúng tôi hoặc người khác.</li>
          </ul>
          <p>Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba và chỉ chia sẻ khi cần thiết để cung cấp dịch vụ cho bạn hoặc theo yêu cầu pháp lý.</p>
        </div>

        <div className={styles.section}>
          <h2>5. Bảo mật dữ liệu</h2>
          <p>Chúng tôi thực hiện các biện pháp bảo mật hợp lý về mặt kỹ thuật và tổ chức để bảo vệ thông tin cá nhân của bạn khỏi bị mất mát, lạm dụng và truy cập trái phép.</p>
          <p>Các biện pháp bảo mật bao gồm:</p>
          <ul>
            <li>Mã hóa dữ liệu nhạy cảm như thông tin thanh toán</li>
            <li>Hạn chế quyền truy cập vào thông tin cá nhân</li>
            <li>Sử dụng các hệ thống phòng thủ bảo mật như tường lửa</li>
            <li>Giám sát thường xuyên hệ thống của chúng tôi để phát hiện điểm yếu và tấn công tiềm ẩn</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>6. Thời gian lưu trữ dữ liệu</h2>
          <p>Chúng tôi chỉ lưu giữ thông tin cá nhân của bạn trong thời gian cần thiết để thực hiện các mục đích đã nêu trong Chính sách Bảo mật này, trừ khi thời gian lưu giữ lâu hơn được yêu cầu hoặc cho phép theo luật.</p>
          <p>Khi xác định thời gian lưu giữ, chúng tôi xem xét:</p>
          <ul>
            <li>Khoảng thời gian cần thiết để cung cấp dịch vụ cho bạn</li>
            <li>Nghĩa vụ pháp lý của chúng tôi (như hạn chế kế toán và thuế)</li>
            <li>Các yêu cầu pháp lý hoặc quy định hiện hành</li>
            <li>Giải quyết tranh chấp hoặc thực thi thỏa thuận của chúng tôi</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>7. Cookie và công nghệ theo dõi</h2>
          <p>Chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự để cải thiện trải nghiệm của bạn trên trang web của chúng tôi và hiểu cách bạn tương tác với dịch vụ của chúng tôi.</p>
          <p>Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập trang web. Chúng giúp trang web ghi nhớ thông tin về bạn, chẳng hạn như tùy chọn ngôn ngữ và các trang bạn đã truy cập.</p>
          <p>Bạn có thể quản lý cài đặt cookie trong trình duyệt của mình. Tuy nhiên, việc vô hiệu hóa cookie có thể ảnh hưởng đến chức năng của trang web.</p>
        </div>

        <div className={styles.section}>
          <h2>8. Quyền của bạn</h2>
          <p>Tùy thuộc vào luật áp dụng, bạn có thể có các quyền nhất định liên quan đến thông tin cá nhân của mình, bao gồm:</p>
          <ul>
            <li>Quyền truy cập và nhận bản sao thông tin của bạn</li>
            <li>Quyền yêu cầu sửa đổi thông tin không chính xác</li>
            <li>Quyền xóa thông tin của bạn (trong một số trường hợp nhất định)</li>
            <li>Quyền hạn chế hoặc phản đối việc xử lý thông tin của bạn</li>
            <li>Quyền rút lại sự đồng ý của bạn</li>
            <li>Quyền di chuyển dữ liệu (nhận thông tin của bạn ở định dạng có thể đọc được)</li>
          </ul>
          <p>Để thực hiện quyền của mình, vui lòng liên hệ với chúng tôi theo thông tin ở phần cuối chính sách này.</p>
        </div>

        <div className={styles.section}>
          <h2>9. Thay đổi đối với Chính sách Bảo mật</h2>
          <p>Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian để phản ánh thay đổi về thực tiễn bảo mật, thay đổi pháp lý hoặc cải tiến dịch vụ của chúng tôi.</p>
          <p>Chúng tôi sẽ đăng bản cập nhật trên trang web của mình và, nếu có thay đổi đáng kể, chúng tôi sẽ thông báo cho bạn qua email hoặc thông báo trên trang web của chúng tôi.</p>
          <p>Chúng tôi khuyến khích bạn xem xét Chính sách Bảo mật này định kỳ.</p>
        </div>

        <div className={styles.section}>
          <h2>10. Liên hệ với chúng tôi</h2>
          <p>Nếu bạn có câu hỏi, mối quan tâm hoặc yêu cầu liên quan đến Chính sách Bảo mật này hoặc việc xử lý thông tin cá nhân của bạn, vui lòng liên hệ với chúng tôi qua:</p>
          <p>Email: privacy@n5hotel.com</p>
          <p>Điện thoại: 1900 1234</p>
          <p>Địa chỉ: 123 Đường ABC, Quận XYZ, Thành phố HCM, Việt Nam</p>
        </div>

        <p className={styles.effectiveDate}>Ngày cập nhật gần nhất: 01/07/2023</p>

        <Link href="/">
          <span className={styles.backLink}>← Quay lại trang chủ</span>
        </Link>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy; 