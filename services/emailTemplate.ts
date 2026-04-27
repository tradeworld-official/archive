// services/emailTemplate.ts
// 메일 빌더에서 사용하는 HTML 템플릿 생성 함수
// 디자인은 기존 정적 메일과 동일하게 유지

import { Project, Tag } from '../types';

// ============ 상수 (필요 시 환경변수로 분리 가능) ============

// 메일에 노출할 type 태그 카테고리 매핑 (UUID는 tags 테이블의 id)
// type 태그가 새로 생기면 여기에 추가
export const EMAIL_CATEGORIES: { id: string; name: string; aspectRatio: '16:9' | '4:3' }[] = [
  { id: 'f7933f01-d7c9-49df-89f2-13e6c00364a9', name: '기업홍보영상', aspectRatio: '16:9' },
  { id: '9b18e57e-9deb-4087-b1dd-53a5428dbe2e', name: '카탈로그', aspectRatio: '4:3' },
  { id: '3b648c87-f163-4d4f-8063-c7867e5394dd', name: '웹사이트 · 앱', aspectRatio: '4:3' },
];

// 카테고리당 최대 노출 개수 (스팸 위험 방지)
export const MAX_PER_CATEGORY = 12;

// 메일 자산
const LOGO_WHITE_URL =
  'https://cnjsjkbzxkuxbtlaihcu.supabase.co/storage/v1/object/public/common/logo_tw_white.png';

const LINK_INQUIRY = 'http://pf.kakao.com/_xdxbcgn/chat';
const LINK_ARCHIVE = 'https://archive-puce-one.vercel.app/#/list';
const LINK_HOMEPAGE = 'https://www.tradeworld.co.kr';

const PF =
  "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Helvetica Neue',Helvetica,Arial,sans-serif";

// ============ 유틸 ============

// HTML 특수문자 이스케이프 (XSS 방지 + 메일 깨짐 방지)
const escapeHtml = (s: string): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ============ 카드 생성 ============

interface CardOptions {
  height: number; // 예: 16:9 → 143, 4:3 → 190
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
  categoryName: string,
  projects: Project[],
  aspectRatio: '16:9' | '4:3'
): string => {
  if (projects.length === 0) return ''; // 빈 카테고리는 섹션 자체 숨김

  const height = aspectRatio === '16:9' ? 143 : 190;

  // 2열 그리드: 2개씩 묶어서 row 생성
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
      // 홀수 개일 때 빈 셀로 채워서 레이아웃 유지
      rowHtml += `                <td width="50%" valign="top" style="padding:0 0 ${
        isLastRow ? 6 : 18
      }px 6px;"></td>\n`;
    }
    rowHtml += '              </tr>';
    rows.push(rowHtml);
  }

  return `        <!-- ============ ${escapeHtml(categoryName)} ============ -->
        <tr>
          <td style="padding:25px 40px 10px 40px;">
            <h2 style="margin:0 0 20px 0;font-family:${PF};font-size:18px;font-weight:700;color:#222222;letter-spacing:-0.3px;line-height:1.2;text-align:center;">
              <span style="display:inline-block;border-bottom:3px solid #5a47cf;padding-bottom:6px;">${escapeHtml(
                categoryName
              )}</span>
            </h2>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${rows.join('\n')}
            </table>
          </td>
        </tr>`;
};

// ============ 그룹핑: featured 프로젝트를 카테고리별로 분류 ============

export interface CategorizedProjects {
  categoryId: string;
  categoryName: string;
  aspectRatio: '16:9' | '4:3';
  projects: Project[];
}

export const groupProjectsByCategory = (
  projects: Project[],
  _tags: Tag[] // 인터페이스 일관성용 (현재는 EMAIL_CATEGORIES 매핑만 사용)
): CategorizedProjects[] => {
  // 1) featured만 추리고 created_at 최신순 정렬
  // (DB에서 정렬해서 가져오는 것을 권장하지만, 여기서도 안전망으로 한 번 더)
  const featured = projects
    .filter((p) => p.featured)
    .sort((a, b) => {
      const aTime = (a as any).created_at || '';
      const bTime = (b as any).created_at || '';
      return bTime.localeCompare(aTime);
    });

  // 2) 카테고리 순서대로 분류, 각 카테고리당 최대 MAX_PER_CATEGORY개
  return EMAIL_CATEGORIES.map(({ id, name, aspectRatio }) => ({
    categoryId: id,
    categoryName: name,
    aspectRatio,
    projects: featured
      .filter((p) => Array.isArray(p.tags) && p.tags.includes(id))
      .slice(0, MAX_PER_CATEGORY),
  }));
};

// ============ 메일 HTML 빌드 ============

export interface BuildEmailOptions {
  projects: Project[];
  tags: Tag[];
}

export const buildEmailHTML = ({ projects, tags }: BuildEmailOptions): string => {
  const grouped = groupProjectsByCategory(projects, tags);

  const sectionsHtml = grouped
    .map((g) => buildCategorySection(g.categoryName, g.projects, g.aspectRatio))
    .filter(Boolean)
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>트레이드월드 Design Works</title>
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
<!--
================================================================================
  ㈜트레이드월드 영업용 HTML 메일 (Supabase featured 데이터 기반 자동 생성)
================================================================================
-->
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:${PF};">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:20px 0;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;max-width:600px;width:100%;">

        <!-- ============ 헤더 ============ -->
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#3a4ed6 0%,#7d3fc8 50%,#e85a8c 100%);background-color:#5a47cf;padding:60px 40px 56px 40px;text-align:center;color:#ffffff;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td align="center" style="padding-bottom:22px;line-height:0;">
                  <img src="${LOGO_WHITE_URL}" alt="tradeworld" width="108" height="15" style="display:block;width:108px;height:15px;border:0;margin:0 auto;">
                </td>
              </tr>
            </table>
            <h1 style="margin:0;font-family:${PF};font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;text-align:center;">Design Works</h1>
          </td>
        </tr>

        <!-- ============ 회사 소개 ============ -->
        <tr>
          <td style="padding:48px 40px 40px 40px;">

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px auto;">
              <tr>
                <td style="background-color:#f3f0ff;padding:8px 16px;border-radius:100px;">
                  <p style="margin:0;font-family:${PF};font-size:11px;font-weight:600;color:#5a47cf;letter-spacing:0.3px;line-height:1.2;">★ 2022 · 2023 · 2024 디자인진흥원 우수 디자인 선도 기업</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px 0;font-family:${PF};font-size:22px;font-weight:700;color:#0e0e10;letter-spacing:-0.6px;line-height:1.4;text-align:center;">
              내용과 구성, 기술에 초점을 맞춘<br>디자인 홍보물의 시작 <span style="color:#5a47cf;">트레이드월드</span>
            </p>

            <p style="margin:0 0 36px 0;font-family:${PF};font-size:13px;color:#6a6a72;line-height:1.7;text-align:center;">
              2005년 법인설립부터 20여 년간 중소·중견기업의 홍보영상, 카탈로그, 홈페이지를 제작하며 꾸준히 성장해온 디자인 전문 기업입니다.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td align="center" style="padding-right:6px;">
                  <a href="${LINK_INQUIRY}" style="display:inline-block;background-color:#5a47cf;color:#ffffff;text-decoration:none;padding:13px 28px;font-family:${PF};font-size:13px;font-weight:600;letter-spacing:-0.2px;border-radius:100px;">💬 카카오톡 문의하기</a>
                </td>
                <td align="center" style="padding-left:6px;">
                  <a href="${LINK_ARCHIVE}" style="display:inline-block;background-color:#ffffff;color:#5a47cf;text-decoration:none;padding:12px 28px;font-family:${PF};font-size:13px;font-weight:600;letter-spacing:-0.2px;border-radius:100px;border:1px solid #5a47cf;">포트폴리오 전체보기 →</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

${sectionsHtml}

        <!-- ============ 클로징 메시지 ============ -->
        <tr>
          <td align="center" style="padding:40px 40px 32px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0 0 16px 0;font-family:${PF};font-size:14px;line-height:1.85;color:#333333;text-align:center;">
              <strong style="color:#222222;">㈜트레이드월드</strong>는 일반 제품의 광고성 시각적 결과물을 넘어 <strong style="color:#5a47cf;">내용과 구성, 기술에 초점을 맞춘 디자인 홍보물 제작 역량</strong>을 보유하고 있습니다.
            </p>
            <p style="margin:0 0 16px 0;font-family:${PF};font-size:14px;line-height:1.85;color:#333333;text-align:center;">
              모든 홍보물의 기초가 될 수 있는 전문성 있는 기획·구성과 시각적 노출을 위한 디자인 편집 및 다양한 기법, 툴 활용으로 짜임새 있고 퀄리티 있는 결과물을 만들고 매년 꾸준히 성장하고 있습니다.
            </p>
            <p style="margin:0 0 16px 0;font-family:${PF};font-size:14px;line-height:1.85;color:#333333;text-align:center;">
              단발성이 아닌 지속적 관계로 클라이언트사의 긍정적인 미래지향적 파트너 동역사로서 항시 최선을 다하겠습니다.
            </p>
            <p style="margin:0;font-family:${PF};font-size:14px;line-height:1.85;color:#333333;font-weight:600;text-align:center;">감사합니다.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0 auto;">
              <tr>
                <td align="center">
                  <a href="${LINK_HOMEPAGE}" style="display:inline-block;background-color:#5a47cf;color:#ffffff;text-decoration:none;padding:13px 36px;font-family:${PF};font-size:13px;font-weight:600;letter-spacing:-0.2px;border-radius:100px;">홈페이지 바로가기</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ 푸터 ============ -->
        <tr>
          <td style="background-color:#0e0e10;padding:36px 40px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:18px;border-bottom:1px solid #2a2a2e;">
                  <div style="line-height:0;margin-bottom:10px;"><img src="${LOGO_WHITE_URL}" alt="tradeworld" width="140" height="19" style="display:block;width:140px;height:19px;border:0;margin:0;"></div>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#8a8a92;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:left;">Design · Video · Web</p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
              <tr>
                <td valign="top" width="55%" style="padding-right:12px;">
                  <p style="margin:0 0 8px 0;font-family:${PF};font-size:10px;color:#5a5a62;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Office</p>
                  <p style="margin:0 0 4px 0;font-family:${PF};font-size:13px;color:#ffffff;font-weight:600;line-height:1.5;">㈜트레이드월드</p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">서울시 송파구 법원로 128 C동 1311호</p>
                </td>
                <td valign="top" width="45%" style="padding-left:12px;border-left:1px solid #2a2a2e;">
                  <p style="margin:0 0 8px 0;font-family:${PF};font-size:10px;color:#5a5a62;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Contact</p>
                  <p style="margin:0 0 4px 0;font-family:${PF};font-size:13px;color:#ffffff;font-weight:600;line-height:1.5;">김우영 <span style="font-weight:400;color:#a8a8b0;">부장</span></p>
                  <p style="margin:0 0 2px 0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">
                    <a href="tel:010-2246-1169" style="color:#a8a8b0;text-decoration:none;">010-2246-1169</a>
                  </p>
                  <p style="margin:0;font-family:${PF};font-size:11px;color:#a8a8b0;line-height:1.6;">
                    <a href="mailto:1030@tradeworld.co.kr" style="color:#a8a8b0;text-decoration:none;">1030@tradeworld.co.kr</a>
                  </p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
              <tr>
                <td style="padding-top:18px;border-top:1px solid #2a2a2e;text-align:center;">
                  <a href="${LINK_HOMEPAGE}" style="font-family:${PF};font-size:11px;color:#8a8a92;text-decoration:none;letter-spacing:1px;">www.tradeworld.co.kr</a>
                  <p style="margin:6px 0 0 0;font-family:${PF};font-size:10px;color:#4a4a52;letter-spacing:0.5px;">© ${new Date().getFullYear()} TRADEWORLD. All rights reserved.</p>
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
