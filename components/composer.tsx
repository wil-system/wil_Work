'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { File, FileSpreadsheet, FileText, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { createClient } from '@/lib/supabase/client';
import type { Attachment } from '@/lib/types';

interface ComposerProps {
  boardId: string;
  authorId: string;
  authorInitial?: string;
  authorColor?: string;
}

const ATTACH_ICON: Record<Attachment['type'], React.ElementType> = {
  xls: FileSpreadsheet,
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  zip: File,
  other: File,
};

function detectType(file: File): Attachment['type'] {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx'].includes(ext)) return 'xls';
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
  return 'other';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function storageSafeFileName(fileName: string) {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
  const base = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
  const safeBase = base
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${safeBase || 'attachment'}${ext}`;
}

function PendingFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const Icon = ATTACH_ICON[detectType(file)];

  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-[11px] bg-[var(--indigo-50)] border-[var(--indigo-200)] text-[var(--indigo-700)]">
      <Icon size={12} />
      <span className="font-medium max-w-[120px] truncate">{file.name}</span>
      <span className="text-[var(--indigo-400)]">{formatSize(file.size)}</span>
      <button type="button" onClick={onRemove} className="ml-0.5 p-0.5 rounded hover:bg-[var(--indigo-100)] transition-colors" aria-label={`${file.name} 첨부 제거`}>
        <X size={11} />
      </button>
    </span>
  );
}

export default function Composer({ boardId, authorId, authorInitial = '?', authorColor = '#1e1b4b' }: ComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && pendingFiles.length === 0) return;
    setSubmitting(true);
    setError('');
    let createdPostId: string | null = null;
    const uploadedPaths: string[] = [];
    const supabase = createClient();

    try {
      const { data: postData, error: postError } = await supabase.from('work_posts').insert({
        board_id: boardId,
        author_id: authorId,
        content: content.trim() || '(첨부파일)',
      }).select('id').single();

      if (postError || !postData?.id) throw postError ?? new Error('게시글 저장에 실패했습니다.');
      createdPostId = postData.id as string;

      for (const file of pendingFiles) {
        const storagePath = `${postData.id}/${crypto.randomUUID()}-${storageSafeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(storagePath, file, {
            contentType: file.type || undefined,
          });

        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);

        const { error: attachmentError } = await supabase.from('work_attachments').insert({
          post_id: postData.id,
          name: file.name,
          size: formatSize(file.size),
          type: detectType(file),
          storage_path: storagePath,
        });

        if (attachmentError) throw attachmentError;
      }

      setContent('');
      setPendingFiles([]);
      router.refresh();
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('attachments').remove(uploadedPaths);
      }
      if (createdPostId) {
        await supabase.from('work_posts').delete().eq('id', createdPostId);
      }
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`게시글 저장 중 오류가 발생했습니다. ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <Avatar initial={authorInitial} color={authorColor} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="팀에 공유할 내용을 작성하세요..."
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingFiles.map((file, index) => (
                  <PendingFileChip
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                  />
                ))}
              </div>
            )}
            {error && (
              <p className="mt-2 text-[11px] text-[var(--danger)]">{error}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--stone-100)] transition-colors"
              >
                <Paperclip size={13} /> 파일 첨부
              </button>
              <button
                type="submit"
                disabled={(!content.trim() && pendingFiles.length === 0) || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--indigo-600)' }}
              >
                <Send size={13} /> {submitting ? '게시 중...' : '게시'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
          </div>
        </div>
      </form>
    </div>
  );
}
