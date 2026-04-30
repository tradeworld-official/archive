// components/email/ExhibitionPickerModal.tsx
// 전시 카드 클릭 시 뜨는 전시 선택 모달
// 검색 + 권역/산업 필터 + 카드 클릭으로 선택

import React, { useEffect, useMemo, useState } from 'react';
import { Exhibition, Tag } from '../../types';
import { Input } from '../ui/Input';
import { Search, X, Globe } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exhibition: Exhibition) => void;
  exhibitions: Exhibition[];
  tags: Tag[];
  alreadySelectedIds?: string[];
}

export const ExhibitionPickerModal: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  exhibitions,
  tags,
  alreadySelectedIds = [],
}) => {
  const [query, setQuery] = useState('');
  const [filterIds, setFilterIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setFilterIds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const regionTags = useMemo(
    () => tags.filter((t) => t.category === 'exhibition_region'),
    [tags]
  );
  const industryTags = useMemo(
    () => tags.filter((t) => t.category === 'industry'),
    [tags]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exhibitions
      .filter((e) => e.isActive)
      .filter((e) => {
        if (q) {
          const hay = `${e.name} ${e.nameEn || ''} ${e.venueCountry || ''} ${
            e.venueCity || ''
          }`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filterIds.length > 0) {
          const hasAll = filterIds.every((t) => e.tags.includes(t));
          if (!hasAll) return false;
        }
        return true;
      });
  }, [exhibitions, query, filterIds]);

  if (!open) return null;

  const toggleFilter = (id: string) => {
    setFilterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4" /> 전시 선택
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              메일 카드에 넣을 전시를 클릭하세요. (활성 상태인 전시만 표시)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="전시명, 국가, 도시로 검색"
              className="pl-9"
              autoFocus
            />
          </div>

          {regionTags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                권역
              </div>
              <div className="flex flex-wrap gap-1.5">
                {regionTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleFilter(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      filterIds.includes(t.id)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-transparent border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {industryTags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                산업군
              </div>
              <div className="flex flex-wrap gap-1.5">
                {industryTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleFilter(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      filterIds.includes(t.id)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-transparent border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
            결과 {filtered.length}개
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">
              {exhibitions.length === 0
                ? '등록된 전시가 없습니다. 관리자 → 전시 관리에서 먼저 등록해주세요.'
                : '조건에 맞는 전시가 없습니다.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((ex) => {
                const isUsed = alreadySelectedIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      onSelect(ex);
                      onClose();
                    }}
                    className={`group text-left rounded-lg border overflow-hidden transition ${
                      isUsed
                        ? 'opacity-50 hover:opacity-75'
                        : 'hover:border-slate-900 hover:shadow-md'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      {isUsed && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-black/60 rounded">
                            이미 추가됨
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-semibold truncate">
                        {ex.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {[ex.venueCountry, ex.venueCity].filter(Boolean).join(' · ')}
                        {ex.startDate && ` · ${ex.startDate}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
