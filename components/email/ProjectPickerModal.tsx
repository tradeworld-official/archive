// components/email/ProjectPickerModal.tsx
// 빈 카드 클릭 시 뜨는 프로젝트 선택 모달
// 검색 + 카테고리/산업군 필터 + 카드 클릭으로 선택

import React, { useEffect, useMemo, useState } from 'react';
import { Project, Tag } from '../../types';
import { Input } from '../ui/Input';
import { Search, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (project: Project) => void;
  projects: Project[];
  tags: Tag[];
  // 이미 다른 카드에 선택된 프로젝트 ID들 (중복 방지 표시)
  alreadySelectedIds?: string[];
}

export const ProjectPickerModal: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  projects,
  tags,
  alreadySelectedIds = [],
}) => {
  const [query, setQuery] = useState('');
  const [filterIds, setFilterIds] = useState<string[]>([]);

  // 모달 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setQuery('');
      setFilterIds([]);
    }
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const typeTags = useMemo(() => tags.filter((t) => t.category === 'type'), [tags]);
  const industryTags = useMemo(
    () => tags.filter((t) => t.category === 'industry'),
    [tags]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.client}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterIds.length > 0) {
        const hasAll = filterIds.every((t) => p.tags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [projects, query, filterIds]);

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
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-base font-bold">프로젝트 선택</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              메일 카드에 넣을 프로젝트를 클릭하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 검색 + 필터 */}
        <div className="p-4 border-b space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="프로젝트명 또는 클라이언트로 검색"
              className="pl-9"
              autoFocus
            />
          </div>

          {typeTags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                작업 유형
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typeTags.map((t) => (
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

        {/* 프로젝트 그리드 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
            결과 {filtered.length}개
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">
              조건에 맞는 프로젝트가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const isUsed = alreadySelectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(p);
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
                        src={p.imageUrl}
                        alt={p.title}
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
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {p.client}
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
