import { useEffect, useState } from 'react';
import {
  Copy,
  HardDrive,
  Building2,
  TrendingUp,
  FolderTree,
  Briefcase,
  Archive,
  Play,
  Clock,
  User,
  Scan,
  ArrowRight,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileWarning,
  Send,
  ThumbsUp,
  ThumbsDown,
  Database,
  History,
  Search,
  Folder,
  Check,
  StopCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import TrendChart from '@/components/charts/TrendChart';
import DonutChart from '@/components/charts/DonutChart';
import { formatFileSize, formatRelativeTime, formatNumber, formatDateTime } from '@/utils/format';
import { getDiskTypes } from '@/utils/mock';
import type { ActivityType, DiskType, ScanTask } from '@/types';

const activityIcons: Record<ActivityType, any> = {
  scan: Scan,
  move: Trash2,
  approve: CheckCircle2,
  reject: XCircle,
  delete: Trash2,
  send_rectification: Send,
  confirm_rectification: ThumbsUp,
  reject_rectification: ThumbsDown,
};

const activityColors: Record<ActivityType, string> = {
  scan: 'bg-primary-100 text-primary-600',
  move: 'bg-warning-100 text-warning-600',
  approve: 'bg-success-100 text-success-600',
  reject: 'bg-danger-100 text-danger-600',
  delete: 'bg-danger-100 text-danger-600',
  send_rectification: 'bg-info-100 text-info-600',
  confirm_rectification: 'bg-success-100 text-success-600',
  reject_rectification: 'bg-danger-100 text-danger-600',
};

const activityLabels: Record<ActivityType, string> = {
  scan: '扫描',
  move: '移出',
  approve: '通过',
  reject: '驳回',
  delete: '删除',
  send_rectification: '发整改',
  confirm_rectification: '已确认',
  reject_rectification: '已驳回',
};

const scanStatusConfig: Record<ScanTask['status'], { variant: any; label: string; color: string; icon: any }> = {
  running: { variant: 'info' as const, label: '扫描中', color: 'bg-info-500', icon: RefreshCw },
  completed: { variant: 'success' as const, label: '已完成', color: 'bg-success-500', icon: Check },
  failed: { variant: 'danger' as const, label: '失败', color: 'bg-danger-500', icon: AlertCircle },
  stopped: { variant: 'warning' as const, label: '已停止', color: 'bg-warning-500', icon: StopCircle },
};

export default function Overview() {
  const {
    overview,
    activities,
    loading,
    currentScan,
    scanHistory,
    fetchOverview,
    fetchActivities,
    startScan,
  } = useAppStore();

  const [disks] = useState<DiskType[]>(getDiskTypes());

  useEffect(() => {
    fetchOverview();
    fetchActivities();
  }, [fetchOverview, fetchActivities]);

  const handleScan = async (diskId: string) => {
    if (currentScan?.isScanning) return;
    await startScan(diskId);
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="重复文件组"
          value={formatNumber(overview?.totalDuplicateGroups || 0)}
          icon={Copy}
          trend={5.2}
          trendLabel="较上周"
          color="primary"
          delay={0}
        />
        <StatCard
          title="可节省空间"
          value={formatFileSize(overview?.totalSaveableSpace || 0)}
          icon={HardDrive}
          trend={-3.8}
          trendLabel="较上周"
          color="success"
          delay={100}
        />
        <StatCard
          title="涉及部门"
          value={formatNumber(overview?.involvedDepartments || 0)}
          icon={Building2}
          color="warning"
          delay={200}
        />
        <StatCard
          title="最大重复来源"
          value={overview?.topDuplicateSource || '-'}
          icon={TrendingUp}
          color="danger"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <FileWarning className="w-6 h-6 text-warning-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-warning-700">待确认删除文件</p>
              <p className="text-2xl font-bold text-warning-800 font-mono">
                {formatNumber(overview?.pendingRecycleCount || 0)} 个
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-warning-600">涉及空间</p>
              <p className="text-lg font-semibold text-warning-700 font-mono">
                {formatFileSize(overview?.pendingRecycleSize || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-success-50 border border-success-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-success-700">已释放空间</p>
              <p className="text-2xl font-bold text-success-800 font-mono">
                {formatFileSize(overview?.totalFreedSpace || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-success-600">本月累计</p>
              <p className="text-lg font-semibold text-success-700 font-mono">
                {formatNumber(overview?.totalDeletedCount || 0)} 次清理
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">近30天趋势</h3>
            <Badge variant="info" size="sm">实时更新</Badge>
          </div>
          {overview?.trend && <TrendChart data={overview.trend} />}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">部门重复占比</h3>
          {overview?.departmentDistribution && (
            <DonutChart data={overview.departmentDistribution} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">快速扫描</h3>
            <span className="text-sm text-gray-500">选择磁盘类型发起哈希扫描</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {disks.map((disk) => (
              <div
                key={disk.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group"
                onClick={() => handleScan(disk.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    {disk.icon === 'folder-tree' && <FolderTree className="w-5 h-5" />}
                    {disk.icon === 'briefcase' && <Briefcase className="w-5 h-5" />}
                    {disk.icon === 'archive' && <Archive className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{disk.name}</p>
                    <p className="text-xs text-gray-500">{disk.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">已使用</span>
                    <span className="text-gray-700 font-medium">
                      {formatFileSize(disk.usedSize)} / {formatFileSize(disk.totalSize)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${(disk.usedSize / disk.totalSize) * 100}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-4"
                  icon={<Play className="w-4 h-4" />}
                  disabled={currentScan?.isScanning}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScan(disk.id);
                  }}
                >
                  {currentScan?.isScanning && currentScan.diskType === disk.name
                    ? '扫描中...'
                    : '开始扫描'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.slice(0, 10).map((activity, index) => {
              const Icon = activityIcons[activity.type];
              return (
                <div key={activity.id} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activityColors[activity.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" size="sm">
                        {activityLabels[activity.type]}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {activity.operator}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-primary-600" />
            扫描历史记录
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            查看各次扫描任务的执行情况、发现重复情况及新增待处理文件数
          </p>
        </div>
          <Badge variant="info" size="sm">
            共 {scanHistory.length} 条记录
          </Badge>
        </div>

        {scanHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Scan className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无扫描记录</p>
            <p className="text-sm mt-1">选择上方磁盘类型卡片开始扫描后即可查看记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">扫描来源</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">扫描文件数</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">发现重复组数</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">发现重复文件</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">新增待处理</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">开始时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">操作人</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.slice(0, 15).map((task) => {
                  const cfg = scanStatusConfig[task.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded flex items-center justify-center">
                            {task.diskType === 'department' && <FolderTree className="w-4 h-4" />}
                            {task.diskType === 'project' && <Briefcase className="w-4 h-4" />}
                            {task.diskType === 'archive' && <Archive className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{task.diskName}</p>
                            {task.completedAt && (
                              <p className="text-xs text-gray-500">
                                用时 {Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 1000)} 秒
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={cfg.variant} size="sm" className="inline-flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-gray-700">
                          {task.status === 'running'
                            ? `${formatNumber(task.processedFiles)} / ${formatNumber(task.totalFiles)}`
                            : formatNumber(task.totalFiles)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono ${task.foundDuplicateGroups > 0 ? 'text-warning-600 font-semibold' : 'text-gray-700'}`}>
                          {formatNumber(task.foundDuplicateGroups)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-gray-700">
                          {formatNumber(task.foundDuplicateFiles)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono ${task.newPendingFiles > 0 ? 'text-danger-600 font-semibold' : 'text-gray-700'}`}>
                          {formatNumber(task.newPendingFiles)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-600 font-mono">{formatDateTime(task.startedAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {task.operator}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
