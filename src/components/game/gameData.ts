/**
 * 🎮 게임 데이터 정의
 * 캐릭터, 배경, 업적 등
 */

export const CHARACTERS = [
  { id: 'char-default', name: '초보 전사', emoji: '🧑‍💪', price: 0 },
  { id: 'char-knight', name: '기사', emoji: '🛡️', price: 100 },
  { id: 'char-mage', name: '마법사', emoji: '🧙', price: 150 },
  { id: 'char-ninja', name: '닌자', emoji: '🥷', price: 200 },
  { id: 'char-robot', name: '로봇', emoji: '🤖', price: 250 },
  { id: 'char-dragon', name: '드래곤', emoji: '🐉', price: 500 },
];

export const BACKGROUNDS = [
  { id: 'bg-default', name: '심우주', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', price: 0 },
  { id: 'bg-forest', name: '마법의 숲', gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', price: 80 },
  { id: 'bg-sunset', name: '황혼의 도시', gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f59e0b 100%)', price: 120 },
  { id: 'bg-ocean', name: '깊은 바다', gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #06b6d4 100%)', price: 100 },
  { id: 'bg-lava', name: '용암 동굴', gradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #f97316 100%)', price: 200 },
  { id: 'bg-crystal', name: '크리스탈 궁전', gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c084fc 100%)', price: 180 },
];

export const ACHIEVEMENTS = [
  { id: 'ach-first-mission', name: '첫 발걸음', description: '첫 미션을 완료하세요', badge: '🏅', completed: false },
  { id: 'ach-streak-3', name: '3일 연속', description: '3일 연속 미션을 완료하세요', badge: '🔥', completed: false },
  { id: 'ach-level-5', name: '성장의 증거', description: '레벨 5에 도달하세요', badge: '⭐', completed: false },
  { id: 'ach-all-missions', name: '완벽주의자', description: '하루 미션을 모두 완료하세요', badge: '💎', completed: false },
  { id: 'ach-coop-first', name: '팀 플레이어', description: '첫 협동전을 완료하세요', badge: '🤝', completed: false },
  { id: 'ach-pvp-win', name: '승리자', description: '첫 경쟁전에서 승리하세요', badge: '🏆', completed: false },
];
