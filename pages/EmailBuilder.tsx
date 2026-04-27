// pages/EmailBuilder.tsx
// 영업용 HTML 메일 빌더 v3
// - 좌측: 키 컬러 + HTML 복사 버튼 (최소화)
// - 우측: 인플레이스 편집 가능한 메일 미리보기
// - 빈 카드 클릭 → 프로젝트 선택 모달
// - 모든 텍스트는 미리보기에서 직접 클릭 편집
// - 페이지 떠나면 작업 내용 초기화 (저장 X)

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  buildEmailHTML,
  EmailContent,
  EmailDesign,
  DEFAULT_EMAIL_CONTENT,
  DEFAULT_EMAIL_DESIGN,
} from '../services/emailTemplate';
import { EditablePreview } from '../components/email/EditablePreview';
import { ProjectPickerModal } from '../components/email/ProjectPickerModal';
import {
  ChevronLeft,
  Copy,
  Check,
  RefreshCw,
  Mail,
  RotateCcw,
} from 'lucide-react';

export const EmailBuilder: React.FC = () => {
  // ──────── 데이터 ────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // ──────── 편집 상태 (페이지 새로고침하면 초기화됨) ────────
  const [content, setContent] = useState<EmailContent>(DEFAULT_EMAIL_CONTENT);
  const [design, setDesign] = useState<EmailDesign>(DEFAULT_EMAIL_DESIGN);

  // ──────── 모달 상태 ────────
  const [pickerTarget, setPickerTarget] = useState<{
    sectionId: string;
    cardId: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

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

    setProjects(formatted);
    setTags(tagData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ──────── 프로젝트 lookup map ────────
  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  // ──────── 사용된 프로젝트 ID들 (모달에서 표시용) ────────
  const usedProjectIds = useMemo(
    () =>
      content.sections.flatMap((s) =>
        s.cards.map((c) => c.projectId).filter(Boolean) as string[]
      ),
    [content.sections]
  );

  // ──────── 메일 HTML 생성 ────────
  const emailHTML = useMemo(
    () => buildEmailHTML({ projectMap, content, design }),
    [projectMap, content, design]
  );

  // 메일에 포함된 프로젝트 카운트 (HTML 복사 버튼 활성화 조건)
  const filledCardCount = usedProjectIds.length;

  // ──────── 핸들러 ────────
  const handleCardClick = (sectionId: string, cardId: string) => {
    setPickerTarget({ sectionId, cardId });
  };

  const handleProjectPicked = (project: Project) => {
    if (!pickerTarget) return;
    const { sectionId, cardId } = pickerTarget;
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              cards: s.cards.map((c) =>
                c.id === cardId ? { ...c, projectId: project.id } : c
              ),
            }
          : s
      ),
    }));
  };

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(emailHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사에 실패했어요.');
    }
  };

  const resetAll = () => {
    if (
      !confirm(
        '모든 편집 내용을 초기 상태로 되돌릴까요? 선택한 프로젝트도 모두 해제됩니다.'
      )
    )
      return;
    setContent(DEFAULT_EMAIL_CONTENT);
    setDesign(DEFAULT_EMAIL_DESIGN);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        {/* 상단 헤더 */}
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
                미리보기에서 직접 클릭해 편집하세요. 변경사항은 페이지를 떠나면 초기화됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
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
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
            {/* ──────── 좌측: 최소화된 컨트롤 ──────── */}
            <div className="space-y-3">
              {/* HTML 복사 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3 sticky top-4">
                <Button
                  className="w-full"
                  onClick={copyHTML}
                  disabled={filledCardCount === 0}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> 복사 완료
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> 메일 HTML 복사
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  타스온 등 메일 솔루션의 HTML 편집 모드에 그대로 붙여넣으세요.
                </p>
                {filledCardCount === 0 && (
                  <p className="text-[10px] text-amber-600 mt-2">
                    프로젝트를 1개 이상 선택해야 복사할 수 있어요.
                  </p>
                )}
              </div>

              {/* 키 컬러 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block">
                  키 컬러
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.keyColor}
                    onChange={(e) =>
                      setDesign({ ...design, keyColor: e.target.value })
                    }
                    className="h-9 w-12 rounded border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={design.keyColor}
                    onChange={(e) =>
                      setDesign({ ...design, keyColor: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  그라디언트, 뱃지 배경, 카테고리 밑줄 등이 자동 파생됩니다.
                </p>
              </div>

              {/* 사용 안내 */}
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  편집 가이드
                </div>
                <ul className="space-y-1 list-disc pl-3.5">
                  <li>모든 텍스트는 클릭하면 편집 가능</li>
                  <li>빈 카드 클릭 → 프로젝트 선택 모달</li>
                  <li>섹션·카드·버튼은 마우스 올리면 ✕ ↑↓ 표시</li>
                  <li>섹션 사이 공간에 마우스 → 새 섹션 추가</li>
                </ul>
              </div>

              {/* 카운트 정보 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  현황
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">섹션</span>
                    <span className="font-semibold">
                      {content.sections.length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">선택 프로젝트</span>
                    <span className="font-semibold">{filledCardCount}개</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ──────── 우측: 편집 가능한 미리보기 ──────── */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 overflow-x-auto">
              <EditablePreview
                content={content}
                design={design}
                projectMap={projectMap}
                onContentChange={setContent}
                onCardClick={handleCardClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* 프로젝트 선택 모달 */}
      <ProjectPickerModal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onSelect={handleProjectPicked}
        projects={projects}
        tags={tags}
        alreadySelectedIds={usedProjectIds}
      />
    </div>
  );
};
