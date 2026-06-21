import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyTrend } from '@/types';
import { formatFileSize } from '@/utils/format';

interface TrendChartProps {
  data: DailyTrend[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    saveableSpaceGB: item.saveableSpace / (1024 * 1024 * 1024),
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.name === 'duplicateGroups' ? '重复文件组' : '可节省空间'}:
              </span>
              <span className="font-medium text-gray-900">
                {entry.name === 'duplicateGroups'
                  ? entry.value.toLocaleString() + ' 组'
                  : entry.value.toFixed(1) + ' GB'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => value + ' GB'}
          />
          <Tooltip content={customTooltip} />
          <Legend
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-gray-600">
                {value === 'duplicateGroups' ? '重复文件组' : '可节省空间 (GB)'}
              </span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="duplicateGroups"
            name="duplicateGroups"
            stroke="#1e3a5f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#1e3a5f' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="saveableSpaceGB"
            name="saveableSpace"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
