// services/exhibitionEmailTemplate.ts
// 해외 전시 영업 메일 템플릿
// - 자유 섹션 구조 (디자인 영업 메일과 동일 패턴)
// - 각 섹션은 1컬럼 또는 2컬럼 레이아웃
// - 각 전시 카드는 기본/상세 모드 토글
// - 헤더/푸터/색상 시스템은 디자인 영업 메일과 통일

import { Exhibition } from '../types';
import { DerivedColors, deriveColors, DEFAULT_KEY_COLOR } from './colorUtils';

// ============ 자산 / 고정값 ============

const LOGO_WHITE_URL =
  'https://cnjsjkbzxkuxbtlaihcu.supabase.co/storage/v1/object/public/common/logo_tw_white.png';

const PF =
  "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Helvetica Neue',Helvetica,Arial,sans-serif";

const COMPANY_FIXED = {
  companyName: '㈜트레이드월드',
  address: '서울시 송파구 법원로 128 C동 1311호',
  homepage: 'www.tradeworld.co.kr',
  homepageUrl: 'https://www.tradeworld.co.kr',
  tagline: 'Global Exhibition Agency',
  copyrightName: 'TRADEWORLD',
};

// ============ 데이터 모델 ============

export type SectionLayout = '1col' | '2col';
export type DetailLevel = 'basic' | 'detailed';

export interface ExhibitionCardSlot {
  id: string;
  exhibitionId: string | null; // null이면 빈 카드
  detailLevel: DetailLevel;
  // 메일 한 통에서만 임시로 다르게 표시하고 싶을 때 사용 (DB는 안 바꿈)
  overrides?: Partial<Pick<Exhibition, 'name' | 'nameEn' | 'description'>>;
}

export interface ExhibitionSection {
  id: string;
  layout: SectionLayout;
  slots: ExhibitionCardSlot[]; // 1col은 보통 1개씩, 2col은 2개씩 묶음
}

export interface CtaButton {
  id: string;
  text: string;
  url: string;
  style: 'solid' | 'outline';
}

export interface FooterEditable {
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
}

export interface ExhibitionEmailContent {
  // 헤더 (감성/이슈 후킹)
  hookOverline: string;       // 윗줄 작은 카피 (예: "국제 정세 불확실성 속")
  hookHeadline: string;       // 메인 후킹 카피 (예: "베트남 호치민에서")
  hookAction: string;         // 액션 (예: "참가기업 지원 전격 확대")

  // 도입부 (어필 포인트 체크리스트)
  appealPoints: string[];

  // 섹션 (전시 카드들)
  sections: ExhibitionSection[];

  // 신청/접수 안내
  applyTitle: string;             // 예: "신청 및 접수"
  applyMethod: string;            // 신청 방법 안내
  applyAgencyName: string;        // 공식 대행사 (예: "트레이드월드")
  applyContactPhone: string;
  applyContactEmail: string;
  applyUrl: string;               // 신청 페이지 (있을 경우)

  // 클로징
  closingParagraphs: string[];

  // 버튼
  topButtons: CtaButton[];
  bottomButtons: CtaButton[];

  // 푸터 (편집 가능 부분만)
  footer: FooterEditable;
}

export interface EmailDesign {
  keyColor: string;
}

export interface BuildExhibitionEmailOptions {
  exhibitionMap: Map<string, Exhibition>;
  content: ExhibitionEmailContent;
  design: EmailDesign;
}

// ============ 기본값 ============

export const createDefaultSection = (layout: SectionLayout = '1col'): ExhibitionSection => {
  const slotCount = layout === '1col' ? 1 : 2;
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    layout,
    slots: Array.from({ length: slotCount }, (_, i) => ({
      id: `slot-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
      exhibitionId: null,
      detailLevel: 'basic' as DetailLevel,
    })),
  };
};

export const DEFAULT_EXHIBITION_EMAIL_CONTENT: ExhibitionEmailContent = {
  hookOverline: '국제 정세 불확실성 속',
  hookHeadline: '베트남 호치민에서',
  hookAction: '참가기업 지원 전격 확대',
  appealPoints: [
    '최적의 베트남 시장 개척지',
    '글로벌 네트워킹의 장',
    '참가자 원스톱 홍보 플랫폼',
    '전시 참가비용은 고작 1,300,000원!!',
    '자부담 통역료 한-베 통역원 지원',
  ],
  sections: [createDefaultSection('1col'), createDefaultSection('2col')],
  applyTitle: '신청 및 접수',
  applyMethod: '신청서 작성 후 회신',
  applyAgencyName: '트레이드월드',
  applyContactPhone: '070-4610-3453',
  applyContactEmail: 'paul@tradeworld.co.kr',
  applyUrl: '',
  closingParagraphs: [
    '글로벌 시장 진출을 위한 최적의 발판, 트레이드월드와 함께하세요.',
    '문의는 위 연락처 또는 메일로 부탁드립니다.',
  ],
  topButtons: [
    {
      id: 'top-1',
      text: '💬 카카오톡 문의하기',
      url: 'http://pf.kakao.com/_xdxbcgn/chat',
      style: 'solid',
    },
  ],
  bottomButtons: [
    {
      id: 'bottom-1',
      text: '홈페이지 바로가기',
      url: 'https://www.tradeworld.co.kr',
      style: 'solid',
    },
  ],
  footer: {
    contactName: '박정민',
    contactRole: '팀장',
    phone: '070-4610-3453',
    email: 'paul@tradeworld.co.kr',
  },
};

export const DEFAULT_EMAIL_DESIGN: EmailDesign = {
  keyColor: DEFAULT_KEY_COLOR,
};

// ============ 유틸 ============

const escapeHtml = (s: string): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeHtmlMultiline = (s: string): string =>
  escapeHtml(s).replace(/\n/g, '<br>');

const formatDateRange = (start?: string, end?: string): string => {
  if (!start && !end) return '';
  if (start && end) {
    // 같은 달이면 "2026.06.24 ~ 06.26", 다르면 풀 표기
    const s = start.split('-');
    const e = end.split('-');
    if (s[0] === e[0] && s[1] === e[1]) {
      return `${s[0]}.${s[1]}.${s[2]} ~ ${e[2]}`;
    }
    return `${s[0]}.${s[1]}.${s[2]} ~ ${e[0]}.${e[1]}.${e[2]}`;
  }
  return start || end || '';
};

const formatVenue = (ex: Exhibition): string => {
  return [ex.venueCountry, ex.venueCity, ex.venueName].filter(Boolean).join(' · ');
};

// ============ 카드 생성 ============

const buildExhibitionCard = (
  ex: Exhibition,
  slot: ExhibitionCardSlot,
  layout: SectionLayout,
  colors: DerivedColors,
  isLeft: boolean,
  isLastInRow: boolean
): string => {
  const isWide = layout === '1col';
  const cardWidth = isWide ? 520 : 254;
  const imageHeight = isWide ? 280 : 143;
  const name = escapeHtml(slot.overrides?.name ?? ex.name);
  const nameEn = escapeHtml(slot.overrides?.nameEn ?? ex.nameEn ?? '');
  const venue = escapeHtml(formatVenue(ex));
  const dateRange = escapeHtml(formatDateRange(ex.startDate, ex.endDate));
  const isDetailed = slot.detailLevel === 'detailed';

  // 셀 패딩
  const cellStyle = isWide
    ? 'padding:0 0 24px 0;'
    : isLeft
    ? 'padding:0 6px 24px 0;'
    : 'padding:0 0 24px 6px;';

  // 갤러리 (상세 모드 + 1컬럼일 때만)
  const galleryHtml =
    isDetailed && isWide && ex.gallery && ex.gallery.length > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
          <tr>
${ex.gallery
  .slice(0, 3)
  .map(
    (g, idx) =>
      `              <td width="33.33%" style="${
        idx < 2 ? 'padding-right:6px;' : ''
      }"><img src="${escapeHtml(g)}" alt="" width="170" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:4px;border:0;"></td>`
  )
  .join('\n')}
          </tr>
        </table>`
      : '';

  // 로고 (있을 때만)
  const logoHtml = ex.logoUrl
    ? `<img src="${escapeHtml(ex.logoUrl)}" alt="${name} logo" style="display:inline-block;max-height:32px;width:auto;border:0;margin-right:8px;vertical-align:middle;">`
    : '';

  // 상세 정보 표
  const detailsHtml =
    isDetailed && ex.customFields && ex.customFields.length > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;background-color:#f8f8fa;border-radius:6px;">
${ex.customFields
  .filter((cf) => cf.label && cf.value)
  .map(
    (cf, idx, arr) => `          <tr>
            <td style="padding:${idx === 0 ? '12px 14px 6px 14px' : '6px 14px'};${
      idx === arr.length - 1 ? 'padding-bottom:12px;' : ''
    }font-family:${PF};font-size:12px;color:#5a5a62;width:90px;vertical-align:top;font-weight:600;">${escapeHtml(
      cf.label
    )}</td>
            <td style="padding:${idx === 0 ? '12px 14px 6px 0' : '6px 14px 6px 0'};${
      idx === arr.length - 1 ? 'padding-bottom:12px;' : ''
    }font-family:${PF};font-size:12px;color:#222222;line-height:1.5;">${escapeHtmlMultiline(cf.value)}</td>
          </tr>`
  )
  .join('\n')}
        </table>`
      : '';

  // 기본정보 (이름 / 일정·장소)
  const titleSize = isWide ? 18 : 15;
  const titleHtml = `<div style="font-family:${PF};font-size:${titleSize}px;font-weight:700;color:#0e0e10;line-height:1.3;letter-spacing:-0.3px;margin-bottom:4px;">
        ${logoHtml}<span>${name}</span>
      </div>${
        nameEn
          ? `<div style="font-family:${PF};font-size:11px;color:#888;margin-bottom:8px;letter-spacing:0.3px;">${nameEn}</div>`
          : ''
      }`;

  const metaHtml = `<div style="font-family:${PF};font-size:12px;color:#5a5a62;line-height:1.6;margin-top:6px;">
        ${dateRange ? `📅 ${dateRange}` : ''}${dateRange && venue ? '<br>' : ''}${
    venue ? `📍 ${venue}` : ''
  }
      </div>`;

  return `                <td ${
    isWide ? '' : 'width="50%"'
  } valign="top" style="${cellStyle}">
                  <div style="background-color:#ffffff;border:1px solid #e8e8ec;border-radius:8px;overflow:hidden;">
                    <img src="${escapeHtml(ex.imageUrl)}" alt="${name}" width="${cardWidth}" height="${imageHeight}" style="display:block;width:100%;height:${imageHeight}px;object-fit:cover;border:0;">
                    <div style="padding:14px 16px;">
                      ${titleHtml}
                      ${metaHtml}
                      ${galleryHtml}
                      ${detailsHtml}
                    </div>
                  </div>
                </td>`;
};

const buildEmptyCell = (layout: SectionLayout, isLeft: boolean): string => {
  const cellStyle =
    layout === '1col'
      ? 'padding:0 0 24px 0;'
      : isLeft
      ? 'padding:0 6px 24px 0;'
      : 'padding:0 0 24px 6px;';
  return `                <td ${
    layout === '2col' ? 'width="50%"' : ''
  } valign="top" style="${cellStyle}"></td>`;
};

// ============ 섹션 ============

const buildSection = (
  section: ExhibitionSection,
  exhibitionMap: Map<string, Exhibition>,
  colors: DerivedColors
): string => {
  // 채워진 슬롯만 추림
  const filledSlots = section.slots
    .map((s) => ({ slot: s, ex: s.exhibitionId ? exhibitionMap.get(s.exhibitionId) : null }))
    .filter((x) => x.ex) as { slot: ExhibitionCardSlot; ex: Exhibition }[];

  if (filledSlots.length === 0) return '';

  const rows: string[] = [];

  if (section.layout === '1col') {
    // 1컬럼: 한 줄에 한 카드
    filledSlots.forEach(({ slot, ex }) => {
      rows.push(`              <tr>
${buildExhibitionCard(ex, slot, '1col', colors, true, true)}
              </tr>`);
    });
  } else {
    // 2컬럼: 한 줄에 두 카드
    for (let i = 0; i < filledSlots.length; i += 2) {
      const left = filledSlots[i];
      const right = filledSlots[i + 1];
      let rowHtml = '              <tr>\n';
      rowHtml += buildExhibitionCard(left.ex, left.slot, '2col', colors, true, !right) + '\n';
      if (right) {
        rowHtml += buildExhibitionCard(right.ex, right.slot, '2col', colors, false, true) + '\n';
      } else {
        rowHtml += buildEmptyCell('2col', false) + '\n';
      }
      rowHtml += '              </tr>';
      rows.push(rowHtml);
    }
  }

  return `        <tr>
          <td style="padding:25px 40px 0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${rows.join('\n')}
            </table>
          </td>
        </tr>`;
};

// ============ 어필 포인트 (체크리스트) ============

const buildAppealPoints = (points: string[], colors: DerivedColors): string => {
  if (points.length === 0) return '';

  return points
    .map(
      (p) => `              <tr>
                <td style="padding:6px 0;font-family:${PF};font-size:13px;color:#222222;line-height:1.6;">
                  <span style="color:${colors.primary};font-weight:700;margin-right:6px;">+</span>${escapeHtmlMultiline(
        p
      )}
                </td>
              </tr>`
    )
    .join('\n');
};

// ============ 신청/접수 박스 ============

const buildApplyBox = (content: ExhibitionEmailContent, colors: DerivedColors): string => {
  return `        <tr>
          <td style="padding:30px 40px 10px 40px;">
            <div style="background-color:${colors.badgeBg};border-radius:8px;padding:20px 24px;">
              <h3 style="margin:0 0 14px 0;font-family:${PF};font-size:14px;font-weight:700;color:${colors.primary};letter-spacing:-0.2px;">${escapeHtml(
                content.applyTitle
              )}</h3>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#5a5a62;width:90px;vertical-align:top;font-weight:600;">신청 방법</td>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#222222;line-height:1.5;">${escapeHtmlMultiline(
    content.applyMethod
  )}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#5a5a62;width:90px;vertical-align:top;font-weight:600;">공식 대행사</td>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#222222;line-height:1.5;">${escapeHtml(
    content.applyAgencyName
  )}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#5a5a62;width:90px;vertical-align:top;font-weight:600;">연락처</td>
                  <td style="padding:4px 0;font-family:${PF};font-size:12px;color:#222222;line-height:1.5;">
                    <a href="tel:${escapeHtml(
                      content.applyContactPhone
                    )}" style="color:#222222;text-decoration:none;">${escapeHtml(content.applyContactPhone)}</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:${escapeHtml(
                      content.applyContactEmail
                    )}" style="color:#222222;text-decoration:none;">${escapeHtml(content.applyContactEmail)}</a>
                  </td>
                </tr>
              </table>
              ${
                content.applyUrl
                  ? `<div style="margin-top:14px;text-align:center;">
                <a href="${escapeHtml(
                  content.applyUrl
                )}" style="display:inline-block;background-color:${colors.primary};color:#ffffff;text-decoration:none;padding:11px 24px;font-family:${PF};font-size:13px;font-weight:600;border-radius:100px;">신청 페이지로 이동 →</a>
              </div>`
                  : ''
              }
            </div>
          </td>
        </tr>`;
};

// ============ 버튼 ============

const buildButtonRow = (buttons: CtaButton[], colors: DerivedColors): string => {
  if (buttons.length === 0) return '';
  const cells: string[] = [];
  buttons.forEach((btn, idx) => {
    const isSolid = btn.style === 'solid';
    const padding = isSolid ? '13px 28px' : '12px 28px';
    const bg = isSolid ? colors.primary : '#ffffff';
    const color = isSolid ? '#ffffff' : colors.primary;
    const border = isSolid ? '' : `border:1px solid ${colors.primary};`;
    let cellStyle = '';
    if (buttons.length > 1) {
      if (idx === 0) cellStyle = 'padding-right:6px;';
      else if (idx === buttons.length - 1) cellStyle = 'padding-left:6px;';
      else cellStyle = 'padding:0 6px;';
    }
    cells.push(`                <td align="center" style="${cellStyle}">
                  <a href="${escapeHtml(btn.url)}" style="display:inline-block;background-color:${bg};color:${color};text-decoration:none;padding:${padding};font-family:${PF};font-size:13px;font-weight:600;letter-spacing:-0.2px;border-radius:100px;${border}">${escapeHtml(
      btn.text
    )}</a>
                </td>`);
  });
  return `              <tr>
${cells.join('\n')}
              </tr>`;
};

// ============ 메일 HTML 빌드 ============

export const buildExhibitionEmailHTML = ({
  exhibitionMap,
  content,
  design,
}: BuildExhibitionEmailOptions): string => {
  const colors = deriveColors(design.keyColor);
  const C = COMPANY_FIXED;
  const f = content.footer;

  const sectionsHtml = content.sections
    .map((s) => buildSection(s, exhibitionMap, colors))
    .filter(Boolean)
    .join('\n');

  const appealHtml = buildAppealPoints(content.appealPoints, colors);
  const applyHtml = buildApplyBox(content, colors);

  const closingHtml = content.closingParagraphs
    .map(
      (p) =>
        `            <p style="margin:0 0 14px 0;font-family:${PF};font-size:13px;line-height:1.85;color:#333333;text-align:center;">${escapeHtmlMultiline(
          p
        )}</p>`
    )
    .join('\n');

  const topButtonsHtml = buildButtonRow(content.topButtons, colors);
  const bottomButtonsHtml = buildButtonRow(content.bottomButtons, colors);

  const gradient = `linear-gradient(135deg,${colors.gradientStart} 0%,${colors.gradientMid} 50%,${colors.gradientEnd} 100%)`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${escapeHtml(C.companyName)} 해외 전시 영업</title>
<!--[if mso]>
<style type="text/css">
  table, td, p, span, h1, h2, h3, a { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif !important; }
</style>
<![endif]-->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" rel="stylesheet">
<style type="text/css">
  body, table, td, p, span, h1, h2, h3, a {
    font-family: ${PF};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  img { -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:${PF};">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:20px 0;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;max-width:600px;width:100%;">

        <!-- 헤더 (이슈/감성 후킹) -->
        <tr>
          <td align="center" style="background:${gradient};background-color:${colors.gradientMid};padding:50px 40px;text-align:center;color:#ffffff;">
            <p style="margin:0 0 6px 0;font-family:${PF};font-size:13px;color:rgba(255,255,255,0.9);letter-spacing:0.3px;font-weight:500;">${escapeHtml(
              content.hookOverline
            )}</p>
            <h1 style="margin:0 0 6px 0;font-family:${PF};font-size:34px;font-weight:800;color:#ffffff;letter-spacing:-0.8px;line-height:1.2;">${escapeHtml(
              content.hookHeadline
            )}</h1>
            <p style="margin:0;font-family:${PF};font-size:14px;color:rgba(255,255,255,0.95);font-weight:600;letter-spacing:0.2px;">${escapeHtml(
              content.hookAction
            )}</p>
          </td>
        </tr>

        <!-- 어필 포인트 (체크리스트) -->
        <tr>
          <td style="padding:36px 40px 20px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${appealHtml}
            </table>
          </td>
        </tr>

        ${
          content.topButtons.length > 0
            ? `<!-- 상단 버튼 -->
        <tr>
          <td style="padding:0 40px 25px 40px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
${topButtonsHtml}
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- 전시 섹션들 -->
${sectionsHtml}

        <!-- 신청/접수 -->
${applyHtml}

        <!-- 클로징 -->
        <tr>
          <td align="center" style="padding:30px 40px 30px 40px;border-top:1px solid #eeeeee;text-align:center;">
${closingHtml}

            ${
              content.bottomButtons.length > 0
                ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0 auto;">
${bottomButtonsHtml}
            </table>`
                : ''
            }
          </td>
        </tr>

        <!-- 푸터 -->
        <tr>
          <td style="background-color:#0e0e10;padding:36px 40px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:18px;border-bottom:1px solid #2a2a2e;">
                  <div style="line-height:0;margin-bottom:10px;"><img src="${LOGO_WHITE_URL}" alt="${escapeHtml(
    C.companyName
  )}" width="140" height="19" style="display:block;width:140px;height:19px;border:0;margin:0;"></div>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#8a8a92;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:left;">${escapeHtml(
    C.tagline
  )}</p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
              <tr>
                <td valign="top" width="55%" style="padding-right:12px;">
                  <p style="margin:0 0 8px 0;font-family:${PF};font-size:10px;color:#5a5a62;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Office</p>
                  <p style="margin:0 0 4px 0;font-family:${PF};font-size:13px;color:#ffffff;font-weight:600;line-height:1.5;">${escapeHtml(
    C.companyName
  )}</p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">${escapeHtml(
    C.address
  )}</p>
                </td>
                <td valign="top" width="45%" style="padding-left:12px;border-left:1px solid #2a2a2e;">
                  <p style="margin:0 0 8px 0;font-family:${PF};font-size:10px;color:#5a5a62;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Contact</p>
                  <p style="margin:0 0 4px 0;font-family:${PF};font-size:13px;color:#ffffff;font-weight:600;line-height:1.5;">${escapeHtml(
    f.contactName
  )} <span style="font-weight:400;color:#a8a8b0;">${escapeHtml(f.contactRole)}</span></p>
                  <p style="margin:0 0 2px 0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">
                    <a href="tel:${escapeHtml(f.phone)}" style="color:#a8a8b0;text-decoration:none;">${escapeHtml(
    f.phone
  )}</a>
                  </p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">
                    <a href="mailto:${escapeHtml(f.email)}" style="color:#a8a8b0;text-decoration:none;">${escapeHtml(
    f.email
  )}</a>
                  </p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
              <tr>
                <td style="padding-top:18px;border-top:1px solid #2a2a2e;text-align:center;">
                  <a href="${escapeHtml(
                    C.homepageUrl
                  )}" style="font-family:${PF};font-size:11px;color:#8a8a92;text-decoration:none;letter-spacing:1px;">${escapeHtml(
    C.homepage
  )}</a>
                  <p style="margin:6px 0 0 0;font-family:${PF};font-size:10px;color:#4a4a52;letter-spacing:0.5px;">© ${new Date().getFullYear()} ${escapeHtml(
    C.copyrightName
  )}. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
};
