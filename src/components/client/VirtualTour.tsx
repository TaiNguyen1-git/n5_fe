import React, { useState, useRef, useEffect } from 'react';
import styles from './VirtualTour.module.css';

interface Hotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  type: 'info' | 'navigation';
  title: string;
  content?: string;
  target?: string;
}

interface Scene {
  id: string;
  name: string;
  image: string;
  hotspots: Hotspot[];
}

interface VirtualTourProps {
  roomId?: string;
  tourType: 'room' | 'hotel';
  onClose: () => void;
}

const VirtualTour: React.FC<VirtualTourProps> = ({ roomId, tourType, onClose }) => {
  const [currentScene, setCurrentScene] = useState(tourType === 'hotel' ? 'lobby' : 'bedroom');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Room scenes data
  const roomScenes: Record<string, Scene> = {
    bedroom: {
      id: 'bedroom',
      name: 'Phòng ngủ',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'bed',
          x: 45,
          y: 60,
          type: 'info',
          title: 'Giường King Size',
          content: 'Giường đôi cao cấp với nệm memory foam, ga trải giường cotton 100%'
        },
        {
          id: 'window',
          x: 75,
          y: 30,
          type: 'info',
          title: 'Cửa sổ view thành phố',
          content: 'Tầm nhìn panoramic ra thành phố, đặc biệt đẹp vào buổi tối'
        },
        {
          id: 'to-bathroom',
          x: 85,
          y: 70,
          type: 'navigation',
          title: 'Đi đến phòng tắm',
          target: 'bathroom'
        },
        {
          id: 'to-balcony',
          x: 20,
          y: 40,
          type: 'navigation',
          title: 'Đi đến ban công',
          target: 'balcony'
        }
      ]
    },
    bathroom: {
      id: 'bathroom',
      name: 'Phòng tắm',
      image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'bathtub',
          x: 30,
          y: 65,
          type: 'info',
          title: 'Bồn tắm Jacuzzi',
          content: 'Bồn tắm massage với hệ thống sục khí, thư giãn tối đa'
        },
        {
          id: 'shower',
          x: 70,
          y: 50,
          type: 'info',
          title: 'Vòi sen thông minh',
          content: 'Hệ thống vòi sen rain shower với điều khiển nhiệt độ tự động'
        },
        {
          id: 'to-bedroom',
          x: 90,
          y: 80,
          type: 'navigation',
          title: 'Quay lại phòng ngủ',
          target: 'bedroom'
        }
      ]
    },
    balcony: {
      id: 'balcony',
      name: 'Ban công',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'view',
          x: 50,
          y: 30,
          type: 'info',
          title: 'Tầm nhìn thành phố',
          content: 'View 180° ra thành phố, có thể ngắm hoàng hôn và ánh đèn đêm'
        },
        {
          id: 'furniture',
          x: 25,
          y: 70,
          type: 'info',
          title: 'Bàn ghế thư giãn',
          content: 'Bộ bàn ghế ngoài trời cao cấp, lý tưởng cho việc thưởng thức cà phê'
        },
        {
          id: 'to-bedroom-balcony',
          x: 80,
          y: 85,
          type: 'navigation',
          title: 'Quay lại phòng ngủ',
          target: 'bedroom'
        }
      ]
    }
  };

  // Hotel scenes data
  const hotelScenes: Record<string, Scene> = {
    lobby: {
      id: 'lobby',
      name: 'Sảnh chính',
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'reception',
          x: 60,
          y: 50,
          type: 'info',
          title: 'Quầy lễ tân',
          content: 'Dịch vụ lễ tân 24/7 với đội ngũ nhân viên chuyên nghiệp, thân thiện'
        },
        {
          id: 'lounge',
          x: 25,
          y: 65,
          type: 'info',
          title: 'Khu vực nghỉ ngơi',
          content: 'Sofa cao cấp, không gian thoáng mát để khách nghỉ ngơi'
        },
        {
          id: 'to-restaurant',
          x: 80,
          y: 40,
          type: 'navigation',
          title: 'Đến nhà hàng',
          target: 'restaurant'
        },
        {
          id: 'to-pool',
          x: 15,
          y: 30,
          type: 'navigation',
          title: 'Đến hồ bơi',
          target: 'pool'
        }
      ]
    },
    restaurant: {
      id: 'restaurant',
      name: 'Nhà hàng',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'dining-area',
          x: 50,
          y: 60,
          type: 'info',
          title: 'Khu vực dùng bữa',
          content: 'Không gian sang trọng với 150 chỗ ngồi, phục vụ ẩm thực Á - Âu'
        },
        {
          id: 'kitchen',
          x: 80,
          y: 45,
          type: 'info',
          title: 'Bếp mở',
          content: 'Bếp hiện đại với đầu bếp chuyên nghiệp, thực đơn đa dạng'
        },
        {
          id: 'bar',
          x: 20,
          y: 35,
          type: 'info',
          title: 'Quầy bar',
          content: 'Cocktail và đồ uống cao cấp, không gian lý tưởng cho gặp gỡ'
        },
        {
          id: 'to-lobby-restaurant',
          x: 90,
          y: 80,
          type: 'navigation',
          title: 'Quay lại sảnh',
          target: 'lobby'
        }
      ]
    },
    pool: {
      id: 'pool',
      name: 'Hồ bơi',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'main-pool',
          x: 50,
          y: 55,
          type: 'info',
          title: 'Hồ bơi chính',
          content: 'Hồ bơi ngoài trời 25m x 15m, nước được lọc và khử trùng hàng ngày'
        },
        {
          id: 'pool-bar',
          x: 75,
          y: 30,
          type: 'info',
          title: 'Pool Bar',
          content: 'Đồ uống tươi mát, cocktail nhiệt đới phục vụ bên hồ bơi'
        },
        {
          id: 'jacuzzi',
          x: 25,
          y: 40,
          type: 'info',
          title: 'Jacuzzi',
          content: 'Bồn tắm nước nóng thư giãn với hệ thống massage'
        },
        {
          id: 'to-gym',
          x: 85,
          y: 70,
          type: 'navigation',
          title: 'Đến phòng gym',
          target: 'gym'
        }
      ]
    },
    gym: {
      id: 'gym',
      name: 'Phòng tập gym',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'cardio',
          x: 30,
          y: 50,
          type: 'info',
          title: 'Khu vực cardio',
          content: 'Máy chạy bộ, xe đạp tập hiện đại với màn hình giải trí'
        },
        {
          id: 'weights',
          x: 70,
          y: 60,
          type: 'info',
          title: 'Khu tạ tự do',
          content: 'Đầy đủ tạ đơn, tạ đôi và máy tập chuyên nghiệp'
        },
        {
          id: 'to-spa',
          x: 85,
          y: 30,
          type: 'navigation',
          title: 'Đến spa',
          target: 'spa'
        }
      ]
    },
    spa: {
      id: 'spa',
      name: 'Spa & Wellness',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'treatment-room',
          x: 45,
          y: 55,
          type: 'info',
          title: 'Phòng trị liệu',
          content: 'Massage thư giãn, chăm sóc da mặt với sản phẩm cao cấp'
        },
        {
          id: 'sauna',
          x: 25,
          y: 40,
          type: 'info',
          title: 'Phòng xông hơi',
          content: 'Sauna khô và ướt, giúp thư giãn và thanh lọc cơ thể'
        },
        {
          id: 'relaxation',
          x: 75,
          y: 35,
          type: 'info',
          title: 'Khu thư giãn',
          content: 'Không gian yên tĩnh với trà thảo mộc và âm nhạc nhẹ nhàng'
        },
        {
          id: 'to-lobby-spa',
          x: 90,
          y: 80,
          type: 'navigation',
          title: 'Quay lại sảnh',
          target: 'lobby'
        }
      ]
    },
    conference: {
      id: 'conference',
      name: 'Phòng hội nghị',
      image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&h=600&fit=crop',
      hotspots: [
        {
          id: 'main-hall',
          x: 50,
          y: 50,
          type: 'info',
          title: 'Hội trường chính',
          content: 'Sức chứa 200 người, trang bị âm thanh ánh sáng hiện đại'
        },
        {
          id: 'av-equipment',
          x: 75,
          y: 30,
          type: 'info',
          title: 'Thiết bị AV',
          content: 'Projector 4K, hệ thống âm thanh Bose, micro không dây'
        },
        {
          id: 'breakout-rooms',
          x: 25,
          y: 65,
          type: 'info',
          title: 'Phòng họp nhỏ',
          content: '5 phòng họp nhỏ cho 10-20 người, lý tưởng cho workshop'
        }
      ]
    }
  };

  // Choose scenes based on tour type
  const scenes = tourType === 'hotel' ? hotelScenes : roomScenes;
  const currentSceneData = scenes[currentScene];

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.type === 'navigation' && hotspot.target) {
      setCurrentScene(hotspot.target);
      setSelectedHotspot(null);
    } else {
      setSelectedHotspot(hotspot);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={styles.virtualTourModal} onClick={onClose}>
      <div 
        className={styles.virtualTourContainer} 
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* Header */}
        <div className={styles.tourHeader}>
          <div className={styles.tourTitle}>
            <h3>
              {tourType === 'hotel' ? '🏨 Tour ảo 360° - Khách sạn' : `🏠 Tour ảo 360° - Phòng ${roomId}`}
            </h3>
            <span className={styles.currentScene}>{currentSceneData.name}</span>
          </div>
          <div className={styles.tourControls}>
            <button onClick={toggleFullscreen} className={styles.controlBtn}>
              {isFullscreen ? '🔲' : '⛶'} Toàn màn hình
            </button>
            <button onClick={onClose} className={styles.closeBtn}>✕</button>
          </div>
        </div>

        {/* Scene Navigation */}
        <div className={styles.sceneNavigation}>
          {Object.values(scenes).map((scene) => {
            const getSceneIcon = (sceneId: string) => {
              const iconMap: Record<string, string> = {
                // Room icons
                bedroom: '🛏️',
                bathroom: '🚿',
                balcony: '🌅',
                // Hotel icons
                lobby: '🏛️',
                restaurant: '🍽️',
                pool: '🏊‍♂️',
                gym: '💪',
                spa: '🧘‍♀️',
                conference: '👥'
              };
              return iconMap[sceneId] || '📍';
            };

            return (
              <button
                key={scene.id}
                className={`${styles.sceneBtn} ${currentScene === scene.id ? styles.active : ''}`}
                onClick={() => setCurrentScene(scene.id)}
              >
                {getSceneIcon(scene.id)} {scene.name}
              </button>
            );
          })}
        </div>

        {/* Main Tour View */}
        <div className={styles.tourView}>
          <div 
            className={styles.sceneImage}
            style={{ backgroundImage: `url(${currentSceneData.image})` }}
          >
            {/* Hotspots */}
            {currentSceneData.hotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className={`${styles.hotspot} ${styles[hotspot.type]}`}
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                onClick={() => handleHotspotClick(hotspot)}
                title={hotspot.title}
              >
                <div className={styles.hotspotIcon}>
                  {hotspot.type === 'info' ? 'ℹ️' : '➡️'}
                </div>
                <div className={styles.hotspotPulse}></div>
              </div>
            ))}
          </div>

          {/* Hotspot Info Panel */}
          {selectedHotspot && (
            <div className={styles.infoPanel}>
              <div className={styles.infoPanelHeader}>
                <h4>{selectedHotspot.title}</h4>
                <button 
                  onClick={() => setSelectedHotspot(null)}
                  className={styles.infoPanelClose}
                >
                  ✕
                </button>
              </div>
              <p>{selectedHotspot.content}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <span>💡 Click vào các điểm sáng để khám phá thông tin hoặc di chuyển giữa các khu vực</span>
        </div>
      </div>
    </div>
  );
};

export default VirtualTour;
