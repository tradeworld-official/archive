// services/emailTemplate.ts
// 영업용 HTML 메일 템플릿 v2
// 모든 텍스트/버튼/색상이 편집 가능. 프로젝트 선택은 EmailBuilder에서 직접 함.

import { Project, Tag } from '../types';
import { DerivedColors, deriveColors, DEFAULT_KEY_COLOR } from './colorUtils';

// ============ 상수 ============

// 메일에 노출할 type 태그 카테고리 매핑 (기본값)
// EmailBuilder에서 카테고리 제목을 변경할 수 있고, 새 type 태그도 여기에 추가하면 됨
export const EMAIL_CATEGORIES: { id: string; defaultName: string; aspectRatio: '16:9' | '4:3' }[] = [
  { id: 'f7933f01-d7c9-49df-89f2-13e6c00364a9', defaultName: '기업홍보영상', aspectRatio: '16:9' },
  { id: '9b18e57e-9deb-4087-b1dd-53a5428dbe2e', defaultName: '카탈로그', aspectRatio: '4:3' },
  { id: '3b648c87-f163-4d4f-8063-c7867e5394dd', defaultName: '웹사이트 · 앱', aspectRatio: '4:3' },
];

const LOGO_WHITE_URL =
  'https://cnjsjkbzxkuxbtlaihcu.supabase.co/storage/v1/object/public/common/logo_tw_white.png';

const PF =
  "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Helvetica Neue',Helvetica,Arial,sans-serif";

// ============ 편집 가능한 필드 인터페이스 ============

export interface CtaButton {
  id: string;
  text: string;
  url: string;
  style: 'solid' | 'outline';
}

export interface FooterInfo {
  companyName: string;
  address: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  homepage: string;
  homepageUrl: string;
  tagline: string;
}

export interface EmailContent {
  headerTitle: string;
  badgeText: string;
  mainHeadline: string;
  introDescription: string;
  categoryTitles: Record<string, string>;
  closingParagraphs: string[];
  topButtons: CtaButton[];
  bottomButtons: CtaButton[];
  footer: FooterInfo;
}

export interface EmailDesign {
  keyColor: string;
}

export interface BuildEmailOptions {
  projects: Project[];
  tags: Tag[];
  content: EmailContent;
  design: EmailDesign;
}

// ============ 기본값 ============

export const DEFAULT_EMAIL_CONTENT: EmailContent = {
  headerTitle: 'Design Works',
  badgeText: '★ 2022 · 2023 · 2024 디자인진흥원 우수 디자인 선도 기업',
  mainHeadline: '내용과 구성, 기술에 초점을 맞춘\n디자인 홍보물의 시작 트레이드월드',
  introDescription:
    '2005년 법인설립부터 20여 년간 중소·중견기업의 홍보영상, 카탈로그, 홈페이지를 제작하며 꾸준히 성장해온 디자인 전문 기업입니다.',
  categoryTitles: {
    'f7933f01-d7c9-49df-89f2-13e6c00364a9': '기업홍보영상',
    '9b18e57e-9deb-4087-b1dd-53a5428dbe2e': '카탈로그',
    '3b648c87-f163-4d4f-8063-c7867e5394dd': '웹사이트 · 앱',
  },
  closingParagraphs: [
    '㈜트레이드월드는 일반 제품의 광고성 시각적 결과물을 넘어 내용과 구성, 기술에 초점을 맞춘 디자인 홍보물 제작 역량을 보유하고 있습니다.',
    '모든 홍보물의 기초가 될 수 있는 전문성 있는 기획·구성과 시각적 노출을 위한 디자인 편집 및 다양한 기법, 툴 활용으로 짜임새 있고 퀄리티 있는 결과물을 만들고 매년 꾸준히 성장하고 있습니다.',
    '단발성이 아닌 지속적 관계로 클라이언트사의 긍정적인 미래지향적 파트너 동역사로서 항시 최선을 다하겠습니다.',
    '감사합니다.',
  ],
  topButtons: [
    {
      id: 'top-1',
      text: '💬 카카오톡 문의하기',
      url: 'http://pf.kakao.com/_xdxbcgn/chat',
      style: 'solid',
    },
    {
      id: 'top-2',
      text: '포트폴리오 전체보기 →',
      url: 'https://archive-puce-one.vercel.app/#/list',
      style: 'outline',
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
    companyName: '㈜트레이드월드',
    address: '서울시 송파구 법원로 128 C동 1311호',
    contactName: '김우영',
    contactRole: '부장',
    phone: '010-2246-1169',
    email: '1030@tradeworld.co.kr',
    homepage: 'www.tradeworld.co.kr',
    homepageUrl: 'https://www.tradeworld.co.kr',
    tagline: 'Design · Video · Web',
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

// ============ 카드 생성 ============

interface CardOptions {
  height: number;
  isLeft: boolean;
  isLastRow: boolean;
}

const buildCard = (project: Project, options: CardOptions): string => {
  const { height, isLeft, isLastRow } = options;
  const bottom = isLastRow ? 6 : 18;
  const padding = isLeft
    ? `padding:0 6px ${bottom}px 0;`
    : `padding:0 0 ${bottom}px 6px;`;

  const title = escapeHtml(project.title);
  const client = escapeHtml(project.client);
  const imageUrl = escapeHtml(project.imageUrl);
  const altText = escapeHtml(`${project.title} - ${project.client}`);

  return `                <td width="50%" valign="top" style="${padding}">
                  <div style="width:100%;height:${height}px;overflow:hidden;border-radius:6px;background-color:#f0f0f0;font-size:0;line-height:0;">
                    <img src="${imageUrl}" alt="${altText}" width="254" height="${height}" style="display:block;width:100%;height:${height}px;object-fit:cover;border:0;">
                  </div>
                  <p style="margin:8px 0 2px 0;font-family:${PF};font-size:13px;font-weight:600;color:#222222;line-height:1.4;text-align:center;">${title}</p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#888888;line-height:1.4;text-align:center;">${client}</p>
                </td>`;
};

// ============ 카테고리 섹션 생성 ============

const buildCategorySection = (
  categoryTitle: string,
  projects: Project[],
  aspectRatio: '16:9' | '4:3',
  colors: DerivedColors
): string => {
  if (projects.length === 0) return '';

  const height = aspectRatio === '16:9' ? 143 : 190;

  const rows: string[] = [];
  for (let i = 0; i < projects.length; i += 2) {
    const left = projects[i];
    const right = projects[i + 1];
    const isLastRow = i + 2 >= projects.length;

    let rowHtml = '              <tr>\n';
    rowHtml += buildCard(left, { height, isLeft: true, isLastRow }) + '\n';
    if (right) {
      rowHtml += buildCard(right, { height, isLeft: false, isLastRow }) + '\n';
    } else {
      rowHtml += `                <td width="50%" valign="top" style="padding:0 0 ${
        isLastRow ? 6 : 18
      }px 6px;"></td>\n`;
    }
    rowHtml += '              </tr>';
    rows.push(rowHtml);
  }

  return `        <!-- ============ ${escapeHtml(categoryTitle)} ============ -->
        <tr>
          <td style="padding:25px 40px 10px 40px;">
            <h2 style="margin:0 0 20px 0;font-family:${PF};font-size:18px;font-weight:700;color:#222222;letter-spacing:-0.3px;line-height:1.2;text-align:center;">
              <span style="display:inline-block;border-bottom:3px solid ${colors.primary};padding-bottom:6px;">${escapeHtml(
                categoryTitle
              )}</span>
            </h2>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${rows.join('\n')}
            </table>
          </td>
        </tr>`;
};

// ============ 그룹핑 ============

export interface CategorizedProjects {
  categoryId: string;
  categoryTitle: string;
  aspectRatio: '16:9' | '4:3';
  projects: Project[];
}

export const groupProjectsByCategory = (
  projects: Project[],
  categoryTitles: Record<string, string>
): CategorizedProjects[] => {
  return EMAIL_CATEGORIES.map(({ id, defaultName, aspectRatio }) => ({
    categoryId: id,
    categoryTitle: categoryTitles[id] || defaultName,
    aspectRatio,
    projects: projects.filter((p) => Array.isArray(p.tags) && p.tags.includes(id)),
  }));
};

// ============ 버튼 행 ============

const buildButtonRow = (buttons: CtaButton[], colors: DerivedColors): string => {
  if (buttons.length === 0) return '';

  const cells: string[] = [];
  buttons.forEach((btn, idx) => {
    const isLast = idx === buttons.length - 1;
    const isSolid = btn.style === 'solid';
    const padding = isSolid ? '13px 28px' : '12px 28px';
    const bg = isSolid ? colors.primary : '#ffffff';
    const color = isSolid ? '#ffffff' : colors.primary;
    const border = isSolid ? '' : `border:1px solid ${colors.primary};`;

    let cellStyle = '';
    if (buttons.length > 1) {
      if (idx === 0) cellStyle = 'padding-right:6px;';
      else if (isLast) cellStyle = 'padding-left:6px;';
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

export const buildEmailHTML = ({
  projects,
  content,
  design,
}: BuildEmailOptions): string => {
  const colors = deriveColors(design.keyColor);

  const grouped = groupProjectsByCategory(projects, content.categoryTitles);
  const sectionsHtml = grouped
    .map((g) => buildCategorySection(g.categoryTitle, g.projects, g.aspectRatio, colors))
    .filter(Boolean)
    .join('\n\n');

  const closingHtml = content.closingParagraphs
    .map((p, idx) => {
      const isLastShort = idx === content.closingParagraphs.length - 1 && p.length < 20;
      const fontWeight = isLastShort ? 'font-weight:600;' : '';
      return `            <p style="margin:0 0 16px 0;font-family:${PF};font-size:14px;line-height:1.85;color:#333333;text-align:center;${fontWeight}">${escapeHtmlMultiline(
        p
      )}</p>`;
    })
    .join('\n');

  const topButtonsHtml = buildButtonRow(content.topButtons, colors);
  const bottomButtonsHtml = buildButtonRow(content.bottomButtons, colors);

  const gradient = `linear-gradient(135deg,${colors.gradientStart} 0%,${colors.gradientMid} 50%,${colors.gradientEnd} 100%)`;

  const f = content.footer;
  const copyrightName = f.companyName.replace(/[㈜()]/g, '').trim().toUpperCase();

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${escapeHtml(f.companyName)} ${escapeHtml(content.headerTitle)}</title>
<!--[if mso]>
<style type="text/css">
  table, td, p, span, h1, h2, a { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif !important; }
</style>
<![endif]-->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" rel="stylesheet">
<style type="text/css">
  body, table, td, p, span, h1, h2, a {
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

        <tr>
          <td align="center" style="background:${gradient};background-color:${colors.gradientMid};padding:60px 40px 56px 40px;text-align:center;color:#ffffff;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td align="center" style="padding-bottom:22px;line-height:0;">
                  <img src="${LOGO_WHITE_URL}" alt="${escapeHtml(f.companyName)}" width="108" height="15" style="display:block;width:108px;height:15px;border:0;margin:0 auto;">
                </td>
              </tr>
            </table>
            <h1 style="margin:0;font-family:${PF};font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;text-align:center;">${escapeHtml(
              content.headerTitle
            )}</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:48px 40px 40px 40px;">

            ${
              content.badgeText
                ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px auto;">
              <tr>
                <td style="background-color:${colors.badgeBg};padding:8px 16px;border-radius:100px;">
                  <p style="margin:0;font-family:${PF};font-size:11px;font-weight:600;color:${colors.badgeText};letter-spacing:0.3px;line-height:1.2;">${escapeHtml(
                    content.badgeText
                  )}</p>
                </td>
              </tr>
            </table>`
                : ''
            }

            <p style="margin:0 0 16px 0;font-family:${PF};font-size:22px;font-weight:700;color:#0e0e10;letter-spacing:-0.6px;line-height:1.4;text-align:center;">
              ${escapeHtmlMultiline(content.mainHeadline)}
            </p>

            <p style="margin:0 0 ${
              content.topButtons.length > 0 ? '36px' : '0'
            } 0;font-family:${PF};font-size:13px;color:#6a6a72;line-height:1.7;text-align:center;">
              ${escapeHtmlMultiline(content.introDescription)}
            </p>

            ${
              content.topButtons.length > 0
                ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
${topButtonsHtml}
            </table>`
                : ''
            }

          </td>
        </tr>

${sectionsHtml}

        <tr>
          <td align="center" style="padding:40px 40px 32px 40px;border-top:1px solid #eeeeee;text-align:center;">
${closingHtml}

            ${
              content.bottomButtons.length > 0
                ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0 auto;">
${bottomButtonsHtml}
            </table>`
                : ''
            }
          </td>
        </tr>

        <tr>
          <td style="background-color:#0e0e10;padding:36px 40px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:18px;border-bottom:1px solid #2a2a2e;">
                  <div style="line-height:0;margin-bottom:10px;"><img src="${LOGO_WHITE_URL}" alt="${escapeHtml(
    f.companyName
  )}" width="140" height="19" style="display:block;width:140px;height:19px;border:0;margin:0;"></div>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#8a8a92;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:left;">${escapeHtml(
    f.tagline
  )}</p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
              <tr>
                <td valign="top" width="55%" style="padding-right:12px;">
                  <p style="margin:0 0 8px 0;font-family:${PF};font-size:10px;color:#5a5a62;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Office</p>
                  <p style="margin:0 0 4px 0;font-family:${PF};font-size:13px;color:#ffffff;font-weight:600;line-height:1.5;">${escapeHtml(
    f.companyName
  )}</p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">${escapeHtml(
    f.address
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
                    f.homepageUrl
                  )}" style="font-family:${PF};font-size:11px;color:#8a8a92;text-decoration:none;letter-spacing:1px;">${escapeHtml(
    f.homepage
  )}</a>
                  <p style="margin:6px 0 0 0;font-family:${PF};font-size:10px;color:#4a4a52;letter-spacing:0.5px;">© ${new Date().getFullYear()} ${escapeHtml(
    copyrightName
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
