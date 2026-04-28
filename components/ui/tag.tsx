interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f4] text-[#57534e] border border-[#e7e5e4] ${className}`}>
      {children}
    </span>
  );
}
