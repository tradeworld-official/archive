import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Exhibition, ExhibitionCustomField, Tag } from '../types';
import { supabase } from '../supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Plus, Edit2, Trash2, Image as ImageIcon, X, Eye, EyeOff, Globe } from 'lucide-react';

const mapDbToExhibition = (row: any): Exhibition => ({
  id: row.id,
  name: row.name,
  nameEn: row.name_en || undefined,
  description: row.description || undefined,
  logoUrl: row.logo_url || undefined,
  imageUrl: row.image_url || '',
  gallery: row.gallery || [],
  startDate: row.start_date || undefined,
  endDate: row.end_date || undefined,
  venueCountry: row.venue_country || undefined,
  venueCity: row.venue_city || undefined,
  venueName: row.venue_name || undefined,
  tags: row.tags || [],
  customFields: row.custom_fields || [],
  isActive: row.is_active ?? true,
  isPublic: row.is_public ?? false,
  displayOrder: row.display_order ?? 0,
});

const mapExhibitionToDb = (e: Partial<Exhibition>) => ({
  name: e.name,
  name_en: e.nameEn || null,
  description: e.description || null,
  logo_url: e.logoUrl || null,
  image_url: e.imageUrl,
  gallery: e.gallery || [],
  start_date: e.startDate || null,
  end_date: e.endDate || null,
  venue_country: e.venueCountry || null,
  venue_city: e.venueCity || null,
  venue_name: e.venueName || null,
  tags: e.tags || [],
  custom_fields: e.customFields || [],
  is_active: e.isActive ?? true,
  is_public: e.isPublic ?? false,
  display_order: e.displayOrder ?? 0,
});

const createEmptyExhibition = (): Exhibition => ({
  id: '', name: '', imageUrl: '', gallery: [], tags: [],
  customFields: [
    { label: '참가비', value: '' },
    { label: '전년도 바이어 규모', value: '' },
    { label: '출품 가능 품목', value: '' },
    { label: '기본 제공 비품', value: '' },
  ],
  isActive: true, isPublic: false, displayOrder: 0,
});

export const AdminExhibitions: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Exhibition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileMap = useRef<Map<string, File>>(new Map());

  const fetchData = async () => {
    setLoading(true);
    const { data: exhibitionData } = await supabase.from('exhibitions').select('*').order('display_order', { ascending: false }).order('created_at', { ascending: false });
    const { data: tagData } = await supabase.from('tags').select('*');
    setExhibitions((exhibitionData || []).map(mapDbToExhibition));
    setTags(tagData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const uploadImageToSupabase = async (previewUrl: string): Promise<string> => {
    if (!previewUrl || previewUrl.startsWith('http')) return previewUrl;
    const file = fileMap.current.get(previewUrl);
    if (!file) return previewUrl;

    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const filePath = `public/${sanitizedFileName}`; // 난수 제거, 원본 파일명 유지

    const { error } = await supabase.storage.from('exhibition-images').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('exhibition-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'logo' | 'gallery') => {
    if (!editing || !e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);
    const newUrls = files.map((file: File) => {
      const blobUrl = URL.createObjectURL(file);
      fileMap.current.set(blobUrl, file);
      return blobUrl;
    });

    if (target === 'image') setEditing({ ...editing, imageUrl: newUrls[0] });
    else if (target === 'logo') setEditing({ ...editing, logoUrl: newUrls[0] });
    else setEditing({ ...editing, gallery: [...editing.gallery, ...newUrls] });
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.imageUrl) return alert('전시명과 대표 이미지는 필수입니다.');

    try {
      const imageUrl = await uploadImageToSupabase(editing.imageUrl);
      const logoUrl = editing.logoUrl ? await uploadImageToSupabase(editing.logoUrl) : undefined;
      const gallery = await Promise.all(editing.gallery.map(url => uploadImageToSupabase(url)));

      const payload = mapExhibitionToDb({ ...editing, imageUrl, logoUrl, gallery });
      if (editing.id) await supabase.from('exhibitions').update(payload).eq('id', editing.id);
      else await supabase.from('exhibitions').insert(payload);

      fileMap.current.clear();
      setEditing(null);
      await fetchData();
    } catch (err: any) { alert(`저장 실패: ${err.message || err}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 전시를 삭제할까요?')) return;
    await supabase.from('exhibitions').delete().eq('id', id);
    await fetchData();
  };

  const toggleActive = async (ex: Exhibition) => {
    const newActive = !ex.isActive;
    setExhibitions(prev => prev.map(e => (e.id === ex.id ? { ...e, isActive: newActive } : e)));
    await supabase.from('exhibitions').update({ is_active: newActive }).eq('id', ex.id);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exhibitions;
    return exhibitions.filter(e => `${e.name} ${e.nameEn || ''} ${e.venueCity || ''} ${e.venueCountry || ''}`.toLowerCase().includes(q));
  }, [exhibitions, searchQuery]);

  const industryTags = useMemo(() => tags.filter(t => t.category === 'industry'), [tags]);
  const regionTags = useMemo(() => tags.filter(t => t.category === 'exhibition_region'), [tags]);

  const updateField = <K extends keyof Exhibition>(key: K, value: Exhibition[K]) => setEditing({ ...editing!, [key]: value });
  const updateCustomField = (idx: number, patch: Partial<ExhibitionCustomField>) => {
    const next = [...editing!.customFields];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing!, customFields: next });
  };
  const addCustomField = () => setEditing({ ...editing!, customFields: [...editing!.customFields, { label: '', value: '' }] });
  const removeCustomField = (idx: number) => setEditing({ ...editing!, customFields: editing!.customFields.filter((_, i) => i !== idx) });
  const toggleTag = (tagId: string) => setEditing({ ...editing!, tags: editing!.tags.includes(tagId) ? editing!.tags.filter(t => t !== tagId) : [...editing!.tags, tagId] });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin"><Button variant="ghost" size="icon"><ChevronLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5" /> 전시 관리</h1>
              <p className="text-xs text-slate-500 mt-0.5">해외 전시 영업에 사용할 전시 데이터를 관리합니다.</p>
            </div>
          </div>
          <Button onClick={() => setEditing(createEmptyExhibition())}><Plus className="w-4 h-4 mr-2" /> 전시 등록</Button>
        </div>

        <div className="mb-4"><Input placeholder="전시명, 도시, 국가로 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

        {loading ? <div className="text-center py-20 text-slate-500">불러오는 중…</div> : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden">
            {filtered.map(ex => (
              <div key={ex.id} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <img src={ex.imageUrl} alt="" className="w-16 h-16 rounded object-cover bg-slate-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{ex.name}</span>
                    {ex.nameEn && <span className="text-xs text-slate-500">{ex.nameEn}</span>}
                    {!ex.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">비활성</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{[ex.venueCountry, ex.venueCity, ex.startDate && ex.endDate ? `${ex.startDate} ~ ${ex.endDate}` : null].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => toggleActive(ex)}>{ex.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}</Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(ex)}><Edit2 className="w-4 h-4" /></Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(ex.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold">{editing.id ? '전시 수정' : '신규 전시 등록'}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">기본 정보</h3>
                <div><label className="text-xs font-medium mb-1 block">전시명 (한글) *</label><Input value={editing.name} onChange={e => updateField('name', e.target.value)} /></div>
                <div><label className="text-xs font-medium mb-1 block">전시명 (영문)</label><Input value={editing.nameEn || ''} onChange={e => updateField('nameEn', e.target.value)} /></div>
                <div><label className="text-xs font-medium mb-1 block">설명 메모</label><textarea value={editing.description || ''} onChange={e => updateField('description', e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md bg-transparent" /></div>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">시각 자산</h3>
                <div>
                  <label className="text-xs font-medium mb-1 block">대표 이미지 *</label>
                  {editing.imageUrl ? (
                    <div className="relative inline-block"><img src={editing.imageUrl} className="w-32 h-32 object-cover rounded border" /><button type="button" onClick={() => updateField('imageUrl', '')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>
                  ) : (
                    <label className="inline-flex items-center justify-center w-32 h-32 border-2 border-dashed rounded cursor-pointer hover:bg-slate-50 transition"><ImageIcon className="w-6 h-6 text-slate-400" /><input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} /></label>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">전시 로고</label>
                  {editing.logoUrl ? (
                     <div className="relative inline-block"><img src={editing.logoUrl} className="w-24 h-24 object-contain rounded border bg-slate-50" /><button type="button" onClick={() => updateField('logoUrl', undefined)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>
                  ) : (
                     <label className="inline-flex items-center justify-center w-24 h-24 border-2 border-dashed rounded cursor-pointer hover:bg-slate-50 transition"><ImageIcon className="w-5 h-5 text-slate-400" /><input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'logo')} /></label>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">추가 사진 (전시 현장 사진)</label>
                  <div className="flex flex-wrap gap-2">
                    {editing.gallery.map((url, idx) => (
                      <div key={idx} className="relative"><img src={url} className="w-20 h-20 object-cover rounded border" /><button type="button" onClick={() => setEditing({ ...editing, gallery: editing.gallery.filter((_, i) => i !== idx) })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>
                    ))}
                    <label className="inline-flex items-center justify-center w-20 h-20 border-2 border-dashed rounded cursor-pointer hover:bg-slate-50 transition"><Plus className="w-5 h-5 text-slate-400" /><input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'gallery')} /></label>
                  </div>
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">일정 · 장소</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium mb-1 block">시작일</label><Input type="date" value={editing.startDate || ''} onChange={e => updateField('startDate', e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block">종료일</label><Input type="date" value={editing.endDate || ''} onChange={e => updateField('endDate', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium mb-1 block">국가</label><Input value={editing.venueCountry || ''} onChange={e => updateField('venueCountry', e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block">도시</label><Input value={editing.venueCity || ''} onChange={e => updateField('venueCity', e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block">베뉴</label><Input value={editing.venueName || ''} onChange={e => updateField('venueName', e.target.value)} /></div>
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">태그</h3>
                {regionTags.length > 0 && <div><label className="text-xs font-medium mb-1 block text-slate-500">권역</label><div className="flex flex-wrap gap-1.5">{regionTags.map(t => <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`text-xs px-2.5 py-1 rounded-full border ${editing.tags.includes(t.id) ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-600 hover:border-slate-500'}`}>{t.name}</button>)}</div></div>}
                {industryTags.length > 0 && <div><label className="text-xs font-medium mb-1 block text-slate-500">산업군</label><div className="flex flex-wrap gap-1.5">{industryTags.map(t => <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`text-xs px-2.5 py-1 rounded-full border ${editing.tags.includes(t.id) ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-600 hover:border-slate-500'}`}>{t.name}</button>)}</div></div>}
              </section>
              <section className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">상세 정보 (자유 편집)</h3><Button variant="outline" size="sm" onClick={addCustomField}><Plus className="w-3 h-3 mr-1" /> 항목 추가</Button></div>
                <div className="space-y-2">
                  {editing.customFields.map((cf, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Input value={cf.label} onChange={e => updateCustomField(idx, { label: e.target.value })} placeholder="라벨" className="w-32 flex-shrink-0" />
                      <textarea value={cf.value} onChange={e => updateCustomField(idx, { value: e.target.value })} placeholder="값" rows={1} className="flex-1 text-sm px-3 py-2 border rounded-md bg-transparent min-h-[36px]" />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(idx)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setEditing(null)}>취소</Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
