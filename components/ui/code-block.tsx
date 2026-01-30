import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'typescript', className }: CodeBlockProps) {
  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 font-mono">{language}</span>
      </div>
      <pre className="bg-gray-900 p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-100 leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}
