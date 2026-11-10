import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onSearch,
  placeholder = "Поиск: Figma, гитара, Мария Огнева…",
}: SearchInputProps) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onSearch(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-10 pl-11 text-sm font-medium placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-slate-100 hover:text-ink-900"
          aria-label="Очистить поиск"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
