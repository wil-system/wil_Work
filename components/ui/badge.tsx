type BadgeVariant = 'indigo' | 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  indigo: 'bg-[#eef2ff] border border-[#c7d2fe] text-[#3730a3]',
  green:  'bg-[#d1fae5] border border-[#6ee7b7] text-[#065f46]',
  yellow: 'bg-[#fef9c3] border border-[#fde68a] text-[#92400e]',
  red:    'bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b]',
  gray:   'bg-[#f5f5f4] border border-[#e7e5e4] text-[#57534e]',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
