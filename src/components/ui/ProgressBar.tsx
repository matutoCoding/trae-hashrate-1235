import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  primary: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{value.toLocaleString()}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
