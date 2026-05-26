'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('tags')
        .select('nome')
        .ilike('nome', `%${input}%`)
        .limit(5);

      if (data) {
        setSuggestions(data.map((t: any) => t.nome).filter((t: string) => !selectedTags.includes(t)));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, selectedTags]);

  function addTag(tag: string) {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !selectedTags.includes(normalized) && selectedTags.length < 10) {
      onChange([...selectedTags, normalized]);
    }
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(selectedTags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === 'Backspace' && !input && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[42px]">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={selectedTags.length === 0 ? 'Digite e pressione Enter...' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
        />
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              #{s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-text-secondary mt-1">
        {selectedTags.length}/10 tags • Pressione Enter ou vírgula para adicionar
      </p>
    </div>
  );
}
