import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase'; // ✅ 진짜 Supabase 연결
import { ArrowLeft, LayoutGrid, Rows } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PDFButton } from '../components/PDFButton'; // ✅ PDF 버튼 컴포넌트

// ✅ [추가됨] 비메오 ID 추출 헬퍼 함수
const getVimeoId = (url: string) => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
  return match ? match[1] : null;
};

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTags, setProjectTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'grid'>('full');

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setLoading(true);

      // 1. 프로젝트 데이터 가져오기
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single(); // 하나만 가져오기

      // 2. 전체 태그 가져오기 (매칭을 위해)
      const { data: allTags, error: tagsError } = await supabase
        .from('tags')
        .select('*');
      
      if (projectError) {
        console.error('Error fetching project:', projectError);
      }

      if (projectData) {
        // 3. 데이터 변환 (DB: snake_case -> App: camelCase)
        const formattedProject = {
          ...projectData,
          imageUrl: projectData.image_url, // 👈 핵심 변환 (이거 없으면 이미지 안 뜸)
          videoUrl: projectData.video_url, // ✅ [수정됨] 여기가 빠져있었습니다! DB의 video_url을 가져옵니다.
          tags: projectData.tags || [],
          gallery: projectData.gallery || []
        };

        setProject(formattedProject);

        // 4. 이 프로젝트에 해당하는 태그만 걸러내기
        if (allTags) {
          const matchedTags = allTags.filter((t: Tag) => formattedProject.tags.includes(t.id));
          setProjectTags(matchedTags);
        }
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="h-screen flex items-center justify-center">Project not found</div>;

  const industryTags = projectTags.filter(t => t.category === 'industry');
  const typeTags = projectTags.filter(t => t.category === 'type');

  // Format date: YYYY-MM -> YYYY. MM
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}. ${month}`;
  };

  // ✅ [추가됨] 비메오 ID 추출
  const vimeoId = project.videoUrl ? getVimeoId(project.videoUrl) : null;

  return (
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
        
        {/* ✅ [수정됨] 헤더 컨테이너 전체에 'no-print' 추가 */}
        {/* 인쇄 시 이 부분이 통째로 사라지므로, 여백 없이 깔끔하게 제목부터 시작됩니다. */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 no-print">
            <Link to="/list" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to list
            </Link>

            <div className="hidden md:flex gap-2 self-end md:self-auto">
                <Button 
                    variant={viewMode === 'full' ? 'default' : 'ghost'} 
                    size="icon" 
                    onClick={() => setViewMode('full')}
                    title="Full View"
                >
                    <Rows className="w-4 h-4" />
                </Button>
                <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="icon" 
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                >
                    <LayoutGrid className="w-4 h-4" />
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-12 items-start print:grid-cols-12">
            
            {/* Left Column: Sticky Info */}
            <div className="md:col-span-4 lg:col-span-4 h-fit md:sticky md:top-24 print:col-span-4">
                 <div className="space-y-12">
                     <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-6 break-words">{project.title}</h1>
                        <p className="text-lg leading-relaxed text-muted-foreground">{project.description}</p>
                     </div>

                     <div className="space-y-8 border-t border-border pt-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">Client</span>
                                <span className="text-lg">{project.client}</span>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">Date</span>
                                <span className="text-lg">{formatDate(project.date)}</span>
                            </div>
                        </div>

                        {/* Industry Tags */}
                        {industryTags.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">Industry</span>
                                <div className="flex flex-wrap gap-2">
                                    {industryTags.map(tag => (
                                        <span key={tag.id} className="text-sm px-4 py-1.5 rounded-full border border-border text-muted-foreground">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Work Type Tags */}
                        {typeTags.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">Work Type</span>
                                <div className="flex flex-wrap gap-2">
                                    {typeTags.map(tag => (
                                        <span key={tag.id} className="text-sm px-4 py-1.5 rounded-full border border-border text-muted-foreground">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Right Column: Video & Images */}
            <div className="md:col-span-8 lg:col-span-8 print:col-span-8">
                
                {/* ✅ [추가됨] 비메오 영상 영역 (항상 최상단 16:9 노출) */}
                {vimeoId && (
                    <div className="w-full aspect-video mb-6 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden no-print">
                        <iframe 
                            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title={project.title}
                        />
                    </div>
                )}

                {/* 이미지 영역: 뷰 모드에 따라 그리드/스택 변경 */}
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-6'} print:grid print:grid-cols-2 print:gap-4`}>
                    {/* Main Image */}
                    {project.imageUrl && (
                        <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="w-full h-auto object-contain bg-muted break-inside-avoid"
                        />
                    )}
                    {/* Gallery Images */}
                    {project.gallery && project.gallery.map((img, idx) => (
                        <img 
                            key={idx}
                            src={img} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-full h-auto object-contain bg-muted break-inside-avoid"
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* ✅ [유지됨] 우측 하단 고정 PDF 버튼 (인쇄 시 숨김, 평소엔 반투명) */}
        <div className="fixed bottom-8 right-8 z-50 no-print opacity-50 hover:opacity-100 transition-opacity duration-300">
            <PDFButton />
        </div>
    </div>
  );
};
