// components/email/EditablePreview.tsx
// 인플레이스 편집 가능한 메일 미리보기
// React로 메일 구조를 직접 렌더링하고, 각 영역에 편집 가능한 컨트롤을 붙임.
// 실제 메일 HTML은 emailTemplate.buildEmailHTML()로 별도 생성됨 (이건 편집 UI일 뿐)

import React, { useState } from 'react';
import { Project } from '../../types';
import {
  EmailContent,
  EmailDesign,
  CtaButton,
  EmailSection,
  AspectRatio,
  createDefaultSection,
} from '../../services/emailTemplate';
import { deriveColors } from '../../services/colorUtils';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  GripVertical,
} from 'lucide-react';

const LOGO_WHITE_URL =
  'https://cnjsjkbzxkuxbtlaihcu.supabase.co/storage/v1/object/public/common/logo_tw_white.png';

const HEIGHT_MAP: Record<AspectRatio, number> = {
  '16:9': 143,
  '4:3': 190,
  '1:1': 254,
};

const COMPANY_FIXED = {
  companyName: '㈜트레이드월드',
  address: '서울시 송파구 법원로 128 C동 1311호',
  homepage: 'www.tradeworld.co.kr',
  homepageUrl: 'https://www.tradeworld.co.kr',
  tagline: 'Design · Video · Web',
};

interface Props {
  content: EmailContent;
  design: EmailDesign;
  projectMap: Map<string, Project>;
  onContentChange: (content: EmailContent) => void;
  onCardClick: (sectionId: string, cardId: string) => void;
}

// ============ 작은 hover 액션 버튼 ============

const HoverActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-slate-900/90 backdrop-blur rounded p-0.5 z-10">
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

// ============ 인라인 편집 가능한 텍스트 ============
// 클릭하면 contenteditable처럼 동작

const InlineText: React.FC<{
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'p' | 'h1' | 'h2' | 'span' | 'div';
}> = ({
  value,
  onChange,
  multiline = false,
  placeholder,
  className = '',
  style,
  as = 'p',
}) => {
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
      className={`outline-none focus:ring-2 focus:ring-blue-400/60 focus:bg-blue-50/50 rounded px-1 -mx-1 cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 ${className}`}
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
}> = ({ button, onChange, onClose }) => {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white dark:bg-slate-900 border rounded-lg shadow-2xl p-3 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">버튼 편집</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700"
        >
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
};

// ============ 메인 컴포넌트 ============

export const EditablePreview: React.FC<Props> = ({
  content,
  design,
  projectMap,
  onContentChange,
  onCardClick,
}) => {
  const colors = deriveColors(design.keyColor);
  const C = COMPANY_FIXED;

  // 어떤 버튼이 편집 모드인지 (id로 추적)
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);

  // ──────── 헬퍼 ────────
  const update = (patch: Partial<EmailContent>) => {
    onContentChange({ ...content, ...patch });
  };

  const updateFooter = (patch: Partial<EmailContent['footer']>) => {
    onContentChange({ ...content, footer: { ...content.footer, ...patch } });
  };

  const updateSection = (sectionId: string, patch: Partial<EmailSection>) => {
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

  const addSection = (afterIdx?: number) => {
    const newSection = createDefaultSection();
    const next = [...content.sections];
    if (afterIdx !== undefined) {
      next.splice(afterIdx + 1, 0, newSection);
    } else {
      next.push(newSection);
    }
    update({ sections: next });
  };

  const addCard = (sectionId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      cards: [
        ...section.cards,
        {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          projectId: null,
        },
      ],
    });
  };

  const removeCard = (sectionId: string, cardId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      cards: section.cards.filter((c) => c.id !== cardId),
    });
  };

  const moveCard = (sectionId: string, cardIdx: number, dir: 'up' | 'down') => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const next = [...section.cards];
    const target = dir === 'up' ? cardIdx - 1 : cardIdx + 1;
    if (target < 0 || target >= next.length) return;
    [next[cardIdx], next[target]] = [next[target], next[cardIdx]];
    updateSection(sectionId, { cards: next });
  };

  const clearCard = (sectionId: string, cardId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      cards: section.cards.map((c) =>
        c.id === cardId ? { ...c, projectId: null } : c
      ),
    });
  };

  const updateButton = (
    location: 'topButtons' | 'bottomButtons',
    btnId: string,
    patch: Partial<CtaButton>
  ) => {
    update({
      [location]: content[location].map((b) =>
        b.id === btnId ? { ...b, ...patch } : b
      ),
    });
  };

  const removeButton = (location: 'topButtons' | 'bottomButtons', btnId: string) => {
    update({ [location]: content[location].filter((b) => b.id !== btnId) });
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
    });
  };

  const updateClosingParagraph = (idx: number, value: string) => {
    const next = [...content.closingParagraphs];
    next[idx] = value;
    update({ closingParagraphs: next });
  };

  const addClosingParagraph = () => {
    update({ closingParagraphs: [...content.closingParagraphs, '새 문단을 입력하세요.'] });
  };

  const removeClosingParagraph = (idx: number) => {
    update({
      closingParagraphs: content.closingParagraphs.filter((_, i) => i !== idx),
    });
  };

  // 모든 카드에 이미 사용된 프로젝트 ID
  const allUsedProjectIds = content.sections.flatMap((s) =>
    s.cards.map((c) => c.projectId).filter(Boolean) as string[]
  );

  // 그라디언트
  const gradientStyle = {
    background: `linear-gradient(135deg,${colors.gradientStart} 0%,${colors.gradientMid} 50%,${colors.gradientEnd} 100%)`,
  };

  const PF =
    "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕','Helvetica Neue',Helvetica,Arial,sans-serif";

  return (
    <div
      style={{ width: 600, fontFamily: PF, backgroundColor: '#ffffff' }}
      className="mx-auto shadow-lg"
    >
      {/* ──────── 헤더 ──────── */}
      <div
        style={{
          ...gradientStyle,
          padding: '60px 40px 56px 40px',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <img
          src={LOGO_WHITE_URL}
          alt="logo"
          style={{
            display: 'block',
            margin: '0 auto 22px auto',
            width: 108,
            height: 15,
          }}
        />
        <InlineText
          as="h1"
          value={content.headerTitle}
          onChange={(v) => update({ headerTitle: v })}
          placeholder="헤더 타이틀"
          style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        />
      </div>

      {/* ──────── 도입부 ──────── */}
      <div style={{ padding: '48px 40px 40px 40px' }}>
        {/* 뱃지 */}
        <div className="text-center mb-6">
          <div
            className="inline-block group relative"
            style={{
              backgroundColor: colors.badgeBg,
              padding: '8px 16px',
              borderRadius: 100,
            }}
          >
            <InlineText
              value={content.badgeText}
              onChange={(v) => update({ badgeText: v })}
              placeholder="신뢰 뱃지 (비우면 표시 안 됨)"
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 600,
                color: colors.badgeText,
                letterSpacing: '0.3px',
                lineHeight: 1.2,
              }}
            />
          </div>
        </div>

        {/* 메인 헤드라인 */}
        <InlineText
          multiline
          value={content.mainHeadline}
          onChange={(v) => update({ mainHeadline: v })}
          placeholder="메인 헤드라인"
          style={{
            margin: '0 0 16px 0',
            fontSize: 22,
            fontWeight: 700,
            color: '#0e0e10',
            letterSpacing: '-0.6px',
            lineHeight: 1.4,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
          }}
        />

        {/* 부연 설명 */}
        <InlineText
          multiline
          value={content.introDescription}
          onChange={(v) => update({ introDescription: v })}
          placeholder="부연 설명"
          style={{
            margin: `0 0 ${content.topButtons.length > 0 ? 36 : 0}px 0`,
            fontSize: 13,
            color: '#6a6a72',
            lineHeight: 1.7,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
          }}
        />

        {/* 상단 버튼 */}
        {content.topButtons.length > 0 && (
          <div className="flex justify-center items-center gap-3 flex-wrap">
            {content.topButtons.map((btn) => (
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
                    border: btn.style === 'outline' ? `1px solid ${colors.primary}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {btn.text}
                </a>
                <HoverActions>
                  <ActionBtn
                    onClick={() => setEditingBtnId(btn.id)}
                    title="편집"
                  >
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
        )}
        {content.topButtons.length === 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => addButton('topButtons')}
              className="opacity-30 hover:opacity-100 transition border-2 border-dashed border-slate-300 rounded-full px-4 py-2 text-xs text-slate-500 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> 버튼 추가
            </button>
          </div>
        )}
      </div>

      {/* ──────── 섹션들 ──────── */}
      {content.sections.map((section, sIdx) => {
        const cardHeight = HEIGHT_MAP[section.aspectRatio];
        return (
          <React.Fragment key={section.id}>
            <div className="px-10 pt-6 pb-2 group relative">
              {/* 섹션 액션 (호버 시) */}
              <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-slate-900/90 rounded p-1 z-10">
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 'up')}
                  disabled={sIdx === 0}
                  className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30"
                  title="위로 이동"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 'down')}
                  disabled={sIdx === content.sections.length - 1}
                  className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30"
                  title="아래로 이동"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <select
                  value={section.aspectRatio}
                  onChange={(e) =>
                    updateSection(section.id, {
                      aspectRatio: e.target.value as AspectRatio,
                    })
                  }
                  className="text-[10px] bg-transparent text-white border border-white/30 rounded px-1 py-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="16:9" className="text-black">
                    16:9
                  </option>
                  <option value="4:3" className="text-black">
                    4:3
                  </option>
                  <option value="1:1" className="text-black">
                    1:1
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="p-1 text-white hover:bg-red-500/40 rounded"
                  title="섹션 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* 섹션 제목 */}
              <div className="text-center mb-5">
                <span
                  className="inline-block"
                  style={{
                    borderBottom: `3px solid ${colors.primary}`,
                    paddingBottom: 6,
                  }}
                >
                  <InlineText
                    as="span"
                    value={section.title}
                    onChange={(v) => updateSection(section.id, { title: v })}
                    placeholder="섹션 제목"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#222222',
                      letterSpacing: '-0.3px',
                    }}
                  />
                </span>
              </div>

              {/* 카드 그리드 (2열) */}
              <div className="grid grid-cols-2 gap-3">
                {section.cards.map((card, cIdx) => {
                  const project = card.projectId
                    ? projectMap.get(card.projectId)
                    : null;

                  return (
                    <div key={card.id} className="relative group">
                      {project ? (
                        // 프로젝트 채워진 카드
                        <div
                          onClick={() => onCardClick(section.id, card.id)}
                          className="cursor-pointer"
                        >
                          <div
                            style={{
                              width: '100%',
                              height: cardHeight,
                              overflow: 'hidden',
                              borderRadius: 6,
                              backgroundColor: '#f0f0f0',
                            }}
                          >
                            <img
                              src={project.thumbnailUrl || project.imageUrl} // ✅ 썸네일 우선 적용으로 수정된 부분
                              alt={project.title}
                              style={{
                                display: 'block',
                                width: '100%',
                                height: cardHeight,
                                objectFit: 'cover',
                              }}
                            />
                          </div>
                          <p
                            style={{
                              margin: '8px 0 2px 0',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#222222',
                              lineHeight: 1.4,
                              textAlign: 'center',
                            }}
                          >
                            {project.title}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: '#888888',
                              lineHeight: 1.4,
                              textAlign: 'center',
                            }}
                          >
                            {project.client}
                          </p>
                        </div>
                      ) : (
                        // 빈 카드 (클릭 시 모달)
                        <button
                          type="button"
                          onClick={() => onCardClick(section.id, card.id)}
                          style={{
                            width: '100%',
                            height: cardHeight,
                          }}
                          className="rounded-md border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 transition flex flex-col items-center justify-center text-slate-400 hover:text-slate-700"
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-[11px]">프로젝트 선택</span>
                        </button>
                      )}

                      {/* 카드 액션 (호버) */}
                      <HoverActions>
                        <ActionBtn
                          onClick={() => moveCard(section.id, cIdx, 'up')}
                          title="앞으로"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => moveCard(section.id, cIdx, 'down')}
                          title="뒤로"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </ActionBtn>
                        {project && (
                          <ActionBtn
                            onClick={() => clearCard(section.id, card.id)}
                            title="비우기"
                          >
                            <X className="w-3 h-3" />
                          </ActionBtn>
                        )}
                        <ActionBtn
                          onClick={() => removeCard(section.id, card.id)}
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

              {/* 카드 추가 */}
              <button
                type="button"
                onClick={() => addCard(section.id)}
                className="mt-3 w-full py-1.5 text-[11px] text-slate-400 border border-dashed border-slate-300 rounded hover:text-slate-700 hover:border-slate-500 transition opacity-0 group-hover:opacity-100"
              >
                + 카드 추가
              </button>
            </div>

            {/* 섹션 사이에 "섹션 추가" 핸들 */}
            <div className="relative h-2 group/divider">
              <button
                type="button"
                onClick={() => addSection(sIdx)}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto opacity-0 group-hover/divider:opacity-100 transition flex items-center justify-center"
                title="아래에 섹션 추가"
              >
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Plus className="w-3 h-3" /> 섹션
                </span>
              </button>
            </div>
          </React.Fragment>
        );
      })}

      {/* 첫 섹션 추가 (sections이 비었을 때) */}
      {content.sections.length === 0 && (
        <div className="px-10 py-8 text-center">
          <button
            type="button"
            onClick={() => addSection()}
            className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-lg px-6 py-8 text-slate-500 hover:text-slate-900 transition w-full flex flex-col items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">첫 섹션 추가</span>
            <span className="text-[10px] text-slate-400">
              빈 카드 4개로 시작합니다
            </span>
          </button>
        </div>
      )}

      {/* 끝에 섹션 추가 */}
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

      {/* ──────── 클로징 메시지 ──────── */}
      <div
        style={{
          padding: '40px 40px 32px 40px',
          borderTop: '1px solid #eeeeee',
          textAlign: 'center',
        }}
      >
        {content.closingParagraphs.map((p, idx) => (
          <div key={idx} className="relative group mb-3">
            <InlineText
              multiline
              value={p}
              onChange={(v) => updateClosingParagraph(idx, v)}
              placeholder="문단을 입력하세요"
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.85,
                color: '#333333',
                textAlign: 'center',
                fontWeight:
                  idx === content.closingParagraphs.length - 1 && p.length < 20
                    ? 600
                    : 400,
                whiteSpace: 'pre-wrap',
              }}
            />
            <button
              type="button"
              onClick={() => removeClosingParagraph(idx)}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 bg-white rounded p-0.5 z-10"
              title="문단 삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addClosingParagraph}
          className="mt-2 text-[11px] text-slate-400 hover:text-slate-700 underline"
        >
          + 문단 추가
        </button>

        {/* 하단 버튼 */}
        <div className="mt-7 flex justify-center items-center gap-3 flex-wrap">
          {content.bottomButtons.map((btn) => (
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
                  cursor: 'pointer',
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

      {/* ──────── 푸터 ──────── */}
      <div style={{ backgroundColor: '#0e0e10', padding: '36px 40px 32px 40px' }}>
        <div
          style={{ paddingBottom: 18, borderBottom: '1px solid #2a2a2e' }}
        >
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

        <div className="grid grid-cols-[55%_45%] mt-5">
          <div className="pr-3">
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
                color: '#ffffff',
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
          <div className="pl-3" style={{ borderLeft: '1px solid #2a2a2e' }}>
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
                color: '#ffffff',
                fontWeight: 600,
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <InlineText
                as="span"
                value={content.footer.contactName}
                onChange={(v) => updateFooter({ contactName: v })}
                style={{ color: '#ffffff', fontWeight: 600 }}
              />
              <InlineText
                as="span"
                value={content.footer.contactRole}
                onChange={(v) => updateFooter({ contactRole: v })}
                style={{ color: '#a8a8b0', fontWeight: 400 }}
              />
            </p>
            <p
              style={{
                margin: '0 0 2px 0',
                fontSize: 11,
                color: '#a8a8b0',
                lineHeight: 1.6,
              }}
            >
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
          <span
            style={{
              fontSize: 11,
              color: '#8a8a92',
              letterSpacing: '1px',
            }}
          >
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
