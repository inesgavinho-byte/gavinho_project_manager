import React from 'react';

interface EmailSearchHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

/**
 * Componente que destaca o termo de busca no texto
 */
export function EmailSearchHighlight({
  text,
  searchTerm,
  className = '',
}: EmailSearchHighlightProps) {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  // Dividir o texto pelo termo de busca (case-insensitive)
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 font-semibold text-gray-900 px-1 rounded"
            >
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Componente que extrai e exibe contexto ao redor do termo encontrado
 */
export function EmailSearchContext({
  text,
  searchTerm,
  contextLength = 50,
  className = '',
}: EmailSearchHighlightProps & { contextLength?: number }) {
  if (!searchTerm || !text) {
    return <span className={className}>{text.substring(0, contextLength * 2)}...</span>;
  }

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) {
    return <span className={className}>{text.substring(0, contextLength * 2)}...</span>;
  }

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);

  let context = text.substring(start, end);
  const hasStart = start > 0;
  const hasEnd = end < text.length;

  if (hasStart) context = '...' + context;
  if (hasEnd) context = context + '...';

  return (
    <span className={className}>
      {context.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, index) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 font-semibold text-gray-900 px-1 rounded"
            >
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Componente que exibe sugestões com destaque
 */
export function SearchSuggestionItem({
  suggestion: { email, subject, date, status },
  searchTerm,
  onClick,
}: {
  suggestion: {
    email: string;
    subject: string;
    date: string;
    status: string;
  };
  searchTerm: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <EmailSearchHighlight
          text={email}
          searchTerm={searchTerm}
          className="text-sm font-semibold text-gray-900"
        />
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {status}
        </span>
      </div>
      <EmailSearchContext
        text={subject}
        searchTerm={searchTerm}
        contextLength={40}
        className="text-xs text-gray-600 block"
      />
      <p className="text-xs text-gray-500 mt-1">{date}</p>
    </button>
  );
}

/**
 * Badge que mostra número de resultados encontrados
 */
export function SearchResultsBadge({
  count,
  searchTerm,
  className = '',
}: {
  count: number;
  searchTerm: string;
  className?: string;
}) {
  if (count === 0) {
    return (
      <span className={`text-sm text-gray-600 ${className}`}>
        Nenhum resultado para "{searchTerm}"
      </span>
    );
  }

  return (
    <span className={`text-sm font-semibold text-blue-600 ${className}`}>
      {count} resultado{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''} para "
      <EmailSearchHighlight text={searchTerm} searchTerm={searchTerm} />
      "
    </span>
  );
}
