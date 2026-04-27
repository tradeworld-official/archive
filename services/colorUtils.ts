// services/colorUtils.ts
// 키 컬러 하나로부터 메일 디자인에 필요한 파생 색상들을 자동 계산
// 모든 변환은 HSL 공간에서 진행 (사람의 직관과 일치)

// ============ HEX <-> HSL 변환 ============

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

const hexToHsl = (hex: string): HSL => {
  // # 제거
  let h = hex.replace('#', '');
  // shorthand (#abc) 처리
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      case b:
        hue = (r - g) / d + 4;
        break;
    }
    hue *= 60;
  }

  return {
    h: Math.round(hue),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToHex = ({ h, s, l }: HSL): string => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) =>
    lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

// 값을 0~max 범위로 자르기
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// ============ 파생 색상 계산 ============

export interface DerivedColors {
  primary: string; // 입력받은 키 컬러
  primaryHover: string; // 약간 어두운 버전 (호버 효과 등)
  gradientStart: string; // 그라디언트 시작 (키 컬러 + 한 톤 시원한 쪽)
  gradientMid: string; // 그라디언트 중간 (키 컬러)
  gradientEnd: string; // 그라디언트 끝 (키 컬러 + 한 톤 따뜻한 쪽)
  badgeBg: string; // 옅은 뱃지 배경 (l: 95)
  badgeText: string; // 뱃지 텍스트 (= primary)
}

// 키 컬러 한 개로부터 메일에 필요한 모든 파생 색상 자동 계산
export const deriveColors = (keyColor: string): DerivedColors => {
  const hsl = hexToHsl(keyColor);

  // 그라디언트: 키 컬러 hue를 ±35°씩 이동 + 채도/밝기 조정
  // 채도가 너무 낮으면 그라디언트가 단조로워서 최소값 보장
  const baseS = Math.max(hsl.s, 55);
  const baseL = clamp(hsl.l, 38, 60);

  const gradientStart = hslToHex({
    h: (hsl.h - 35 + 360) % 360,
    s: clamp(baseS - 5, 40, 90),
    l: clamp(baseL - 5, 30, 60),
  });

  const gradientMid = hslToHex({
    h: hsl.h,
    s: baseS,
    l: baseL,
  });

  const gradientEnd = hslToHex({
    h: (hsl.h + 35) % 360,
    s: clamp(baseS + 10, 40, 95),
    l: clamp(baseL + 8, 35, 70),
  });

  // 뱃지 배경: 키 컬러 매우 옅은 버전
  const badgeBg = hslToHex({
    h: hsl.h,
    s: clamp(hsl.s - 30, 15, 60),
    l: 95,
  });

  // 호버: 키 컬러 약간 어두운 버전
  const primaryHover = hslToHex({
    h: hsl.h,
    s: hsl.s,
    l: clamp(hsl.l - 8, 20, 90),
  });

  return {
    primary: keyColor,
    primaryHover,
    gradientStart,
    gradientMid,
    gradientEnd,
    badgeBg,
    badgeText: keyColor,
  };
};

// 기본 키 컬러 (현재 메일 디자인 기준)
export const DEFAULT_KEY_COLOR = '#5a47cf';
