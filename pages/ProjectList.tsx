import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase'; 
import { Input } from '../components/ui/Input';
import { Search } from 'lucide-react';
import { PDFButton } from '../components/PDFButton'; 

const getVimeoId = (url: string) => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
  return match ? match[1] : null;
};

// URL 쿼리 ↔ 배열 변환 헬퍼
const parseSlugs = (raw: string | null): string[] =>
  raw ? raw.split(',').filter(Boolean) : [];

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ 태그 선택 상태를 URL 쿼리(?industry=slug1,slug2&type=slug3)로 관리
  const [searchParams, setSearchParams] = useSearchParams();

  // tag id ↔ slug 양방향 맵
  const idToSlug = useMemo(() => {
    const m = new Map<string, string>();
    tags.forEach(t => { if (t.slug) m.set(t.id, t.slug); });
    return m;
  }, [tags]);

  const slugToId = useMemo(() => {
    const m = new Map<string, string>();
    tags.forEach(t => { if (t.slug) m.set(t.slug, t.id); });
    return m;
  }, [tags]);

  // URL의 slug들을 실제 tag id로 변환 (매칭 안 되는 slug는 무시)
  const selectedIndustryIds = useMemo(() => {
    return parseSlugs(searchParams.get('industry'))
      .map(slug => slugToId.get(slug))
      .filter((id): id is string => !!id);
  }, [searchParams, slugToId]);

  const selectedTypeIds = useMemo(() => {
    return parseSlugs(searchParams.get('type'))
      .map(slug => slugToId.get(slug))
      .filter((id): id is string => !!id);
  }, [searchParams, slugToId]);

  // 쿼리 파라미터 업데이트 (id 배열을 받아서 slug로 변환해 URL에 씀)
  // slug 없는 태그는 URL에 들어가지 않음 = 공유 불가, 하지만 화면 필터링은 정상 동작
  const updateParam = (key: 'industry' | 'type', ids: string[]) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const slugs = ids.map(id => idToSlug.get(id)).filter((s): s is string => !!s);
        if (slugs.length === 0) {
          next.delete(key);
        } else {
          next.set(key, slugs.join(','));
        }
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [projectResult, tagResult] = await Promise.all([
        supabase.from('projects').select('*').order('date', { ascending: false }),
        supabase.from('tags').select('*').order('name', { ascending: true })
      ]);

      const formattedProjects = (projectResult.data || []).map((p: any) => ({
        ...p,
        imageUrl: p.image_url, 
        thumbnailUrl: p.thumbnail_url,
        videoUrl: p.video_url, 
        websiteUrl: p.website_url,
        tags: p.tags || [],
        gallery: p.gallery || []
      }));

      setProjects(formattedProjects);
      setTags(tagResult.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const industryTags = useMemo(() => tags.filter(t => t.category === 'industry'), [tags]);
  const typeTags = useMemo(() => tags.filter(t => t.category === 'type'), [tags]);

  // 화면 내 필터링은 여전히 id 기반 (선택된 id 배열을 가지고 toggle)
  const toggleIndustry = (id: string) => {
    const next = selectedIndustryIds.includes(id)
      ? selectedIndustryIds.filter((i) => i !== id)
      : [...selectedIndustryIds, id];
    updateParam('industry', next);
  };

  const toggleType = (id: string) => {
    const next = selectedTypeIds.includes(id)
      ? selectedTypeIds.filter((i) => i !== id)
      : [...selectedTypeIds, id];
    updateParam('type', next);
  };

  const clearIndustries = () => updateParam('industry', []);
  const clearTypes = () => updateParam('type', []);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            project.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = selectedIndustryIds.length === 0 || 
                              project.tags.some(tagId => selectedIndustryIds.includes(tagId));
      
      const matchesType = selectedTypeIds.length === 0 || 
                          project.tags.some(tagId => selectedTypeIds.includes(tagId));
      
      return matchesSearch && matchesIndustry && matchesType;
    });
  }, [projects, searchTerm, selectedIndustryIds, selectedTypeIds]);

  if (loading) {
    return <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-sm text-muted-foreground">Loading works...</div>;
  }

  return (
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in duration-500 relative">
      
      <div className="flex flex-col gap-8 mb-12 no-print">
        <div className="w-full relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-8 h-12 text-lg border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Industry</span>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={clearIndustries}
                        className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200
                        ${selectedIndustryIds.length === 0 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'
                        }`}
                    >
                        All
                    </button>
                    {industryTags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => toggleIndustry(tag.id)}
                            className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200
                            ${selectedIndustryIds.includes(tag.id) 
                                ? 'bg-foreground text-background border-foreground' 
                                : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'
                            }`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>

             <div className="flex-1 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Work Type</span>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={clearTypes}
                        className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200
                        ${selectedTypeIds.length === 0 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'
                        }`}
                    >
                        All
                    </button>
                    {typeTags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => toggleType(tag.id)}
                            className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200
                            ${selectedTypeIds.includes(tag.id) 
                                ? 'bg-foreground text-background border-foreground' 
                                : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'
                            }`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 print:grid-cols-4 print:gap-6">
        {filteredProjects.map((project) => {
          const vimeoId = project.videoUrl ? getVimeoId(project.videoUrl) : null;

          return (
            <Link key={project.id} to={`/project/${project.slug}`} className="group block space-y-3 print-break-avoid">
              
              <div className="overflow-hidden bg-muted aspect-[4/3] relative w-full pointer-events-none">
                {vimeoId ? (
                  <div className="absolute inset-0 w-full h-full">
                     <iframe 
                        src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
                        className="absolute top-1/2 left-1/2 w-[180%] h-[180%] -translate-x-1/2 -translate-y-1/2 object-cover"
                        allow="autoplay; fullscreen; picture-in-picture"
                        title={project.title}
                     />
                  </div>
                ) : (
                  <>
                    <img 
                      src={project.thumbnailUrl || project.imageUrl} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-medium leading-none group-hover:text-primary/80 transition-colors">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                </div>
              </div>
            </Link>
          );
        })}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No projects found matching your criteria.
          </div>
        )}
      </div>

      <div className="fixed bottom-8 right-8 z-50 no-print opacity-50 hover:opacity-100 transition-opacity duration-300">
        <PDFButton />
      </div>
    </div>
  );
};
