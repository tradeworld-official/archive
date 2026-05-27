// pages/EmailBuilder.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Copy, Check, RefreshCw, Mail, RotateCcw } from 'lucide-react';

import { buildEmailHTML, EmailContent, EmailDesign, DEFAULT_EMAIL_CONTENT, DEFAULT_EMAIL_DESIGN } from '../services/emailTemplate';
import { EditablePreview } from '../components/email/EditablePreview';
import { ProjectPickerModal } from '../components/email/ProjectPickerModal';

export const EmailBuilder: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [content, setContent] = useState<EmailContent>(DEFAULT_EMAIL_CONTENT);
  const [designCfg, setDesignCfg] = useState<EmailDesign>(DEFAULT_EMAIL_DESIGN);
  const [pickerTarget, setPickerTarget] = useState<{ sectionId: string; cardId: string; } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: pData }, { data: tData }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tags').select('*')
    ]);

    setProjects((pData || []).map((p: any) => ({ 
      ...p, 
      imageUrl: p.image_url, 
      videoUrl: p.video_url, 
      thumbnailUrl: p.thumbnail_url,
      websiteUrl: p.website_url, 
      tags: p.tags || [], 
      gallery: p.gallery || [] 
    })));

    setTags(tData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const usedProjectIds = useMemo(() => content.sections.flatMap(s => s.cards.map(c => c.projectId).filter(Boolean) as string[]), [content.sections]);
  const emailHTML = useMemo(() => buildEmailHTML({ projectMap, content, design: designCfg }), [projectMap, content, designCfg]);
  const filledCardCount = usedProjectIds.length;

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(emailHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert('복사에 실패했어요.'); }
  };

  const resetAll = () => {
    if (!confirm('모든 편집 내용을 초기 상태로 되돌릴까요? 선택한 항목도 모두 해제됩니다.')) return;
    setContent(DEFAULT_EMAIL_CONTENT);
    setDesignCfg(DEFAULT_EMAIL_DESIGN);
  };

  const handleProjectPicked = (project: Project) => {
    if (!pickerTarget) return;
    setContent(prev => ({ ...prev, sections: prev.sections.map(s => s.id === pickerTarget.sectionId ? { ...s, cards: s.cards.map(c => c.id === pickerTarget.cardId ? { ...c, projectId: project.id } : c) } : s) }));
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
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
              새로고침
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
            {/* 좌측 컨트롤 패널 */}
            <div className="space-y-3">
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

              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block">
                  키 컬러
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={designCfg.keyColor}
                    onChange={(e) => setDesignCfg({ ...designCfg, keyColor: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={designCfg.keyColor}
                    onChange={(e) => setDesignCfg({ ...designCfg, keyColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  그라디언트, 뱃지 배경, 카테고리 밑줄 등이 자동 파생됩니다.
                </p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  편집 가이드
                </div>
                <ul className="space-y-1 list-disc pl-3.5">
                  <li>모든 텍스트는 클릭하면 편집 가능</li>
                  <li>빈 카드 클릭 → 프로젝트 선택 모달</li>
                  <li>섹션·카드·버튼은 마우스 올리면 ✕ ↑↓ 표시</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  현황
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">섹션</span>
                    <span className="font-semibold">{content.sections.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">선택 프로젝트</span>
                    <span className="font-semibold">{filledCardCount}개</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 미리보기 패널 */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 overflow-x-auto">
              <EditablePreview
                content={content}
                design={designCfg}
                projectMap={projectMap}
                onContentChange={setContent}
                onCardClick={(sId, cId) => setPickerTarget({ sectionId: sId, cardId: cId })}
              />
            </div>
          </div>
        )}
      </div>

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
