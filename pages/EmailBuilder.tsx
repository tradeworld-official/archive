// pages/EmailBuilder.tsx
// 영업용 HTML 메일 빌더 v2
// - 메인 콘텐츠/버튼/색상 모두 편집 가능
// - 프로젝트 직접 선택
// - 모든 변경사항 localStorage 자동 저장 (새로고침 안전)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  buildEmailHTML,
  EmailContent,
  EmailDesign,
  CtaButton,
  DEFAULT_EMAIL_CONTENT,
  DEFAULT_EMAIL_DESIGN,
  EMAIL_CATEGORIES,
} from '../services/emailTemplate';
import {
  ChevronLeft,
  Copy,
  Check,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  GripVertical,
} from 'lucide-react';

// ============ localStorage 키 ============
const LS_CONTENT = 'tw_email_content_v2';
const LS_DESIGN = 'tw_email_design_v2';
const LS_SUBJECT = 'tw_email_subject_v2';
const LS_SELECTED = 'tw_email_selected_v2';

// ============ 헬퍼 ============

const getDefaultSubject = (): string => {
  const now = new Date();
  return `[${now.getFullYear()}년 ${now.getMonth() + 1}월] 트레이드월드 디자인 포트폴리오 안내`;
};

// localStorage에서 안전하게 불러오기
const loadFromLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// ============ 아코디언 섹션 ============

const Section: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}> = ({ title, defaultOpen = false, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold">{title}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {badge}
            </span>
          )}
        </div>
      </button>
      {open && <div className="p-4 border-t space-y-3">{children}</div>}
    </div>
  );
};

// ============ 라벨링된 폼 항목 ============

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
      {label}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

// ============ Textarea ============

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...props
}) => (
  <textarea
    className={`flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y ${className}`}
    {...props}
  />
);

// ============ 버튼 편집기 ============

const ButtonsEditor: React.FC<{
  buttons: CtaButton[];
  onChange: (buttons: CtaButton[]) => void;
  idPrefix: string;
}> = ({ buttons, onChange, idPrefix }) => {
  const update = (id: string, patch: Partial<CtaButton>) => {
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const remove = (id: string) => onChange(buttons.filter((b) => b.id !== id));
  const add = () =>
    onChange([
      ...buttons,
      {
        id: `${idPrefix}-${Date.now()}`,
        text: '새 버튼',
        url: 'https://',
        style: buttons.length === 0 ? 'solid' : 'outline',
      },
    ]);
  const move = (idx: number, dir: 'up' | 'down') => {
    const next = [...buttons];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {buttons.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">버튼이 없습니다.</p>
      )}
      {buttons.map((btn, idx) => (
        <div
          key={btn.id}
          className="border rounded-md p-3 space-y-2 bg-slate-50 dark:bg-slate-800/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              버튼 {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, 'up')}
                disabled={idx === 0}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="위로"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 'down')}
                disabled={idx === buttons.length - 1}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(btn.id)}
                className="p-1 text-red-400 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <Field label="버튼 텍스트">
            <Input
              value={btn.text}
              onChange={(e) => update(btn.id, { text: e.target.value })}
              placeholder="예: 카카오톡 문의하기"
            />
          </Field>
          <Field label="연결 링크 (URL)">
            <Input
              value={btn.url}
              onChange={(e) => update(btn.id, { url: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="스타일">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update(btn.id, { style: 'solid' })}
                className={`flex-1 h-8 text-xs rounded border transition ${
                  btn.style === 'solid'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-transparent border-slate-300 hover:border-slate-400'
                }`}
              >
                채움
              </button>
              <button
                type="button"
                onClick={() => update(btn.id, { style: 'outline' })}
                className={`flex-1 h-8 text-xs rounded border transition ${
                  btn.style === 'outline'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-transparent border-slate-300 hover:border-slate-400'
                }`}
              >
                테두리
              </button>
            </div>
          </Field>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="w-4 h-4 mr-1" /> 버튼 추가
      </Button>
      {buttons.length > 3 && (
        <p className="text-[10px] text-amber-600 text-center">
          ⚠ 버튼이 3개를 넘으면 클릭률이 낮아진다는 마케팅 정설이 있어요.
        </p>
      )}
    </div>
  );
};

// ============ 메인 페이지 ============

export const EmailBuilder: React.FC = () => {
  // ──────── 상태 ────────
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState<EmailContent>(() =>
    loadFromLS(LS_CONTENT, DEFAULT_EMAIL_CONTENT)
  );
  const [design, setDesign] = useState<EmailDesign>(() =>
    loadFromLS(LS_DESIGN, DEFAULT_EMAIL_DESIGN)
  );
  const [subject, setSubject] = useState<string>(() =>
    loadFromLS(LS_SUBJECT, getDefaultSubject())
  );
  // 선택한 프로젝트 ID 배열 (순서 유지)
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    loadFromLS(LS_SELECTED, [] as string[])
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]); // type 또는 industry 필터
  const [copied, setCopied] = useState<'html' | 'subject' | null>(null);

  // ──────── localStorage 자동 저장 ────────
  useEffect(() => {
    localStorage.setItem(LS_CONTENT, JSON.stringify(content));
  }, [content]);
  useEffect(() => {
    localStorage.setItem(LS_DESIGN, JSON.stringify(design));
  }, [design]);
  useEffect(() => {
    localStorage.setItem(LS_SUBJECT, JSON.stringify(subject));
  }, [subject]);
  useEffect(() => {
    localStorage.setItem(LS_SELECTED, JSON.stringify(selectedIds));
  }, [selectedIds]);

  // ──────── 데이터 fetch ────────
  const fetchData = async () => {
    setLoading(true);
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: tagData } = await supabase.from('tags').select('*');

    const formatted: Project[] = (projectData || []).map((p: any) => ({
      ...p,
      imageUrl: p.image_url,
      videoUrl: p.video_url,
      tags: p.tags || [],
      gallery: p.gallery || [],
    }));

    setAllProjects(formatted);
    setTags(tagData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ──────── 선택된 프로젝트 (순서 유지) ────────
  const selectedProjects = useMemo(() => {
    const map = new Map(allProjects.map((p) => [p.id, p]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as Project[];
  }, [selectedIds, allProjects]);

  // ──────── 메일 HTML ────────
  const emailHTML = useMemo(
    () => buildEmailHTML({ projects: selectedProjects, tags, content, design }),
    [selectedProjects, tags, content, design]
  );

  // ──────── 검색/필터된 프로젝트 리스트 ────────
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProjects.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.client}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterTagIds.length > 0) {
        const hasAll = filterTagIds.every((t) => p.tags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [allProjects, searchQuery, filterTagIds]);

  // ──────── 핸들러 ────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const moveSelected = (idx: number, dir: 'up' | 'down') => {
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const copyToClipboard = async (text: string, kind: 'html' | 'subject') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      alert('복사에 실패했어요.');
    }
  };

  const resetAll = () => {
    if (!confirm('모든 편집 내용을 초기 상태로 되돌릴까요?\n선택한 프로젝트도 모두 해제됩니다.')) return;
    setContent(DEFAULT_EMAIL_CONTENT);
    setDesign(DEFAULT_EMAIL_DESIGN);
    setSubject(getDefaultSubject());
    setSelectedIds([]);
    setSearchQuery('');
    setFilterTagIds([]);
  };

  const updateContent = <K extends keyof EmailContent>(
    key: K,
    value: EmailContent[K]
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const updateFooter = <K extends keyof EmailContent['footer']>(
    key: K,
    value: EmailContent['footer'][K]
  ) => {
    setContent((prev) => ({ ...prev, footer: { ...prev.footer, [key]: value } }));
  };

  const updateClosingParagraph = (idx: number, value: string) => {
    setContent((prev) => {
      const next = [...prev.closingParagraphs];
      next[idx] = value;
      return { ...prev, closingParagraphs: next };
    });
  };

  const addClosingParagraph = () => {
    setContent((prev) => ({
      ...prev,
      closingParagraphs: [...prev.closingParagraphs, ''],
    }));
  };

  const removeClosingParagraph = (idx: number) => {
    setContent((prev) => ({
      ...prev,
      closingParagraphs: prev.closingParagraphs.filter((_, i) => i !== idx),
    }));
  };

  // 카테고리별 선택 카운트
  const selectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    EMAIL_CATEGORIES.forEach((c) => {
      counts[c.id] = selectedProjects.filter((p) => p.tags.includes(c.id)).length;
    });
    return counts;
  }, [selectedProjects]);

  const typeTags = useMemo(() => tags.filter((t) => t.category === 'type'), [tags]);
  const industryTags = useMemo(
    () => tags.filter((t) => t.category === 'industry'),
    [tags]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* ──────── 헤더 ──────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Mail className="w-5 h-5" /> 메일 빌더
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                선택한 프로젝트로 영업용 HTML 메일을 즉시 생성합니다. 변경사항은 자동 저장됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              데이터 새로고침
            </Button>
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              초기화
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">불러오는 중…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_380px_1fr] gap-4">
            {/* ──────── 좌측: 편집 패널 ──────── */}
            <div className="space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {/* 메일 제목 + 복사 (외부 메일 시스템에 입력할 제목) */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3 space-y-2">
                <Field
                  label="메일 제목 (메일 시스템 발송 시 사용)"
                  hint="HTML 본문에는 영향 없음. 타스온 등에서 메일 제목으로 입력하는 텍스트입니다."
                >
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(subject, 'subject')}
                >
                  {copied === 'subject' ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" /> 제목 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> 제목 복사
                    </>
                  )}
                </Button>
              </div>

              {/* HTML 복사 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <Button
                  className="w-full"
                  onClick={() => copyToClipboard(emailHTML, 'html')}
                  disabled={selectedProjects.length === 0}
                >
                  {copied === 'html' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> HTML 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> 메일 본문 HTML 복사
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  타스온 등 메일 솔루션의 HTML 편집 모드에 그대로 붙여넣으세요.
                </p>
              </div>

              {/* ─── 디자인 ─── */}
              <Section title="🎨 디자인" defaultOpen>
                <Field label="키 컬러" hint="그라디언트와 옅은 배경 등이 자동으로 파생됩니다.">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.keyColor}
                      onChange={(e) =>
                        setDesign({ ...design, keyColor: e.target.value })
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={design.keyColor}
                      onChange={(e) =>
                        setDesign({ ...design, keyColor: e.target.value })
                      }
                      placeholder="#5a47cf"
                      className="flex-1 font-mono"
                    />
                  </div>
                </Field>
              </Section>

              {/* ─── 헤더 ─── */}
              <Section title="📌 헤더">
                <Field label="헤더 타이틀">
                  <Input
                    value={content.headerTitle}
                    onChange={(e) => updateContent('headerTitle', e.target.value)}
                    placeholder="Design Works"
                  />
                </Field>
              </Section>

              {/* ─── 도입부 ─── */}
              <Section title="📣 도입부">
                <Field label="신뢰 뱃지" hint="비워두면 뱃지 자체가 숨겨집니다.">
                  <Input
                    value={content.badgeText}
                    onChange={(e) => updateContent('badgeText', e.target.value)}
                  />
                </Field>
                <Field label="메인 헤드라인" hint="줄바꿈은 Enter로 입력 (HTML <br>로 변환됨)">
                  <Textarea
                    rows={3}
                    value={content.mainHeadline}
                    onChange={(e) => updateContent('mainHeadline', e.target.value)}
                  />
                </Field>
                <Field label="부연 설명">
                  <Textarea
                    rows={3}
                    value={content.introDescription}
                    onChange={(e) => updateContent('introDescription', e.target.value)}
                  />
                </Field>
              </Section>

              {/* ─── 상단 버튼 ─── */}
              <Section title="🔘 상단 버튼" badge={`${content.topButtons.length}`}>
                <ButtonsEditor
                  buttons={content.topButtons}
                  onChange={(b) => updateContent('topButtons', b)}
                  idPrefix="top"
                />
              </Section>

              {/* ─── 카테고리 제목 ─── */}
              <Section title="🗂 카테고리 제목">
                {EMAIL_CATEGORIES.map((c) => (
                  <Field key={c.id} label={`기본: ${c.defaultName}`}>
                    <Input
                      value={content.categoryTitles[c.id] || ''}
                      onChange={(e) =>
                        updateContent('categoryTitles', {
                          ...content.categoryTitles,
                          [c.id]: e.target.value,
                        })
                      }
                      placeholder={c.defaultName}
                    />
                  </Field>
                ))}
              </Section>

              {/* ─── 클로징 메시지 ─── */}
              <Section
                title="✉ 클로징 메시지"
                badge={`${content.closingParagraphs.length}문단`}
              >
                {content.closingParagraphs.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        문단 {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClosingParagraph(idx)}
                        className="text-red-400 hover:text-red-600"
                        title="문단 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <Textarea
                      rows={2}
                      value={p}
                      onChange={(e) => updateClosingParagraph(idx, e.target.value)}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={addClosingParagraph}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> 문단 추가
                </Button>
              </Section>

              {/* ─── 하단 버튼 ─── */}
              <Section title="🔘 하단 버튼" badge={`${content.bottomButtons.length}`}>
                <ButtonsEditor
                  buttons={content.bottomButtons}
                  onChange={(b) => updateContent('bottomButtons', b)}
                  idPrefix="bottom"
                />
              </Section>

              {/* ─── 푸터 ─── */}
              <Section title="📄 푸터">
                <Field label="회사명">
                  <Input
                    value={content.footer.companyName}
                    onChange={(e) => updateFooter('companyName', e.target.value)}
                  />
                </Field>
                <Field label="태그라인" hint="로고 아래 작은 라벨 (영문 권장)">
                  <Input
                    value={content.footer.tagline}
                    onChange={(e) => updateFooter('tagline', e.target.value)}
                  />
                </Field>
                <Field label="주소">
                  <Input
                    value={content.footer.address}
                    onChange={(e) => updateFooter('address', e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="담당자명">
                    <Input
                      value={content.footer.contactName}
                      onChange={(e) => updateFooter('contactName', e.target.value)}
                    />
                  </Field>
                  <Field label="직책">
                    <Input
                      value={content.footer.contactRole}
                      onChange={(e) => updateFooter('contactRole', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="전화">
                  <Input
                    value={content.footer.phone}
                    onChange={(e) => updateFooter('phone', e.target.value)}
                  />
                </Field>
                <Field label="이메일">
                  <Input
                    value={content.footer.email}
                    onChange={(e) => updateFooter('email', e.target.value)}
                  />
                </Field>
                <Field label="홈페이지 (표시용)">
                  <Input
                    value={content.footer.homepage}
                    onChange={(e) => updateFooter('homepage', e.target.value)}
                    placeholder="www.tradeworld.co.kr"
                  />
                </Field>
                <Field label="홈페이지 (링크용 URL)">
                  <Input
                    value={content.footer.homepageUrl}
                    onChange={(e) => updateFooter('homepageUrl', e.target.value)}
                    placeholder="https://www.tradeworld.co.kr"
                  />
                </Field>
              </Section>
            </div>

            {/* ──────── 중앙: 프로젝트 선택 ──────── */}
            <div className="space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3 space-y-2 sticky top-0 z-10">
                <Field label="프로젝트 검색">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="프로젝트명, 클라이언트로 검색"
                      className="pl-9"
                    />
                  </div>
                </Field>
                <Field label="작업 유형 필터">
                  <div className="flex flex-wrap gap-1">
                    {typeTags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFilterTagIds((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((x) => x !== t.id)
                              : [...prev, t.id]
                          )
                        }
                        className={`text-[10px] px-2 py-1 rounded-full border transition ${
                          filterTagIds.includes(t.id)
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-transparent border-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="산업군 필터">
                  <div className="flex flex-wrap gap-1">
                    {industryTags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFilterTagIds((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((x) => x !== t.id)
                              : [...prev, t.id]
                          )
                        }
                        className={`text-[10px] px-2 py-1 rounded-full border transition ${
                          filterTagIds.includes(t.id)
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-transparent border-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* 선택된 항목 요약 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    메일 포함 항목
                  </span>
                  <span className="text-xs font-semibold">
                    총 {selectedProjects.length}개
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {EMAIL_CATEGORIES.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <span>{content.categoryTitles[c.id] || c.defaultName}</span>
                      <span
                        className={
                          selectionCounts[c.id] === 0
                            ? 'text-slate-400'
                            : 'font-semibold text-slate-800 dark:text-slate-200'
                        }
                      >
                        {selectionCounts[c.id]}개
                      </span>
                    </div>
                  ))}
                </div>
                {selectedProjects.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      선택 순서 (메일 표시 순서)
                    </div>
                    {selectedProjects.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <button
                          type="button"
                          onClick={() => moveSelected(idx, 'up')}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelected(idx, 'down')}
                          disabled={idx === selectedProjects.length - 1}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <span className="flex-1 truncate">{p.title}</span>
                        <button
                          type="button"
                          onClick={() => toggleSelect(p.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 프로젝트 리스트 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    전체 프로젝트
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {filteredProjects.length} / {allProjects.length}
                  </span>
                </div>
                <div className="divide-y">
                  {filteredProjects.length === 0 && (
                    <p className="p-4 text-xs text-slate-400 text-center">
                      검색 결과가 없습니다.
                    </p>
                  )}
                  {filteredProjects.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    // type 카테고리 매칭 여부 확인 (메일 노출 가능한지)
                    const hasEmailCategory = EMAIL_CATEGORIES.some((c) =>
                      p.tags.includes(c.id)
                    );
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                          checked ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(p.id)}
                          disabled={!hasEmailCategory}
                          className="flex-shrink-0"
                        />
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {p.client}
                          </div>
                        </div>
                        {!hasEmailCategory && (
                          <span
                            className="text-[9px] text-amber-600 flex-shrink-0"
                            title="영상/카탈로그/웹·앱 카테고리 태그가 없어 메일에 노출 불가"
                          >
                            ⚠
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ──────── 우측: 미리보기 ──────── */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b text-xs text-slate-500 flex items-center justify-between flex-shrink-0">
                <span>미리보기</span>
                <span>600px 폭 (실제 메일과 동일)</span>
              </div>
              {selectedProjects.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-6 text-center">
                  중앙 패널에서 프로젝트를 선택하면 미리보기가 표시됩니다.
                </div>
              ) : (
                <iframe
                  srcDoc={emailHTML}
                  title="Email Preview"
                  className="w-full bg-slate-100 dark:bg-slate-800 flex-1"
                  style={{ border: 'none', minHeight: '600px' }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
