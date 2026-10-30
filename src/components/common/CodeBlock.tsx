import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  isDiff?: boolean;
  type?: 'original' | 'suggested' | 'neutral';
  onCopySuccess?: () => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'html',
  title,
  type = 'neutral',
  onCopySuccess
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.trim().split('\n');

  const borderTypeColor = {
    original: 'border-[#F8E9ED] bg-[#FFF5F6]/40',
    suggested: 'border-[#EEF0E3] bg-[#F6F7F0]/40',
    neutral: 'border-[#EAEAE4] bg-[#FAFAF8]'
  }[type];

  const headerColor = {
    original: 'text-[#A84F65] bg-[#FFF5F6] border-b border-[#F8E9ED]',
    suggested: 'text-[#62683F] bg-[#F6F7F0] border-b border-[#EEF0E3]',
    neutral: 'text-[#70716B] bg-[#F8F8F5] border-b border-[#EAEAE4]'
  }[type];

  return (
    <div className={`rounded-xl border overflow-hidden font-mono text-xs ${borderTypeColor}`}>
      {/* Header bar */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 ${headerColor}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAE4]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAE4]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAE4]"></span>
          {title && <span className="ml-1.5 font-sans font-bold tracking-wide text-xs">{title}</span>}
          <span className="text-[10px] text-[#999A92] uppercase tracking-wider ml-1 font-mono">({language})</span>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#EAEAE4] hover:border-[#C96F82] text-[#70716B] hover:text-[#A84F65] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C96F82] text-[11px] font-sans font-medium shadow-sm"
          title="Copy snippet to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#648568]" />
              <span className="text-[#648568] font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#70716B]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto max-h-72 bg-white">
        <table className="w-full text-left border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const isAdded = line.trim().startsWith('+');
              const isRemoved = line.trim().startsWith('-');

              return (
                <tr
                  key={idx}
                  className={`leading-relaxed font-mono ${
                    isAdded
                      ? 'bg-[#F6F7F0] text-[#62683F] font-medium'
                      : isRemoved
                      ? 'bg-[#FFF5F6] text-[#A84F65] font-medium'
                      : 'text-[#292A27]'
                  }`}
                >
                  <td className="w-8 pr-3 text-right select-none text-[#999A92] font-mono text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-[12px] pl-2 break-all">
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
