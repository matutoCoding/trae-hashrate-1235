import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const colorStyles = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-success-50 text-success-600 border-success-100',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
};

const iconColorStyles = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-6 transition-all duration-300',
        'hover:shadow-md hover:-translate-y-0.5 animate-fade-in',
        colorStyles[color]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 font-mono">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-600" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-success-600' : 'text-danger-600'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-500 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            iconColorStyles[color]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
