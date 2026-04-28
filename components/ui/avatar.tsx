interface AvatarProps {
  initial: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-10 h-10 text-[13px]',
};

export function Avatar({ initial, color = '#1e1b4b', size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      style={{ background: color }}
    >
      {initial}
    </div>
  );
}
