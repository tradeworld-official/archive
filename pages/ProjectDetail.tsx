import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase'; 
import { ArrowLeft, LayoutGrid, Rows, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PDFButton } from '../components/PDFButton'; 

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

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single(); 

      const { data: allTags, error: tagsError } = await supabase
        .from('tags')
        .select('*');
      
      if (projectError) console.error('Error fetching project:', projectError);

      if (projectData) {
        const formattedProject = {
          ...projectData,
          imageUrl: projectData.image_url, 
          thumbnailUrl: projectData.thumbnail_url, // ✅ 매핑 추가
          videoUrl: projectData.video_url, 
          websiteUrl: projectData.website_url, 
          tags: projectData.tags || [],
          gallery: projectData.gallery || []
        };

        setProject(formattedProject);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}. ${month}`;
  };

  const vimeoId = project.videoUrl ? getVimeoId(project.videoUrl) : null;

  return (
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
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
            <div className="md:col-span-4 lg:col-span-4 h-fit md:sticky md:top-24 print:col-span-4">
                 <div className="space-y-12">
                     <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-6 break-words">{project.title}</h1>
                        <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{project.description}</p>
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

                        {project.websiteUrl && (
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">Link</span>
                                <div className="flex flex-wrap gap-2 no-print">
                                    <a 
                                        href={project.websiteUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-slate-400 dark:hover:border-slate-600 transition-colors group"
                                    >
                                        웹사이트 방문하기
                                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </a>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            <div className="md:col-span-8 lg:col-span-8 print:col-span-8">
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

                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-6'} print:grid print:grid-cols-2 print:gap-4`}>
                    {project.imageUrl && (
                        <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="w-full h-auto object-contain bg-muted break-inside-avoid"
                        />
                    )}
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

        <div className="fixed bottom-8 right-8 z-50 no-print opacity-50 hover:opacity-100 transition-opacity duration-300">
            <PDFButton />
        </div>
    </div>
  );
};
