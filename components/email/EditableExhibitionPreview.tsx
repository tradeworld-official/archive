// components/email/EditableExhibitionPreview.tsx
// 전시 영업 메일 미리보기 + 인플레이스 편집

import React, { useState } from 'react';
import { Exhibition } from '../../types';
import {
  ExhibitionEmailContent,
  EmailDesign,
  CtaButton,
  ExhibitionSection,
  ExhibitionCardSlot,
  SectionLayout,
  DetailLevel,
  createDefaultSection,
} from '../../services/exhibitionEmailTemplate';
import { deriveColors } from '../../services/colorUtils';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  Eye,
  EyeOff,
  Columns2,
  Square,
} from 'lucide-react';

const LOGO_WHITE_URL =
  'https://cnjsjkbzxkuxbtlaihcu.supabase.co/storage/v1/object/public/common/logo_tw_white.png';

const COMPANY_FIXED = {
  companyName: '㈜트레이드월드',
  address: '서울시 송파구 법원로 128 C동 1311호',
  homepage: 'www.tradeworld.co.kr',
  homepageUrl: 'https://www.tradeworld.co.kr',
  tagline: 'Global Exhibition Agency',
};

const PF =
  "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Helvetica Neue',Helvetica,Arial,sans-serif";

interface Props {
  content: ExhibitionEmailContent;
  design: EmailDesign;
  exhibitionMap: Map<string, Exhibition>;
  onContentChange: (content: ExhibitionEmailContent) => void;
  onSlotClick: (sectionId: string, slotId: string) => void;
}

// ============ 작은 hover 액션 버튼 ============

const HoverActions: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-slate-900/90 backdrop-blur rounded p-0.5 z-10 ${className}`}
  >
    {children}
  </div>
);

const ActionBtn: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, title, children, danger }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    title={title}
    className={`p-1 rounded text-white hover:bg-white/20 ${
      danger ? 'hover:bg-red-500/40' : ''
    }`}
  >
    {children}
  </button>
);

// ============ 인라인 편집 텍스트 ============

const InlineText: React.FC<{
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div';
}> = ({ value, onChange, multiline = false, placeholder, style, as = 'p' }) => {
  const Tag = as as any;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const newValue = multiline
          ? e.currentTarget.innerText
          : e.currentTarget.innerText.replace(/\n/g, ' ');
        if (newValue !== value) onChange(newValue);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      data-placeholder={placeholder}
      className="outline-none focus:ring-2 focus:ring-blue-400/60 focus:bg-blue-50/50 rounded px-1 -mx-1 cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
      style={style}
    >
      {value}
    </Tag>
  );
};

// ============ 버튼 편집 팝오버 ============

const ButtonEditPopover: React.FC<{
  button: CtaButton;
  onChange: (b: CtaButton) => void;
  onClose: () => void;
}> = ({ button, onChange, onClose }) => (
  <div
    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white dark:bg-slate-900 border rounded-lg shadow-2xl p-3 w-72"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold">버튼 편집</span>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="space-y-2">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
          텍스트
        </label>
        <input
          type="text"
          value={button.text}
          onChange={(e) => onChange({ ...button, text: e.target.value })}
          className="w-full text-sm px-2 py-1.5 border rounded"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
          URL
        </label>
        <input
          type="text"
          value={button.url}
          onChange={(e) => onChange({ ...button, url: e.target.value })}
          placeholder="https://"
          className="w-full text-sm px-2 py-1.5 border rounded"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
          스타일
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange({ ...button, style: 'solid' })}
            className={`flex-1 text-xs h-7 rounded border transition ${
              button.style === 'solid'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-transparent border-slate-300 hover:border-slate-500'
            }`}
          >
            채움
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...button, style: 'outline' })}
            className={`flex-1 text-xs h-7 rounded border transition ${
              button.style === 'outline'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-transparent border-slate-300 hover:border-slate-500'
            }`}
          >
            테두리
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============ 전시 카드 (미리보기용) ============

const ExhibitionCardPreview: React.FC<{
  exhibition: Exhibition;
  detailLevel: DetailLevel;
  layout: SectionLayout;
}> = ({ exhibition, detailLevel, layout }) => {
  const isWide = layout === '1col';
  const imageHeight = isWide ? 280 : 143;
  const titleSize = isWide ? 18 : 15;
  const isDetailed = detailLevel === 'detailed';

  const dateRange =
    exhibition.startDate && exhibition.endDate
      ? exhibition.startDate === exhibition.endDate
        ? exhibition.startDate
        : `${exhibition.startDate} ~ ${exhibition.endDate.split('-').slice(-1)[0]}`
      : exhibition.startDate || '';

  const venue = [exhibition.venueCountry, exhibition.venueCity, exhibition.venueName]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8e8ec',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <img
        src={exhibition.imageUrl}
        alt={exhibition.name}
        style={{
          display: 'block',
          width: '100%',
          height: imageHeight,
          objectFit: 'cover',
        }}
      />
      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: '#0e0e10',
            lineHeight: 1.3,
            letterSpacing: '-0.3px',
            marginBottom: 4,
          }}
        >
          {exhibition.logoUrl && (
            <img
              src={exhibition.logoUrl}
              alt=""
              style={{
                display: 'inline-block',
                maxHeight: 32,
                width: 'auto',
                marginRight: 8,
                verticalAlign: 'middle',
              }}
            />
          )}
          <span>{exhibition.name}</span>
        </div>
        {exhibition.nameEn && (
          <div
            style={{
              fontSize: 11,
              color: '#888',
              marginBottom: 8,
              letterSpacing: '0.3px',
            }}
          >
            {exhibition.nameEn}
          </div>
        )}
        <div
          style={{
            fontSize: 12,
            color: '#5a5a62',
            lineHeight: 1.6,
            marginTop: 6,
          }}
        >
          {dateRange && <>📅 {dateRange}</>}
          {dateRange && venue && <br />}
          {venue && <>📍 {venue}</>}
        </div>

        {/* 갤러리 (1col + detailed) */}
        {isDetailed && isWide && exhibition.gallery && exhibition.gallery.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {exhibition.gallery.slice(0, 3).map((g, idx) => (
              <img
                key={idx}
                src={g}
                alt=""
                style={{
                  display: 'block',
                  flex: 1,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        )}

        {/* 상세 정보 표 */}
        {isDetailed &&
          exhibition.customFields &&
          exhibition.customFields.filter((f) => f.label && f.value).length > 0 && (
            <table
              style={{
                width: '100%',
                marginTop: 14,
                background: '#f8f8fa',
                borderRadius: 6,
                borderCollapse: 'separate',
              }}
            >
              <tbody>
                {exhibition.customFields
                  .filter((f) => f.label && f.value)
                  .map((cf, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          color: '#5a5a62',
                          width: 90,
                          verticalAlign: 'top',
                          fontWeight: 600,
                        }}
                      >
                        {cf.label}
                      </td>
                      <td
                        style={{
                          padding: '6px 14px 6px 0',
                          fontSize: 12,
                          color: '#222',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {cf.value}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
};

// ============ 메인 컴포넌트 ============

export const EditableExhibitionPreview: React.FC<Props> = ({
  content,
  design,
  exhibitionMap,
  onContentChange,
  onSlotClick,
}) => {
  const colors = deriveColors(design.keyColor);
  const C = COMPANY_FIXED;

  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);

  const update = (patch: Partial<ExhibitionEmailContent>) => {
    onContentChange({ ...content, ...patch });
  };

  const updateFooter = (patch: Partial<ExhibitionEmailContent['footer']>) => {
    onContentChange({ ...content, footer: { ...content.footer, ...patch } });
  };

  // ──────── 어필 포인트 ────────
  const updateAppealPoint = (idx: number, value: string) => {
    const next = [...content.appealPoints];
    next[idx] = value;
    update({ appealPoints: next });
  };
  const removeAppealPoint = (idx: number) => {
    update({ appealPoints: content.appealPoints.filter((_, i) => i !== idx) });
  };
  const addAppealPoint = () => {
    update({ appealPoints: [...content.appealPoints, '새 포인트'] });
  };

  // ──────── 섹션 ────────
  const updateSection = (sectionId: string, patch: Partial<ExhibitionSection>) => {
    update({
      sections: content.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s
      ),
    });
  };
  const removeSection = (sectionId: string) => {
    update({ sections: content.sections.filter((s) => s.id !== sectionId) });
  };
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const next = [...content.sections];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ sections: next });
  };
  const addSection = (afterIdx?: number, layout: SectionLayout = '1col') => {
    const newSection = createDefaultSection(layout);
    const next = [...content.sections];
    if (afterIdx !== undefined) {
      next.splice(afterIdx + 1, 0, newSection);
    } else {
      next.push(newSection);
    }
    update({ sections: next });
  };

  // 레이아웃 토글 (1col ↔ 2col 변경 시 슬롯 개수도 자동 조정)
  const toggleLayout = (sectionId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newLayout: SectionLayout = section.layout === '1col' ? '2col' : '1col';
    // 1col → 2col: 슬롯 개수가 홀수면 짝수로 +1, 그대로 유지
    // 2col → 1col: 슬롯 그대로 유지
    let newSlots = section.slots;
    if (newLayout === '2col' && section.slots.length % 2 !== 0) {
      newSlots = [
        ...section.slots,
        {
          id: `slot-${Date.now()}`,
          exhibitionId: null,
          detailLevel: 'basic' as DetailLevel,
        },
      ];
    }
    updateSection(sectionId, { layout: newLayout, slots: newSlots });
  };

  // ──────── 슬롯 ────────
  const updateSlot = (
    sectionId: string,
    slotId: string,
    patch: Partial<ExhibitionCardSlot>
  ) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      slots: section.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)),
    });
  };
  const clearSlot = (sectionId: string, slotId: string) => {
    updateSlot(sectionId, slotId, { exhibitionId: null });
  };
  const addSlot = (sectionId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      slots: [
        ...section.slots,
        {
          id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          exhibitionId: null,
          detailLevel: 'basic' as DetailLevel,
        },
      ],
    });
  };
  const removeSlot = (sectionId: string, slotId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      slots: section.slots.filter((s) => s.id !== slotId),
    });
  };
  const moveSlot = (sectionId: string, slotIdx: number, dir: 'up' | 'down') => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const next = [...section.slots];
    const target = dir === 'up' ? slotIdx - 1 : slotIdx + 1;
    if (target < 0 || target >= next.length) return;
    [next[slotIdx], next[target]] = [next[target], next[slotIdx]];
    updateSection(sectionId, { slots: next });
  };
  const toggleDetailLevel = (sectionId: string, slotId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const slot = section.slots.find((s) => s.id === slotId);
    if (!slot) return;
    updateSlot(sectionId, slotId, {
      detailLevel: slot.detailLevel === 'basic' ? 'detailed' : 'basic',
    });
  };

  // ──────── 클로징 문단 ────────
  const updateClosing = (idx: number, value: string) => {
    const next = [...content.closingParagraphs];
    next[idx] = value;
    update({ closingParagraphs: next });
  };
  const removeClosing = (idx: number) =>
    update({ closingParagraphs: content.closingParagraphs.filter((_, i) => i !== idx) });
  const addClosing = () =>
    update({ closingParagraphs: [...content.closingParagraphs, '새 문단을 입력하세요.'] });

  // ──────── 버튼 ────────
  const updateButton = (
    location: 'topButtons' | 'bottomButtons',
    btnId: string,
    patch: Partial<CtaButton>
  ) => {
    update({
      [location]: content[location].map((b) =>
        b.id === btnId ? { ...b, ...patch } : b
      ),
    } as Partial<ExhibitionEmailContent>);
  };
  const removeButton = (location: 'topButtons' | 'bottomButtons', btnId: string) => {
    update({
      [location]: content[location].filter((b) => b.id !== btnId),
    } as Partial<ExhibitionEmailContent>);
  };
  const addButton = (location: 'topButtons' | 'bottomButtons') => {
    const existing = content[location];
    update({
      [location]: [
        ...existing,
        {
          id: `${location}-${Date.now()}`,
          text: '새 버튼',
          url: 'https://',
          style: existing.length === 0 ? 'solid' : 'outline',
        } as CtaButton,
      ],
    } as Partial<ExhibitionEmailContent>);
  };

  // ──────── 사용된 전시 ID ────────
  const allUsedIds = content.sections.flatMap(
    (s) => s.slots.map((c) => c.exhibitionId).filter(Boolean) as string[]
  );

  const gradient = `linear-gradient(135deg,${colors.gradientStart} 0%,${colors.gradientMid} 50%,${colors.gradientEnd} 100%)`;

  // ──────── 렌더 ────────
  return (
    <div
      style={{ width: 600, fontFamily: PF, backgroundColor: '#ffffff' }}
      className="mx-auto shadow-lg"
    >
      {/* 헤더 (이슈 후킹) */}
      <div
        style={{
          background: gradient,
          padding: '50px 40px',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <InlineText
          as="p"
          value={content.hookOverline}
          onChange={(v) => update({ hookOverline: v })}
          placeholder="윗줄 후킹 카피"
          style={{
            margin: '0 0 6px 0',
            fontSize: 13,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.3px',
            fontWeight: 500,
          }}
        />
        <InlineText
          as="h1"
          value={content.hookHeadline}
          onChange={(v) => update({ hookHeadline: v })}
          placeholder="메인 후킹"
          style={{
            margin: '0 0 6px 0',
            fontSize: 34,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.8px',
            lineHeight: 1.2,
          }}
        />
        <InlineText
          as="p"
          value={content.hookAction}
          onChange={(v) => update({ hookAction: v })}
          placeholder="액션/소제목"
          style={{
            margin: 0,
            fontSize: 14,
            color: 'rgba(255,255,255,0.95)',
            fontWeight: 600,
            letterSpacing: '0.2px',
          }}
        />
      </div>

      {/* 어필 포인트 */}
      <div style={{ padding: '36px 40px 20px 40px' }}>
        {content.appealPoints.map((p, idx) => (
          <div
            key={idx}
            className="group relative"
            style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start' }}
          >
            <span
              style={{
                color: colors.primary,
                fontWeight: 700,
                marginRight: 6,
                fontSize: 13,
              }}
            >
              +
            </span>
            <InlineText
              value={p}
              onChange={(v) => updateAppealPoint(idx, v)}
              placeholder="어필 포인트"
              style={{
                flex: 1,
                fontSize: 13,
                color: '#222',
                lineHeight: 1.6,
              }}
            />
            <button
              type="button"
              onClick={() => removeAppealPoint(idx)}
              className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 ml-2"
              title="삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAppealPoint}
          className="mt-2 text-[11px] text-slate-400 hover:text-slate-700 underline"
        >
          + 포인트 추가
        </button>
      </div>

      {/* 상단 버튼 */}
      <div className="px-10 pb-6 flex justify-center items-center gap-3 flex-wrap">
        {content.topButtons.map((btn) => (
          <div key={btn.id} className="relative group">
            <a
              href={btn.url}
              onClick={(e) => e.preventDefault()}
              style={{
                display: 'inline-block',
                backgroundColor: btn.style === 'solid' ? colors.primary : '#ffffff',
                color: btn.style === 'solid' ? '#ffffff' : colors.primary,
                textDecoration: 'none',
                padding: btn.style === 'solid' ? '13px 28px' : '12px 28px',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '-0.2px',
                borderRadius: 100,
                border: btn.style === 'outline' ? `1px solid ${colors.primary}` : 'none',
              }}
            >
              {btn.text}
            </a>
            <HoverActions>
              <ActionBtn onClick={() => setEditingBtnId(btn.id)} title="편집">
                <Pencil className="w-3 h-3" />
              </ActionBtn>
              <ActionBtn
                onClick={() => removeButton('topButtons', btn.id)}
                title="삭제"
                danger
              >
                <Trash2 className="w-3 h-3" />
              </ActionBtn>
            </HoverActions>
            {editingBtnId === btn.id && (
              <ButtonEditPopover
                button={btn}
                onChange={(b) => updateButton('topButtons', btn.id, b)}
                onClose={() => setEditingBtnId(null)}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addButton('topButtons')}
          className="opacity-30 hover:opacity-100 transition border-2 border-dashed border-slate-300 rounded-full px-4 py-2 text-xs text-slate-500 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> 버튼
        </button>
      </div>

      {/* 섹션들 */}
      {content.sections.map((section, sIdx) => {
        const slotsToRender = section.slots;
        return (
          <React.Fragment key={section.id}>
            <div className="px-10 pt-3 pb-3 group relative">
              {/* 섹션 액션 (호버) */}
              <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-slate-900/90 rounded p-1 z-10">
                <button
                  type="button"
                  onClick={() => toggleLayout(section.id)}
                  className="p-1 text-white hover:bg-white/20 rounded flex items-center gap-1"
                  title={section.layout === '1col' ? '2컬럼으로 변경' : '1컬럼으로 변경'}
                >
                  {section.layout === '1col' ? (
                    <Square className="w-3 h-3" />
                  ) : (
                    <Columns2 className="w-3 h-3" />
                  )}
                  <span className="text-[10px]">{section.layout}</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 'up')}
                  disabled={sIdx === 0}
                  className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 'down')}
                  disabled={sIdx === content.sections.length - 1}
                  className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="p-1 text-white hover:bg-red-500/40 rounded"
                  title="섹션 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* 슬롯 그리드 */}
              <div
                className={
                  section.layout === '2col' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
                }
              >
                {slotsToRender.map((slot, cIdx) => {
                  const ex = slot.exhibitionId ? exhibitionMap.get(slot.exhibitionId) : null;
                  const cardHeight =
                    section.layout === '1col'
                      ? 380 // 빈 슬롯 높이
                      : 220;

                  return (
                    <div key={slot.id} className="relative group/slot">
                      {ex ? (
                        <div
                          onClick={() => onSlotClick(section.id, slot.id)}
                          className="cursor-pointer"
                        >
                          <ExhibitionCardPreview
                            exhibition={ex}
                            detailLevel={slot.detailLevel}
                            layout={section.layout}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSlotClick(section.id, slot.id)}
                          style={{ width: '100%', height: cardHeight }}
                          className="rounded-md border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 transition flex flex-col items-center justify-center text-slate-400 hover:text-slate-700"
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-[11px]">전시 선택</span>
                        </button>
                      )}

                      {/* 슬롯 액션 */}
                      <HoverActions className="opacity-0 group-hover/slot:opacity-100">
                        {ex && (
                          <ActionBtn
                            onClick={() => toggleDetailLevel(section.id, slot.id)}
                            title={
                              slot.detailLevel === 'detailed'
                                ? '간단 모드로'
                                : '상세 모드로'
                            }
                          >
                            {slot.detailLevel === 'detailed' ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </ActionBtn>
                        )}
                        <ActionBtn
                          onClick={() => moveSlot(section.id, cIdx, 'up')}
                          title="앞으로"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => moveSlot(section.id, cIdx, 'down')}
                          title="뒤로"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </ActionBtn>
                        {ex && (
                          <ActionBtn
                            onClick={() => clearSlot(section.id, slot.id)}
                            title="비우기"
                          >
                            <X className="w-3 h-3" />
                          </ActionBtn>
                        )}
                        <ActionBtn
                          onClick={() => removeSlot(section.id, slot.id)}
                          title="삭제"
                          danger
                        >
                          <Trash2 className="w-3 h-3" />
                        </ActionBtn>
                      </HoverActions>
                    </div>
                  );
                })}
              </div>

              {/* 슬롯 추가 */}
              <button
                type="button"
                onClick={() => addSlot(section.id)}
                className="mt-3 w-full py-1.5 text-[11px] text-slate-400 border border-dashed border-slate-300 rounded hover:text-slate-700 hover:border-slate-500 transition opacity-0 group-hover:opacity-100"
              >
                + 카드 추가
              </button>
            </div>

            {/* 섹션 사이 추가 */}
            <div className="relative h-2 group/divider">
              <button
                type="button"
                onClick={() => addSection(sIdx)}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto opacity-0 group-hover/divider:opacity-100 transition flex items-center justify-center"
              >
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Plus className="w-3 h-3" /> 섹션
                </span>
              </button>
            </div>
          </React.Fragment>
        );
      })}

      {/* 빈 상태 */}
      {content.sections.length === 0 && (
        <div className="px-10 py-8 text-center">
          <button
            type="button"
            onClick={() => addSection()}
            className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-lg px-6 py-8 text-slate-500 hover:text-slate-900 transition w-full flex flex-col items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">첫 섹션 추가</span>
          </button>
        </div>
      )}

      {content.sections.length > 0 && (
        <div className="px-10 pb-2">
          <button
            type="button"
            onClick={() => addSection()}
            className="w-full border border-dashed border-slate-300 hover:border-slate-900 rounded py-2 text-xs text-slate-400 hover:text-slate-900 transition flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> 섹션 추가
          </button>
        </div>
      )}

      {/* 신청/접수 박스 */}
      <div style={{ padding: '20px 40px 10px 40px' }}>
        <div
          style={{
            backgroundColor: colors.badgeBg,
            borderRadius: 8,
            padding: '20px 24px',
          }}
        >
          <InlineText
            as="h3"
            value={content.applyTitle}
            onChange={(v) => update({ applyTitle: v })}
            placeholder="신청 박스 제목"
            style={{
              margin: '0 0 14px 0',
              fontSize: 14,
              fontWeight: 700,
              color: colors.primary,
              letterSpacing: '-0.2px',
            }}
          />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#5a5a62',
                    width: 90,
                    verticalAlign: 'top',
                    fontWeight: 600,
                  }}
                >
                  신청 방법
                </td>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#222',
                    lineHeight: 1.5,
                  }}
                >
                  <InlineText
                    multiline
                    value={content.applyMethod}
                    onChange={(v) => update({ applyMethod: v })}
                    placeholder="신청 방법"
                    style={{ fontSize: 12, color: '#222' }}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#5a5a62',
                    width: 90,
                    verticalAlign: 'top',
                    fontWeight: 600,
                  }}
                >
                  공식 대행사
                </td>
                <td style={{ padding: '4px 0', fontSize: 12, color: '#222' }}>
                  <InlineText
                    value={content.applyAgencyName}
                    onChange={(v) => update({ applyAgencyName: v })}
                    placeholder="대행사명"
                    style={{ fontSize: 12, color: '#222' }}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#5a5a62',
                    width: 90,
                    verticalAlign: 'top',
                    fontWeight: 600,
                  }}
                >
                  연락처
                </td>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#222',
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <InlineText
                    as="span"
                    value={content.applyContactPhone}
                    onChange={(v) => update({ applyContactPhone: v })}
                    placeholder="전화번호"
                    style={{ fontSize: 12, color: '#222' }}
                  />
                  <span style={{ color: '#888' }}>·</span>
                  <InlineText
                    as="span"
                    value={content.applyContactEmail}
                    onChange={(v) => update({ applyContactEmail: v })}
                    placeholder="이메일"
                    style={{ fontSize: 12, color: '#222' }}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '4px 0',
                    fontSize: 12,
                    color: '#5a5a62',
                    width: 90,
                    verticalAlign: 'top',
                    fontWeight: 600,
                  }}
                >
                  신청 페이지
                </td>
                <td style={{ padding: '4px 0', fontSize: 12, color: '#222' }}>
                  <InlineText
                    value={content.applyUrl}
                    onChange={(v) => update({ applyUrl: v })}
                    placeholder="(선택) 신청 페이지 URL — 입력 시 메일에 버튼 표시"
                    style={{ fontSize: 12, color: '#222' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 클로징 */}
      <div
        style={{
          padding: '30px 40px',
          borderTop: '1px solid #eeeeee',
          textAlign: 'center',
          marginTop: 20,
        }}
      >
        {content.closingParagraphs.map((p, idx) => (
          <div key={idx} className="relative group mb-3">
            <InlineText
              multiline
              value={p}
              onChange={(v) => updateClosing(idx, v)}
              placeholder="문단 입력"
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.85,
                color: '#333',
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
              }}
            />
            <button
              type="button"
              onClick={() => removeClosing(idx)}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 bg-white rounded p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addClosing}
          className="text-[11px] text-slate-400 hover:text-slate-700 underline"
        >
          + 문단 추가
        </button>

        {/* 하단 버튼 */}
        <div className="mt-5 flex justify-center items-center gap-3 flex-wrap">
          {content.bottomButtons.map((btn) => (
            <div key={btn.id} className="relative group">
              <a
                href={btn.url}
                onClick={(e) => e.preventDefault()}
                style={{
                  display: 'inline-block',
                  backgroundColor:
                    btn.style === 'solid' ? colors.primary : '#ffffff',
                  color: btn.style === 'solid' ? '#ffffff' : colors.primary,
                  textDecoration: 'none',
                  padding: btn.style === 'solid' ? '13px 28px' : '12px 28px',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '-0.2px',
                  borderRadius: 100,
                  border:
                    btn.style === 'outline' ? `1px solid ${colors.primary}` : 'none',
                }}
              >
                {btn.text}
              </a>
              <HoverActions>
                <ActionBtn onClick={() => setEditingBtnId(btn.id)} title="편집">
                  <Pencil className="w-3 h-3" />
                </ActionBtn>
                <ActionBtn
                  onClick={() => removeButton('bottomButtons', btn.id)}
                  title="삭제"
                  danger
                >
                  <Trash2 className="w-3 h-3" />
                </ActionBtn>
              </HoverActions>
              {editingBtnId === btn.id && (
                <ButtonEditPopover
                  button={btn}
                  onChange={(b) => updateButton('bottomButtons', btn.id, b)}
                  onClose={() => setEditingBtnId(null)}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addButton('bottomButtons')}
            className="opacity-30 hover:opacity-100 transition border-2 border-dashed border-slate-300 rounded-full px-4 py-2 text-xs text-slate-500 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 버튼
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ backgroundColor: '#0e0e10', padding: '36px 40px 32px 40px' }}>
        <div style={{ paddingBottom: 18, borderBottom: '1px solid #2a2a2e' }}>
          <img
            src={LOGO_WHITE_URL}
            alt="logo"
            style={{ display: 'block', width: 140, height: 19, marginBottom: 10 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: '#8a8a92',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {C.tagline}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            marginTop: 20,
          }}
        >
          <div style={{ paddingRight: 12 }}>
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: 10,
                color: '#5a5a62',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Office
            </p>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {C.companyName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#a8a8b0', lineHeight: 1.6 }}>
              {C.address}
            </p>
          </div>
          <div style={{ paddingLeft: 12, borderLeft: '1px solid #2a2a2e' }}>
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: 10,
                color: '#5a5a62',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Contact
            </p>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
                lineHeight: 1.5,
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <InlineText
                as="span"
                value={content.footer.contactName}
                onChange={(v) => updateFooter({ contactName: v })}
                style={{ color: '#fff', fontWeight: 600 }}
              />
              <InlineText
                as="span"
                value={content.footer.contactRole}
                onChange={(v) => updateFooter({ contactRole: v })}
                style={{ color: '#a8a8b0', fontWeight: 400 }}
              />
            </p>
            <p style={{ margin: '0 0 2px 0', fontSize: 11, color: '#a8a8b0', lineHeight: 1.6 }}>
              <InlineText
                as="span"
                value={content.footer.phone}
                onChange={(v) => updateFooter({ phone: v })}
                style={{ color: '#a8a8b0' }}
              />
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#a8a8b0', lineHeight: 1.6 }}>
              <InlineText
                as="span"
                value={content.footer.email}
                onChange={(v) => updateFooter({ email: v })}
                style={{ color: '#a8a8b0' }}
              />
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid #2a2a2e',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: '#8a8a92', letterSpacing: '1px' }}>
            {C.homepage}
          </span>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: 10,
              color: '#4a4a52',
              letterSpacing: '0.5px',
            }}
          >
            © {new Date().getFullYear()} TRADEWORLD. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
