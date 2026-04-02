// src/components/game/gameData.ts

export interface CharacterItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';

  /**
   * 나중에 픽셀 아트 도입 시 여기만 바꾸면 됨.
   * 예:
   * imageSrc?: '/assets/game/characters/char-default.png'
   */
  imageSrc?: string;
}

export interface BackgroundItem {
  id: string;
  name: string;
  gradient: string;
  price: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';

  /**
   * 나중에 픽셀 배경 도입 시 여기만 바꾸면 됨.
   * 예:
   * imageSrc?: '/assets/game/backgrounds/bg-default.png'
   */
  imageSrc?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  badge: string;
}

//
// 중요:
// 아래 id / price / rarity 는 백엔드 app/services/game_catalog.py 와 맞춰야 함
//

export const CHARACTERS: CharacterItem[] = [
  {
    id: 'char-default',
    name: '기본 전사',
    emoji: '🧑‍💪',
    price: 0,
    rarity: 'common',
  },
  {
    id: 'char-bunny',
    name: '토끼 모험가',
    emoji: '🐰',
    price: 100,
    rarity: 'common',
  },
  {
    id: 'char-bear',
    name: '곰 전사',
    emoji: '🐻',
    price: 250,
    rarity: 'rare',
  },
  {
    id: 'char-cat',
    name: '고양이 닌자',
    emoji: '🐱',
    price: 400,
    rarity: 'epic',
  },
  {
    id: 'char-dragon',
    name: '드래곤 기사',
    emoji: '🐲',
    price: 700,
    rarity: 'legendary',
  },
];

export const BACKGROUNDS: BackgroundItem[] = [
  {
    id: 'bg-default',
    name: '기본 초원',
    gradient: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 45%, #111827 100%)',
    price: 0,
    rarity: 'common',
  },
  {
    id: 'bg-sky',
    name: '하늘 정원',
    gradient: 'linear-gradient(180deg, #0ea5e9 0%, #22c55e 45%, #0f172a 100%)',
    price: 150,
    rarity: 'common',
  },
  {
    id: 'bg-sunset',
    name: '노을 평원',
    gradient: 'linear-gradient(180deg, #f97316 0%, #ef4444 45%, #111827 100%)',
    price: 300,
    rarity: 'rare',
  },
  {
    id: 'bg-night',
    name: '별밤 마을',
    gradient: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 45%, #020617 100%)',
    price: 500,
    rarity: 'epic',
  },
  {
    id: 'bg-galaxy',
    name: '은하 신전',
    gradient: 'linear-gradient(180deg, #581c87 0%, #7e22ce 45%, #030712 100%)',
    price: 800,
    rarity: 'legendary',
  },
];

export const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'achv-first',
    title: '첫 도전',
    description: '첫 AI 미션 완료',
    badge: '🥉',
  },
  {
    id: 'achv-streak',
    title: '꾸준한 기록자',
    description: '연속 미션 완료',
    badge: '🥈',
  },
  {
    id: 'achv-master',
    title: '챌린지 마스터',
    description: '다수의 미션 완료',
    badge: '🥇',
  },
];