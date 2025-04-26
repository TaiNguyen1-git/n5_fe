import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import styles from '../styles/Terms.module.css';

const TermsOfService = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Điều khoản dịch vụ</h1>
          <p>Vui lòng đọc kỹ các điều khoản dịch vụ sau đây trước khi sử dụng dịch vụ của chúng tôi.</p>
        </div>

        <div className={styles.section}>
          <h2>1. Giới thiệu</h2>
          <p>Chào mừng bạn đến với website đặt phòng khách sạn của chúng tôi. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện được quy định dưới đây.</p>
          <p>Những điều khoản này áp dụng cho tất cả người dùng của trang web, bao gồm nhưng không giới hạn ở người dùng là khách hàng, nhà cung cấp dịch vụ, hoặc người đóng góp nội dung.</p>
        </div>

        <div className={styles.section}>
          <h2>2. Đăng ký tài khoản</h2>
          <p>Để sử dụng đầy đủ các tính năng của trang web, bạn có thể cần đăng ký một tài khoản. Khi đăng ký, bạn đồng ý cung cấp thông tin chính xác, đầy đủ và cập nhật về bản thân.</p>
          <p>Bạn chịu trách nhiệm bảo mật tài khoản của mình, bao gồm mật khẩu, và bạn chấp nhận trách nhiệm đối với tất cả các hoạt động diễn ra dưới tài khoản của mình.</p>
          <p>Chúng tôi có quyền từ chối dịch vụ, đóng tài khoản, xóa hoặc chỉnh sửa nội dung, hoặc hủy đơn đặt hàng theo quyết định riêng của mình.</p>
        </div>

        <div className={styles.section}>
          <h2>3. Đặt phòng và thanh toán</h2>
          <p>Khi bạn đặt phòng qua trang web của chúng tôi, bạn đang đưa ra đề nghị mua dịch vụ phòng khách sạn theo các điều khoản và điều kiện quy định dưới đây:</p>
          <ul>
            <li>Thông tin chi tiết về giá cả, loại phòng, và các dịch vụ đi kèm sẽ được hiển thị khi bạn đặt phòng.</li>
            <li>Chúng tôi có thể yêu cầu cung cấp thông tin thanh toán trước khi xác nhận đặt phòng.</li>
            <li>Đặt phòng chỉ được xác nhận sau khi chúng tôi đã gửi email xác nhận.</li>
            <li>Bạn đảm bảo rằng tất cả thông tin thanh toán bạn cung cấp là chính xác và bạn có đủ quyền sử dụng phương thức thanh toán đã chọn.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Chính sách hủy và hoàn tiền</h2>
          <p>Chính sách hủy và hoàn tiền có thể khác nhau tùy thuộc vào loại phòng và thời gian đặt phòng. Thông tin chi tiết sẽ được cung cấp tại thời điểm đặt phòng.</p>
          <p>Thông thường, các trường hợp sau đây áp dụng:</p>
          <ul>
            <li>Hủy đặt phòng trước 48 giờ so với thời gian nhận phòng: hoàn tiền 100% (trừ phí xử lý).</li>
            <li>Hủy đặt phòng trong vòng 24-48 giờ trước thời gian nhận phòng: hoàn tiền 50%.</li>
            <li>Hủy đặt phòng trong vòng 24 giờ trước thời gian nhận phòng: không hoàn tiền.</li>
            <li>Không đến (No-show): sẽ bị tính phí đầy đủ cho đêm đầu tiên.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>5. Quy tắc và hành vi sử dụng</h2>
          <p>Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý không:</p>
          <ul>
            <li>Vi phạm bất kỳ luật pháp hiện hành nào.</li>
            <li>Sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp hoặc trái phép nào.</li>
            <li>Đăng tải hoặc truyền tải bất kỳ nội dung vi phạm quyền sở hữu trí tuệ.</li>
            <li>Gửi quảng cáo hoặc tài liệu khuyến mại không được phép.</li>
            <li>Giả mạo danh tính của bất kỳ cá nhân hoặc tổ chức nào.</li>
            <li>Cản trở hoặc gây rối loạn hoạt động của dịch vụ hoặc các máy chủ và mạng được kết nối với dịch vụ.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>6. Quyền sở hữu trí tuệ</h2>
          <p>Trang web và nội dung của nó, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, biểu tượng, hình ảnh, clip âm thanh, tải xuống, giao diện và phần mềm, là tài sản của công ty chúng tôi hoặc các nhà cung cấp nội dung của chúng tôi và được bảo vệ bởi luật bản quyền quốc tế.</p>
          <p>Bạn không được sửa đổi, sao chép, tái sản xuất, xuất bản lại, tải lên, đăng tải, truyền tải hoặc phân phối bất kỳ phần nào của trang web của chúng tôi mà không có sự cho phép trước bằng văn bản của chúng tôi.</p>
        </div>

        <div className={styles.section}>
          <h2>7. Giới hạn trách nhiệm</h2>
          <p>Chúng tôi không chịu trách nhiệm đối với bất kỳ tổn thất nào phát sinh từ việc sử dụng hoặc không thể sử dụng trang web hoặc dịch vụ của chúng tôi, bao gồm nhưng không giới hạn ở thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, do hậu quả, đặc biệt hoặc mang tính trừng phạt.</p>
          <p>Trang web và dịch vụ của chúng tôi được cung cấp "nguyên trạng" và "như có sẵn", không có bất kỳ bảo đảm nào, dù là rõ ràng hay ngụ ý.</p>
        </div>

        <div className={styles.section}>
          <h2>8. Thay đổi điều khoản</h2>
          <p>Chúng tôi có thể sửa đổi các điều khoản này bất cứ lúc nào bằng cách đăng các điều khoản đã sửa đổi trên trang web này. Vui lòng kiểm tra định kỳ các điều khoản dịch vụ để cập nhật những thay đổi.</p>
          <p>Việc bạn tiếp tục sử dụng trang web sau khi đăng các thay đổi sẽ cấu thành việc chấp nhận các điều khoản sửa đổi của bạn.</p>
        </div>

        <div className={styles.section}>
          <h2>9. Luật áp dụng</h2>
          <p>Các điều khoản này sẽ được điều chỉnh và giải thích phù hợp với luật pháp Việt Nam, mà không quan tâm đến các nguyên tắc xung đột pháp luật.</p>
        </div>

        <div className={styles.section}>
          <h2>10. Liên hệ</h2>
          <p>Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản Dịch vụ này, vui lòng liên hệ với chúng tôi qua:</p>
          <p>Email: support@n5hotel.com</p>
          <p>Điện thoại: 1900 1234</p>
          <p>Địa chỉ: 123 Đường ABC, Quận XYZ, Thành phố HCM, Việt Nam</p>
        </div>

        <p className={styles.effectiveDate}>Ngày hiệu lực: 01/07/2023</p>

        <Link href="/">
          <span className={styles.backLink}>← Quay lại trang chủ</span>
        </Link>
      </div>
    </Layout>
  );
};

export default TermsOfService; 