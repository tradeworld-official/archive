import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Project, Tag } from '../types';
import { mockSupabase } from '../services/mockSupabase';
import { Input } from '../components/ui/Input';
import { Search } from 'lucide-react';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Separate state for categories
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [projectsData, tagsData] = await Promise.all([
        mockSupabase.data.getProjects(),
        mockSupabase.data.getTags()
      ]);
      setProjects(projectsData);
      setTags(tagsData);
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
      
      // Project must match AT LEAST ONE selected industry (if any selected)
      const matchesIndustry = selectedIndustryIds.length === 0 || 
                              project.tags.some(tagId => selectedIndustryIds.includes(tagId));
      
      // AND Project must match AT LEAST ONE selected type (if any selected)
      const matchesType = selectedTypeIds.length === 0 || 
                          project.tags.some(tagId => selectedTypeIds.includes(tagId));
      
      return matchesSearch && matchesIndustry && matchesType;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending
  }, [projects, searchTerm, selectedIndustryIds, selectedTypeIds]);

  if (loading) {
    return <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-sm text-muted-foreground">Loading works...</div>;
  }

  return (
    <div className="w-full px-4 md:px-6 py-8 animate-in fade-in duration-500">
      
      {/* Controls */}
      <div className="flex flex-col gap-8 mb-12">
        {/* Full Width Search */}
        <div className="w-full relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-8 h-12 text-lg border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Filters Container */}
        <div className="flex flex-col md:flex-row gap-8">
            {/* Industry Filters */}
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

            {/* Type Filters */}
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredProjects.map((project) => (
          <Link key={project.id} to={`/project/${project.id}`} className="group block space-y-3">
            <div className="overflow-hidden bg-muted aspect-[4/3] relative w-full">
              <img 
                src={project.imageUrl} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-medium leading-none group-hover:text-primary/80 transition-colors">{project.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
              </div>
            </div>
          </Link>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No projects found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};