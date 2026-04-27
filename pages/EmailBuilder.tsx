// pages/EmailBuilder.tsx
// 영업용 HTML 메일 빌더
// featured=true 프로젝트를 카테고리별로 자동 분류해 메일 HTML 생성

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  buildEmailHTML,
  groupProjectsByCategory,
  EMAIL_CATEGORIES,
  MAX_PER_CATEGORY,
} from '../services/emailTemplate';
import {
  ChevronLeft,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Star,
  AlertCircle,
} from 'lucide-react';

// 메일 제목 자동 생성 (예: "[2026년 4월] 트레이드월드 디자인 포트폴리오 안내")
const getDefaultSubject = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `[${year}년 ${month}월] 트레이드월드 디자인 포트폴리오 안내`;
};

export const EmailBuilder: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<string>(getDefaultSubject());
  const [copied, setCopied] = useState<'html' | 'subject' | null>(null);

  const fetchData = async () => {
    setLoading(true);

    // featured=true 프로젝트만 가져옴 (created_at 최신순)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('*');

    if (projectError) console.error('Error fetching projects:', projectError);
    if (tagError) console.error('Error fetching tags:', tagError);

    // snake_case → camelCase 변환
    const formattedProjects: Project[] = (projectData || []).map((p: any) => ({
      ...p,
      imageUrl: p.image_url,
      videoUrl: p.video_url,
      tags: p.tags || [],
      gallery: p.gallery || [],
    }));

    setProjects(formattedProjects);
    setTags(tagData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 카테고리별 분류 (메모이제이션)
  const grouped = useMemo(
    () => groupProjectsByCategory(projects, tags),
    [projects, tags]
  );

  // 메일 HTML 생성
  const emailHTML = useMemo(
    () => buildEmailHTML({ projects, tags }),
    [projects, tags]
  );

  // 클립보드 복사
  const copyToClipboard = async (text: string, kind: 'html' | 'subject') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      alert('복사에 실패했어요. 브라우저 권한을 확인해주세요.');
    }
  };

  // 카테고리에서 제외된 프로젝트 (어떤 EMAIL_CATEGORIES tag도 매칭 안 되는 featured)
  const orphanedFeatured = useMemo(() => {
    const categoryIds = new Set(EMAIL_CATEGORIES.map((c) => c.id));
    return projects.filter(
      (p) => p.featured && !p.tags.some((t) => categoryIds.has(t))
    );
  }, [projects]);

  const totalCount = grouped.reduce((sum, g) => sum + g.projects.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
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
                ★ Featured 프로젝트를 자동으로 가져와 영업용 HTML 메일을 생성합니다.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">불러오는 중…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
            {/* === 좌측: 컨트롤 패널 === */}
            <div className="space-y-4">
              {/* 메일 제목 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  메일 제목
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="메일 제목을 입력하세요"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => copyToClipboard(subject, 'subject')}
                >
                  {copied === 'subject' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> 제목 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> 제목 복사
                    </>
                  )}
                </Button>
              </div>

              {/* HTML 복사 버튼 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  메일 본문 HTML
                </label>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  타스온 등 메일 솔루션의 HTML 편집 모드에 그대로 붙여넣으면 됩니다.
                </p>
                <Button
                  className="w-full"
                  onClick={() => copyToClipboard(emailHTML, 'html')}
                  disabled={totalCount === 0}
                >
                  {copied === 'html' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> HTML 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> HTML 복사
                    </>
                  )}
                </Button>
              </div>

              {/* 포함 항목 요약 */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border p-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                  메일 포함 항목 ({totalCount}개)
                </label>

                {totalCount === 0 ? (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      Featured로 설정된 프로젝트가 없습니다. Admin 페이지에서
                      별 아이콘(★)을 눌러 메일에 포함할 프로젝트를 선택해주세요.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {grouped.map((g) => (
                      <div key={g.categoryId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium">
                            {g.categoryName}
                          </span>
                          <span
                            className={`text-xs ${
                              g.projects.length === 0
                                ? 'text-slate-400'
                                : 'text-slate-700 dark:text-slate-300 font-semibold'
                            }`}
                          >
                            {g.projects.length}
                            {g.projects.length >= MAX_PER_CATEGORY && ` (최대)`}
                          </span>
                        </div>
                        {g.projects.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">
                            (메일에서 제외됨)
                          </div>
                        ) : (
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 pl-3">
                            {g.projects.map((p) => (
                              <li key={p.id} className="truncate">
                                · {p.title}{' '}
                                <span className="text-slate-400">
                                  ({p.client})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 카테고리 미매칭 경고 */}
              {orphanedFeatured.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 p-4">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong>
                        Featured이지만 메일에 포함되지 않는 프로젝트{' '}
                        {orphanedFeatured.length}개
                      </strong>
                      <p className="mt-1 text-amber-700 dark:text-amber-300">
                        영상 / 카탈로그 / 웹·앱 카테고리 태그가 없는 프로젝트는
                        메일에 자동 노출되지 않아요.
                      </p>
                      <ul className="mt-2 space-y-0.5">
                        {orphanedFeatured.map((p) => (
                          <li key={p.id} className="truncate">
                            · {p.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 안내 박스 */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="font-semibold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> 사용 방법
                </div>
                <ol className="space-y-1 pl-4 list-decimal">
                  <li>Admin 페이지에서 메일에 노출할 프로젝트의 ★ 아이콘 클릭</li>
                  <li>이 페이지로 돌아와 미리보기 확인</li>
                  <li>"HTML 복사" 클릭 → 타스온 HTML 편집 모드에 붙여넣기</li>
                  <li>"제목 복사"로 메일 제목도 가져가기</li>
                </ol>
              </div>
            </div>

            {/* === 우측: 미리보기 === */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b text-xs text-slate-500 flex items-center justify-between">
                <span>미리보기</span>
                <span>600px 폭 (실제 메일과 동일)</span>
              </div>
              <iframe
                srcDoc={emailHTML}
                title="Email Preview"
                className="w-full bg-slate-100 dark:bg-slate-800"
                style={{ height: 'calc(100vh - 180px)', minHeight: '600px', border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
