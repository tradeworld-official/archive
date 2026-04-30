// pages/EmailBuilder.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Exhibition, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Copy, Check, RefreshCw, Mail, RotateCcw } from 'lucide-react';

// Design Models
import { buildEmailHTML, EmailContent, EmailDesign, DEFAULT_EMAIL_CONTENT, DEFAULT_EMAIL_DESIGN } from '../services/emailTemplate';
import { EditablePreview } from '../components/email/EditablePreview';
import { ProjectPickerModal } from '../components/email/ProjectPickerModal';

// Exhibition Models
import { buildExhibitionEmailHTML, ExhibitionEmailContent, DEFAULT_EXHIBITION_EMAIL_CONTENT } from '../services/exhibitionEmailTemplate';
import { EditableExhibitionPreview } from '../components/email/EditableExhibitionPreview';
import { ExhibitionPickerModal } from '../components/email/ExhibitionPickerModal';

export const EmailBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'design' | 'exhibition'>('design');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Design State
  const [content, setContent] = useState<EmailContent>(DEFAULT_EMAIL_CONTENT);
  const [designCfg, setDesignCfg] = useState<EmailDesign>(DEFAULT_EMAIL_DESIGN);
  const [pickerTarget, setPickerTarget] = useState<{ sectionId: string; cardId: string; } | null>(null);

  // Exhibition State
  const [exhContent, setExhContent] = useState<ExhibitionEmailContent>(DEFAULT_EXHIBITION_EMAIL_CONTENT);
  const [exhDesignCfg, setExhDesignCfg] = useState<EmailDesign>(DEFAULT_EMAIL_DESIGN);
  const [exhPickerTarget, setExhPickerTarget] = useState<{ sectionId: string; slotId: string; } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: pData }, { data: eData }, { data: tData }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('exhibitions').select('*').order('display_order', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('tags').select('*')
    ]);

    setProjects((pData || []).map((p: any) => ({ 
      ...p, 
      imageUrl: p.image_url, 
      videoUrl: p.video_url, 
      thumbnailUrl: p.thumbnail_url, // ✅ 매핑 유지
      websiteUrl: p.website_url, 
      tags: p.tags || [], 
      gallery: p.gallery || [] 
    })));

    setExhibitions((eData || []).map((row: any) => ({
      id: row.id, name: row.name, nameEn: row.name_en, description: row.description, logoUrl: row.logo_url, imageUrl: row.image_url, gallery: row.gallery || [], startDate: row.start_date, endDate: row.end_date, venueCountry: row.venue_country, venueCity: row.venue_city, venueName: row.venue_name, tags: row.tags || [], customFields: row.custom_fields || [], isActive: row.is_active ?? true, isPublic: row.is_public ?? false, displayOrder: row.display_order ?? 0
    })));

    setTags(tData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const exhibitionMap = useMemo(() => new Map(exhibitions.map(e => [e.id, e])), [exhibitions]);

  const usedProjectIds = useMemo(() => content.sections.flatMap(s => s.cards.map(c => c.projectId).filter(Boolean) as string[]), [content.sections]);
  const usedExhIds = useMemo(() => exhContent.sections.flatMap(s => s.slots.map(c => c.exhibitionId).filter(Boolean) as string[]), [exhContent.sections]);

  const emailHTML = useMemo(() => buildEmailHTML({ projectMap, content, design: designCfg }), [projectMap, content, designCfg]);
  const exhEmailHTML = useMemo(() => buildExhibitionEmailHTML({ exhibitionMap, content: exhContent, design: exhDesignCfg }), [exhibitionMap, exhContent, exhDesignCfg]);

  const filledCardCount = usedProjectIds.length;
  const filledSlotCount = usedExhIds.length;

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(activeTab === 'design' ? emailHTML : exhEmailHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert('복사에 실패했어요.'); }
  };

  const resetAll = () => {
    if (!confirm('현재 탭의 모든 편집 내용을 초기 상태로 되돌릴까요? 선택한 항목도 모두 해제됩니다.')) return;
    if (activeTab === 'design') { 
      setContent(DEFAULT_EMAIL_CONTENT); 
      setDesignCfg(DEFAULT_EMAIL_DESIGN); 
    } else { 
      setExhContent(DEFAULT_EXHIBITION_EMAIL_CONTENT); 
      setExhDesignCfg(DEFAULT_EMAIL_DESIGN); 
    }
  };

  const handleProjectPicked = (project: Project) => {
    if (!pickerTarget) return;
    setContent(prev => ({ ...prev, sections: prev.sections.map(s => s.id === pickerTarget.sectionId ? { ...s, cards: s.cards.map(c => c.id === pickerTarget.cardId ? { ...c, projectId: project.id } : c) } : s) }));
  };

  const handleExhibitionPicked = (exhibition: Exhibition) => {
    if (!exhPickerTarget) return;
    setExhContent(prev => ({ ...prev, sections: prev.sections.map(s => s.id === exhPickerTarget.sectionId ? { ...s, slots: s.slots.map(c => c.id === exhPickerTarget.slotId ? { ...c, exhibitionId: exhibition.id } : c) } : s) }));
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
             <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md mr-2">
              <button onClick={() => setActiveTab('design')} className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'design' ? 'bg-white dark:bg-slate-950 shadow-sm text-black dark:text-white' : 'text-slate-500'}`}>디자인 / 영상</button>
              <button onClick={() => setActiveTab('exhibition')} className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'exhibition' ? 'bg-white dark:bg-slate-950 shadow-sm text-black dark:text-white' : 'text-slate-500'}`}>해외 전시</button>
            </div>
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
                  disabled={(activeTab === 'design' ? filledCardCount : filledSlotCount) === 0}
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
                {(activeTab === 'design' ? filledCardCount : filledSlotCount) === 0 && (
                  <p className="text-[10px] text-amber-600 mt-2">
                    {activeTab === 'design' ? '프로젝트를' : '전시를'} 1개 이상 선택해야 복사할 수 있어요.
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
                    value={activeTab === 'design' ? designCfg.keyColor : exhDesignCfg.keyColor}
                    onChange={(e) => activeTab === 'design' ? setDesignCfg({ ...designCfg, keyColor: e.target.value }) : setExhDesignCfg({ ...exhDesignCfg, keyColor: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={activeTab === 'design' ? designCfg.keyColor : exhDesignCfg.keyColor}
                    onChange={(e) => activeTab === 'design' ? setDesignCfg({ ...designCfg, keyColor: e.target.value }) : setExhDesignCfg({ ...exhDesignCfg, keyColor: e.target.value })}
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
                  <li>빈 카드 클릭 → {activeTab === 'design' ? '프로젝트' : '전시'} 선택 모달</li>
                  <li>섹션·카드·버튼은 마우스 올리면 ✕ ↑↓ 표시</li>
                  {activeTab === 'exhibition' && <li>섹션 호버 → 1col/2col 토글</li>}
                  {activeTab === 'exhibition' && <li>카드 호버 → 👁 아이콘으로 기본/상세 토글</li>}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  현황
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">섹션</span>
                    <span className="font-semibold">
                      {activeTab === 'design' ? content.sections.length : exhContent.sections.length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">선택 {activeTab === 'design' ? '프로젝트' : '전시'}</span>
                    <span className="font-semibold">
                      {activeTab === 'design' ? filledCardCount : filledSlotCount}개
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 미리보기 패널 */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 overflow-x-auto">
              {activeTab === 'design' ? (
                <EditablePreview
                  content={content}
                  design={designCfg}
                  projectMap={projectMap}
                  onContentChange={setContent}
                  onCardClick={(sId, cId) => setPickerTarget({ sectionId: sId, cardId: cId })}
                />
              ) : (
                 <EditableExhibitionPreview 
                  content={exhContent} 
                  design={exhDesignCfg} 
                  exhibitionMap={exhibitionMap} 
                  onContentChange={setExhContent} 
                  onSlotClick={(sId, slId) => setExhPickerTarget({ sectionId: sId, slotId: slId })} 
                />
              )}
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

       <ExhibitionPickerModal 
        open={!!exhPickerTarget} 
        onClose={() => setExhPickerTarget(null)} 
        onSelect={handleExhibitionPicked} 
        exhibitions={exhibitions} 
        tags={tags} 
        alreadySelectedIds={usedExhIds} 
      />
    </div>
  );
};
