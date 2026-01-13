import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { mockSupabase } from '../services/mockSupabase';
import { ArrowLeft, LayoutGrid, Rows } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
      const proj = await mockSupabase.data.getProjectById(id);
      const allTags = await mockSupabase.data.getTags();
      
      if (proj) {
        setProject(proj);
        setProjectTags(allTags.filter(t => proj.tags.includes(t.id)));
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

  return (
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Top Header: Back Link and View Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-12 items-start">
            
            {/* Left Column: Sticky Info */}
            <div className="md:col-span-4 lg:col-span-4 h-fit md:sticky md:top-24">
                 <div className="space-y-12">
                     <div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6 break-words">{project.title}</h1>
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

            {/* Right Column: Images */}
            <div className="md:col-span-8 lg:col-span-8">
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-6'}>
                    {/* Main Image */}
                    <img 
                        src={project.imageUrl} 
                        alt={project.title} 
                        className="w-full h-auto object-contain bg-muted"
                    />
                    {/* Gallery Images */}
                    {project.gallery.map((img, idx) => (
                        <img 
                            key={idx}
                            src={img} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-full h-auto object-contain bg-muted"
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};