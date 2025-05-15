import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function RoomRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Chuyển hướng đến trang chi tiết phòng
      router.replace(`/room/${id}`);
    }
  }, [id, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Đang chuyển hướng...</h2>
      <p>Vui lòng đợi trong giây lát</p>
    </div>
  );
}
