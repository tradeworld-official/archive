import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { supabase } from '../supabase';
import { Input } from '../components/ui/Input';
import { Search } from 'lucide-react';
import { PDFButton } from '../components/PDFButton'; // PDF 버튼

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [projectResult, tagResult] = await Promise.all([
        supabase.from('projects').select('*').order('date', { ascending: false }),
        supabase.from('tags').select('*').order('name', { ascending: true })
      ]);

      const projectData = projectResult.data;
      const tagsData = tagResult.data;
      const projectError = projectResult.error;
      const tagError = tagResult.error;

      if (projectError) console.error('Error fetching projects:', projectError);
      if (tagError) console.error('Error fetching tags:', tagError);

      const formattedProjects = (projectData || []).map((p: any) => ({
        ...p,
        imageUrl: p.image_url,
        tags: p.tags || [],
        gallery: p.gallery || []
      }));

      setProjects(formattedProjects);
      setTags(tagsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const industryTags = useMemo(() => tags.filter(t => t.category === 'industry'), [tags]);
  const typeTags = useMemo(() => tags.filter(t => t.category === 'type'), [tags]);

  const toggleIndustry = (id: string) => {
    setSelectedIndustryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleType = (id: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearIndustries = () => setSelectedIndustryIds([]);
  const clearTypes = () => setSelectedTypeIds([]);

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
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in duration-500">
      
      {/* Controls */}
      <div className="flex flex-col gap-8 mb-12">
        
        {/* ✅ [수정됨] 불필요한 텍스트 삭제하고 PDF 버튼만 우측 상단에 배치 */}
        <div className="flex justify-end no-print">
           <PDFButton />
        </div>

        {/* Full Width Search */}
        <div className="w-full relative no-print">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-8 h-12 text-lg border-0 border-b border-border rounded-none bg-transparent px-0
