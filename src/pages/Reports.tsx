import { useEffect, useState } from 'react';
import {
  Trophy,
  Building2,
  HardDrive,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  FileText,
  User,
  Clock,
  Folder,
  Database,
  RefreshCw,
  Target,
  ListChecks,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  formatFileSize,
  formatDateTime,
  formatNumber,
  getFileTypeColor,
} from '@/utils/format';
import { getSourceDiskName } from '@/utils/mock';
import { exportDepartmentReports } from '@/utils/export';

export default function Reports() {
  const {
    reports,
    allDuplicates,
    fetchReports,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ranking' | 'checklist'>('ranking');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getDepartmentDuplicates = (department: string) => {
    return allDuplicates.filter(g => g.department === department);
  };

  const getTopDuplicateFiles = (department: string, limit: number = 5) => {
    return getDepartmentDuplicates(department)
      .sort((a, b) => b.saveableSize - a.saveableSize)
      .slice(0, limit);
  };

  const getPriorityLevel = (report: any): 'high' | 'medium' | 'low' => {
    if (report.rank <= 3) return 'high';
    if (report.rank <= 6) return 'medium';
    return 'low';
  };

  const getPriorityBadge = (level: 'high' | 'medium' | 'low') => {
    const config = {
      high: { variant: 'danger' as const, label: '重点整改' },
      medium: { variant: 'warning' as const, label: '关注' },
      low: { variant: 'success' as const, label: '正常' },
    };
    return <Badge variant={config[level].variant}>{config[level].label}</Badge>;
  };

  const handleExportDepartment = (deptName: string) => {
    const deptReport = reports.find(r => r.name === deptName);
    if (deptReport) {
      exportDepartmentReports([deptReport]);
    }
  };

  const handleExportAll = () => {
    exportDepartmentReports(reports);
  };

  const totalDuplicateGroups = reports.reduce((sum, r) => sum + r.duplicateCount, 0);
  const totalDuplicateSize = reports.reduce((sum, r) => sum + r.duplicateSize, 0);
  const totalSaveable = reports.reduce((sum, r) => sum + r.saveableSize, 0);
  const totalPendingRecycle = reports.reduce((sum, r) => sum + r.pendingRecycleCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">统计部门</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                {formatNumber(reports.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">重复文件组数</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                {formatNumber(totalDuplicateGroups)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 text-warning-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">重复占用空间</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                {formatFileSize(totalDuplicateSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 text-success-600 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">可节省空间</p>
              <p className="text-xl font-bold text-success-600 font-mono">
                {formatFileSize(totalSaveable)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {totalPendingRecycle > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <div>
              <p className="font-medium text-warning-800">待处置文件</p>
              <p className="text-sm text-warning-700">
                共有 <strong>{formatNumber(totalPendingRecycle)}</strong> 个文件已移入待回收区，等待二次确认后即可清理释放空间
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">待处理</Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ranking'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('ranking')}
          >
            <Trophy className="w-4 h-4 inline-block mr-1.5" />
            部门排行榜
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'checklist'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('checklist')}
          >
            <ListChecks className="w-4 h-4 inline-block mr-1.5" />
            整改清单
          </button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportAll}
        >
          导出全部报告
        </Button>
      </div>

      {activeTab === 'ranking' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              按重复占用空间从高到低排序，帮助识别重点整改部门
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {reports.map((report) => {
              const isExpanded = expandedDept === report.name;
              const priority = getPriorityLevel(report);
              const topFiles = getTopDuplicateFiles(report.name, 5);

              return (
                <div key={report.id}>
                  <div
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => setExpandedDept(isExpanded ? null : report.name)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        report.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        report.rank === 2 ? 'bg-gray-200 text-gray-700' :
                        report.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {report.rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          {getPriorityBadge(priority)}
                          {report.pendingRecycleCount > 0 && (
                            <Badge variant="warning" size="sm">
                              {report.pendingRecycleCount} 个待处置
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatNumber(report.duplicateCount)} 组重复 · {formatNumber(report.fileCount)} 个文件
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">重复占用</p>
                        <p className="font-mono font-semibold text-gray-900">
                          {formatFileSize(report.duplicateSize)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">可节省</p>
                        <p className="font-mono font-semibold text-success-600">
                          {formatFileSize(report.saveableSize)}
                        </p>
                      </div>

                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>节约率</span>
                          <span>{report.duplicateSize > 0 ? Math.round((report.saveableSize / report.duplicateSize) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-success-500 h-1.5 rounded-full"
                            style={{ width: `${report.duplicateSize > 0 ? (report.saveableSize / report.duplicateSize) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/50 px-4 pb-4">
                      <div className="border-l-2 border-primary-300 pl-4 py-3">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-gray-700">Top 重复文件</span>
                            <span className="text-xs text-gray-500">（按可节省空间排序）</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportDepartment(report.name);
                            }}
                          >
                            导出该部门
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {topFiles.length > 0 ? (
                            topFiles.map((group, idx) => {
                              const keepFile = group.files.find(f => f.id === group.suggestedKeepId);
                              return (
                                <div
                                  key={group.id}
                                  className="bg-white rounded border border-gray-200 p-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-500 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <FileText className={`w-4 h-4 ${getFileTypeColor(keepFile?.fileType || 'pdf')}`} />
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                          {keepFile?.name || '未知文件'}
                                        </span>
                                        <Badge variant="info" size="sm">
                                          <Database className="w-3 h-3 mr-1" />
                                          {getSourceDiskName(group.sourceDisk)}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {keepFile?.path}
                                      </p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Copy className="w-3 h-3" />
                                          {group.fileCount} 个副本
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <HardDrive className="w-3 h-3" />
                                          {formatFileSize(group.saveableSize)} 可节省
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {keepFile?.createdBy}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatDateTime(keepFile?.lastAccessedAt || '')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 py-4 text-center">暂无重复文件</p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            <strong>整改建议：</strong>
                            {priority === 'high' && '该部门重复文件占用空间较大，建议优先安排清理。重点关注大文件（视频、安装包、归档文件），与部门负责人确认后可批量移入待回收区。'}
                            {priority === 'medium' && '该部门有一定数量的重复文件，建议纳入月度清理计划。可先从版本过期、路径冗余的文件开始处理。'}
                            {priority === 'low' && '该部门重复文件占用较少，整体管控良好。建议保持定期巡检，防止重复文件积累。'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              各部门整改清单，按优先级排序，便于下发给各部门自行确认
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部门
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重复组数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重复空间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    可节省空间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    待处置数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    节约率
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => {
                  const priority = getPriorityLevel(report);
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                          report.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          report.rank === 2 ? 'bg-gray-200 text-gray-700' :
                          report.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {report.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getPriorityBadge(priority)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">
                          {formatNumber(report.duplicateCount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">
                          {formatFileSize(report.duplicateSize)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-success-600">
                          {formatFileSize(report.saveableSize)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {report.pendingRecycleCount > 0 ? (
                          <span className="font-mono text-sm text-warning-600">
                            {formatNumber(report.pendingRecycleCount)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-success-500 h-1.5 rounded-full"
                              style={{ width: `${report.duplicateSize > 0 ? (report.saveableSize / report.duplicateSize) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-mono">
                            {report.duplicateSize > 0 ? Math.round((report.saveableSize / report.duplicateSize) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download className="w-3 h-3" />}
                          onClick={() => handleExportDepartment(report.name)}
                        >
                          导出
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">整改工作建议</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• 建议优先处理排名前 3 的重点部门，可快速释放大量空间</li>
              <li>• 建议按来源盘分类处理：归档盘可优先清理，部门盘需与各部门确认</li>
              <li>• 建议建立定期清理机制：每月扫描一次，每季度集中清理一次</li>
              <li>• 建议在公司层面推广文件命名规范和目录结构，从源头减少重复</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
