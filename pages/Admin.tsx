import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Project, Tag } from '../types';
import { mockSupabase } from '../services/mockSupabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trash2, Plus, Edit2, X, Upload, Star, GripVertical, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';

// Simple UUID polyfill
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Custom Date Picker Component ---
const MonthYearPicker: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Parse initial value or default to now
  const initialDate = value ? new Date(value + '-01') : new Date();
  const [year, setYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    onChange(`${year}-${monthStr}`);
    setIsOpen(false);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="relative" ref={wrapperRef}>
      <Button 
        type="button" 
        variant="outline" 
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? value.replace('-', '. ') : "Select Date"}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 w-64 p-3 bg-popover border border-border rounded-md shadow-md animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setYear(year - 1)} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">{year}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => setYear(year + 1)} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {months.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMonthSelect(idx)}
                className={`text-xs p-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors
                  ${value === `${year}-${(idx + 1).toString().padStart(2, '0')}` ? 'bg-primary text-primary-foreground' : ''}
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Admin: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'tags'>('projects');
  
  // Filtering State
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});
  const [editingTag, setEditingTag] = useState<Partial<Tag>>({});
  
  // Custom State for Image Editing
  const [editorImages, setEditorImages] = useState<string[]>([]);
  const [editorMainImage, setEditorMainImage] = useState<string>('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [p, t] = await Promise.all([
      mockSupabase.data.getProjects(),
      mockSupabase.data.getTags()
    ]);
    // Sort projects by date descending (newest first)
    setProjects(p.sort((a, b) => b.date.localeCompare(a.date)));
    setTags(t);
    setLoading(false);
  };

  const industryTags = useMemo(() => tags.filter(t => t.category === 'industry'), [tags]);
  const typeTags = useMemo(() => tags.filter(t => t.category === 'type'), [tags]);

  // Filtering Logic
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
  const clearFilters = () => {
      setSelectedIndustryIds([]);
      setSelectedTypeIds([]);
  }
  const clearIndustries = () => setSelectedIndustryIds([]);
  const clearTypes = () => setSelectedTypeIds([]);

  const filteredProjects = useMemo(() => {
      if (selectedIndustryIds.length === 0 && selectedTypeIds.length === 0) return projects;
      
      return projects.filter(project => {
        const matchesIndustry = selectedIndustryIds.length === 0 || 
                                project.tags.some(tagId => selectedIndustryIds.includes(tagId));
        
        const matchesType = selectedTypeIds.length === 0 || 
                            project.tags.some(tagId => selectedTypeIds.includes(tagId));
        
        return matchesIndustry && matchesType;
      });
  }, [projects, selectedIndustryIds, selectedTypeIds]);


  const startEditProject = (project: Project) => {
    setEditingProject(project);
    // Merge main image and gallery for editing
    const images = [project.imageUrl, ...project.gallery].filter(Boolean);
    setEditorImages(images);
    setEditorMainImage(project.imageUrl);
    setIsEditing(true);
  };

  const startNewProject = () => {
    setEditingProject({
        date: new Date().toISOString().slice(0, 7) // Default YYYY-MM
    });
    setEditorImages([]);
    setEditorMainImage('');
    setIsEditing(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setEditorImages(prev => {
             // If first image, make it main automatically
             if (prev.length === 0) setEditorMainImage(result);
             return [...prev, result];
          });
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const copyListItems = [...editorImages];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setEditorImages(copyListItems);
  };

  const removeImage = (idx: number) => {
    const imgToRemove = editorImages[idx];
    const newImages = editorImages.filter((_, i) => i !== idx);
    setEditorImages(newImages);
    
    // If we removed the main image, reset main image to the first available or empty
    if (imgToRemove === editorMainImage) {
        setEditorMainImage(newImages[0] || '');
    }
  };

  const setMainImage = (img: string) => {
    setEditorMainImage(img);
  };

  const handleSaveProject = async () => {
    if (!editingProject.title || !editingProject.client) {
        alert("Title and Client are required");
        return;
    }
    
    if (editorImages.length === 0) {
        alert("Please upload at least one image");
        return;
    }
    
    // Ensure we have a main image selected, otherwise default to first
    const mainImg = editorMainImage || editorImages[0];
    const galleryImgs = editorImages.filter(img => img !== mainImg);

    const newProject: Project = {
      id: editingProject.id || generateId(),
      title: editingProject.title,
      client: editingProject.client,
      description: editingProject.description || '',
      date: editingProject.date || new Date().toISOString().slice(0, 7),
      tags: editingProject.tags || [],
      imageUrl: mainImg,
      gallery: galleryImgs,
      featured: editingProject.featured || false
    };

    await mockSupabase.data.saveProject(newProject);
    setIsEditing(false);
    setEditingProject({});
    fetchData();
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await mockSupabase.data.deleteProject(id);
      fetchData();
    }
  };

  // Tags Logic
  const handleSaveTag = async () => {
      if(!editingTag.name) return;
      const newTag: Tag = {
          id: editingTag.id || generateId(),
          name: editingTag.name,
          category: editingTag.category || 'type'
      };
      await mockSupabase.data.saveTag(newTag);
      setIsEditing(false);
      setEditingTag({});
      fetchData();
  };
  
  const handleDeleteTag = async (id: string) => {
      if(window.confirm('Delete this tag?')) {
          await mockSupabase.data.deleteTag(id);
          fetchData();
      }
  }

  const toggleProjectTag = (tagId: string) => {
      const currentTags = editingProject.tags || [];
      const newTags = currentTags.includes(tagId) 
        ? currentTags.filter(t => t !== tagId)
        : [...currentTags, tagId];
      setEditingProject({...editingProject, tags: newTags});
  }

  if (loading && !isEditing) return <div className="p-8">Loading admin...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex bg-muted p-1 rounded-md">
          <button 
            type="button"
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'projects' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => { setActiveTab('projects'); setIsEditing(false); }}
          >
            Projects
          </button>
          <button 
            type="button"
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'tags' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => { setActiveTab('tags'); setIsEditing(false); }}
          >
            Tags
          </button>
        </div>
      </div>

      {/* Editing Modal/Overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{activeTab === 'projects' ? (editingProject.id ? 'Edit Project' : 'New Project') : (editingTag.id ? 'Edit Tag' : 'New Tag')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><X className="w-5 h-5"/></Button>
            </div>

            {activeTab === 'projects' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Title</label>
                       <Input value={editingProject.title || ''} onChange={e => setEditingProject({...editingProject, title: e.target.value})} />
                   </div>
                   <div>
                       <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Client</label>
                       <Input value={editingProject.client || ''} onChange={e => setEditingProject({...editingProject, client: e.target.value})} />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Date</label>
                        <MonthYearPicker 
                            value={editingProject.date || ''}
                            onChange={(val) => setEditingProject({...editingProject, date: val})}
                        />
                     </div>
                </div>

                <div>
                     <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Description</label>
                     <textarea 
                        className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={editingProject.description || ''} 
                        onChange={e => setEditingProject({...editingProject, description: e.target.value})} 
                     />
                </div>

                {/* Tag Selection Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Industry</label>
                        <div className="flex flex-wrap gap-2">
                            {industryTags.map(tag => (
                                <button 
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleProjectTag(tag.id)}
                                    className={`text-xs px-3 py-1 border rounded-full transition-colors 
                                    ${editingProject.tags?.includes(tag.id) 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Work Type</label>
                         <div className="flex flex-wrap gap-2">
                            {typeTags.map(tag => (
                                <button 
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleProjectTag(tag.id)}
                                    className={`text-xs px-3 py-1 border rounded-full transition-colors 
                                    ${editingProject.tags?.includes(tag.id) 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Image Management */}
                <div>
                     <label className="text-sm font-medium mb-2 block text-muted-foreground">Project Images</label>
                     
                     <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative mb-4">
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                        />
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Drag & Drop images here or click to upload</p>
                     </div>

                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {editorImages.map((img, idx) => (
                            <div 
                                key={idx} 
                                className={`relative aspect-square group rounded-md overflow-hidden border-2 
                                ${img === editorMainImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragEnter={(e) => handleDragEnter(e, idx)}
                                onDragEnd={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover bg-muted" />
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(idx)}
                                            className="text-white hover:text-red-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <GripVertical className="text-white/70 w-4 h-4 cursor-move" />
                                        <button 
                                            type="button" 
                                            onClick={() => setMainImage(img)}
                                            className={img === editorMainImage ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}
                                            title="Set as Main Image"
                                        >
                                            <Star className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="pt-6 flex justify-end gap-2 border-t border-border mt-6">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProject}>Save Project</Button>
                </div>
              </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Tag Name</label>
                        <Input value={editingTag.name || ''} onChange={e => setEditingTag({...editingTag, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Category</label>
                        <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={editingTag.category || 'type'} 
                            onChange={e => setEditingTag({...editingTag, category: e.target.value as any})}
                        >
                            <option value="industry">Industry</option>
                            <option value="type">Work Type</option>
                        </select>
                    </div>
                     <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveTag}>Save Tag</Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'projects' ? (
          <div className="space-y-6">
              
              {/* Action Bar & Filters */}
              <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <Button onClick={startNewProject}><Plus className="w-4 h-4 mr-2"/> Add Project</Button>
                    {(selectedIndustryIds.length > 0 || selectedTypeIds.length > 0) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                            Clear Filters <X className="w-3 h-3 ml-1"/>
                        </Button>
                    )}
                  </div>

                   <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground w-16">Industry</span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={clearIndustries}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                                    ${selectedIndustryIds.length === 0 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                >
                                    All
                                </button>
                                {industryTags.map(tag => (
                                    <button 
                                        key={tag.id}
                                        onClick={() => toggleIndustry(tag.id)}
                                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                                        ${selectedIndustryIds.includes(tag.id) 
                                            ? 'bg-foreground text-background border-foreground' 
                                            : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-muted-foreground w-16">Work Type</span>
                             <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={clearTypes}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                                    ${selectedTypeIds.length === 0 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                >
                                    All
                                </button>
                                {typeTags.map(tag => (
                                    <button 
                                        key={tag.id}
                                        onClick={() => toggleType(tag.id)}
                                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                                        ${selectedTypeIds.includes(tag.id) 
                                            ? 'bg-foreground text-background border-foreground' 
                                            : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'}`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                   </div>
              </div>

              <div className="rounded-md border bg-card">
                  {filteredProjects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <img src={project.imageUrl} alt="" className="w-12 h-12 rounded object-cover bg-muted" />
                              <div>
                                  <div className="font-medium">{project.title}</div>
                                  <div className="text-xs text-muted-foreground">{project.client} ({project.date})</div>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => startEditProject(project)}>
                                  <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteProject(project.id)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                  ))}
                  {filteredProjects.length === 0 && <div className="p-8 text-center text-muted-foreground">No projects match the selected filters.</div>}
              </div>
          </div>
      ) : (
           <div className="space-y-4">
              <Button onClick={() => { setEditingTag({}); setIsEditing(true); }}><Plus className="w-4 h-4 mr-2"/> Add Tag</Button>
              <div className="rounded-md border">
                  {tags.map(tag => (
                      <div key={tag.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div>
                                  <div className="font-medium">{tag.name}</div>
                                  <div className="text-xs text-muted-foreground uppercase">{tag.category}</div>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingTag(tag); setIsEditing(true); }}>
                                  <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};