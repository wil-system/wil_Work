'use client';

import { useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Attachment } from '@/lib/types';

const ATTACH_ICON: Record<Attachment['type'], React.ElementType> = {
  xls: FileSpreadsheet,
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  zip: File,
  other: File,
};

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string };

interface AttachmentViewerProps {
  attachment: Attachment;
  compact?: boolean;
}

async function getSignedUrl(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('signed url not returned');
  }

  return data.signedUrl;
}

function getPreviewLabel(type: Attachment['type']) {
  if (type === 'image') return '이미지 미리보기';
  return '미리보기를 지원하지 않는 파일입니다';
}

export default function AttachmentViewer({ attachment, compact = false }: AttachmentViewerProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const Icon = ATTACH_ICON[attachment.type] ?? File;
  const canPreview = attachment.type === 'image';
  const storagePath = attachment.storagePath;

  const modalTitle = useMemo(() => getPreviewLabel(attachment.type), [attachment.type]);

  async function handleDownload() {
    if (!storagePath) return;

    const signedUrl = await getSignedUrl(storagePath);
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('download failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function loadPreview() {
    if (!storagePath || !canPreview) return;

    setOpen(true);
    setPreview({ status: 'loading' });

    try {
      const signedUrl = await getSignedUrl(storagePath);
      setPreview({ status: 'ready', url: signedUrl });
    } catch {
      setPreview({ status: 'error', message: '첨부파일을 불러오지 못했습니다.' });
    }
  }

  function closePreview() {
    setOpen(false);
    setPreview({ status: 'idle' });
  }

  return (
    <>
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg border text-[11px] ${compact ? 'px-2.5 py-1' : 'px-2.5 py-1.5'}`}
        style={{ background: 'var(--stone-50)', borderColor: 'var(--line)', color: 'var(--stone-600)' }}
      >
        <Icon size={12} style={{ color: 'var(--indigo-500)', flexShrink: 0 }} />
        <span className="font-medium truncate max-w-[140px]">{attachment.name}</span>
        <span style={{ color: 'var(--stone-400)' }}>{attachment.size}</span>
        {canPreview && (
          <button
            type="button"
            onClick={loadPreview}
            disabled={!storagePath}
            className="ml-1 p-0.5 rounded hover:bg-[var(--stone-200)] disabled:opacity-40"
            aria-label={`${attachment.name} 미리보기`}
            title="미리보기"
          >
            <ExternalLink size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!storagePath}
          className="p-0.5 rounded hover:bg-[var(--stone-200)] disabled:opacity-40"
          aria-label={`${attachment.name} 다운로드`}
          title="다운로드"
        >
          <Download size={12} />
        </button>
      </span>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="첨부 미리보기 닫기"
            className="absolute inset-0 cursor-default"
            style={{ background: 'rgba(15,23,42,0.45)' }}
            onClick={closePreview}
          />
          <div className="relative w-full max-w-5xl h-[82vh] rounded-xl border bg-white shadow-xl flex flex-col overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            <div className="h-12 flex items-center justify-between gap-3 px-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[var(--foreground)] truncate">{attachment.name}</div>
                <div className="text-[11px] text-[var(--muted)]">{modalTitle}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 rounded-lg hover:bg-[var(--stone-100)] text-[var(--stone-600)]"
                  aria-label="다운로드"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="p-2 rounded-lg hover:bg-[var(--stone-100)] text-[var(--stone-600)]"
                  aria-label="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-[var(--stone-50)] overflow-auto">
              {preview.status === 'loading' && (
                <div className="h-full flex items-center justify-center text-[12px] text-[var(--muted)]">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  불러오는 중
                </div>
              )}

              {preview.status === 'error' && (
                <div className="h-full flex items-center justify-center text-[12px] text-[var(--danger)]">
                  {preview.message}
                </div>
              )}

              {preview.status === 'ready' && attachment.type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={attachment.name} className="max-w-full max-h-full mx-auto object-contain" />
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
