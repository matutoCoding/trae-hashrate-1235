import { useEffect, useState } from 'react';
import {
  Trophy,
  Building2,
  HardDrive,
  Copy,
  Download,
  RefreshCw,
  TrendingUp,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  formatFileSize,
  formatNumber,
} from '@/utils/format';
import { exportDepartmentReports, exportDuplicateGroups } from '@/utils/export';

const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
const rankBgColors = ['bg-yellow-100', 'bg-gray-100', 'bg-amber-100'];
const rankLabels = ['第一名', '第二名', '第三名'];

export default function Reports() {
  const { reports, duplicates, loading, fetchReports, fetchDuplicates } = useAppStore();
  const [activeTab, setActiveTab] = useState<'ranking' | 'rectification'>('ranking');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchDuplicates();
  }, [fetchReports, fetchDuplicates]);

  const totalDuplicateSize = reports.reduce((sum, r) => sum + r.duplicateSize, 0);
  const totalSaveableSize = reports.reduce((sum, r) => sum + r.saveableSize, 0);

  const getDepartmentDuplicates = (deptName: string) => {
    return duplicates.filter(d => d.department === deptName);
  };

  const selectedDeptDuplicates = selectedDepartment
    ? getDepartmentDuplicates(selectedDepartment)
    : [];

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning-100 text-warning-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">统计部门</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {formatNumber(reports.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">重复文件组数</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {formatNumber(reports.reduce((sum, r) => sum + r.duplicateCount, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-danger-100 text-danger-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">重复占用空间</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {formatFileSize(totalDuplicateSize)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success-100 text-success-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">可节省空间</p>
              <p className="text-2xl font-bold text-success-600 font-mono">
                {formatFileSize(totalSaveableSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'ranking'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              部门排行榜
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rectification')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'rectification'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              整改清单
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'ranking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  按重复占用空间从高到低排序，帮助识别重点整改部门
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => exportDepartmentReports(reports)}
                >
                  导出排行榜
                </Button>
              </div>

              <div className="space-y-3">
                {reports.map((report, index) => {
                  const isTop3 = index < 3;
                  const percentage = (report.duplicateSize / totalDuplicateSize) * 100;

                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                        selectedDepartment === report.name
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDepartment(selectedDepartment === report.name ? null : report.name)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isTop3 ? rankBgColors[index] : 'bg-gray-100'
                          } ${isTop3 ? rankColors[index] : 'text-gray-500'}`}
                        >
                          {isTop3 ? <Trophy className="w-5 h-5" /> : report.rank}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {report.name}
                            </span>
                            {isTop3 && (
                              <Badge variant="warning" size="sm">
                                {rankLabels[index]}
                              </Badge>
                            )}
                            {report.duplicateCount > 100 && (
                              <Badge variant="danger" size="sm">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                重点整改
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2">
                            <ProgressBar
                              value={percentage}
                              color={index === 0 ? 'danger' : index === 1 ? 'warning' : 'primary'}
                              showLabel
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 text-right">
                          <div>
                            <p className="text-xs text-gray-500">重复组数</p>
                            <p className="font-mono font-semibold text-gray-900">
                              {formatNumber(report.duplicateCount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">重复空间</p>
                            <p className="font-mono font-semibold text-danger-600">
                              {formatFileSize(report.duplicateSize)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">可节省</p>
                            <p className="font-mono font-semibold text-success-600">
                              {formatFileSize(report.saveableSize)}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            selectedDepartment === report.name ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      {selectedDepartment === report.name && selectedDeptDuplicates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">该部门重复文件详情</h4>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Download className="w-4 h-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                exportDuplicateGroups(selectedDeptDuplicates, `${report.name}-重复文件清单`);
                              }}
                            >
                              导出该部门清单
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">哈希值</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">文件名</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">文件数</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">可节省空间</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedDeptDuplicates.slice(0, 5).map(group => (
                                  <tr key={group.id} className="border-b border-gray-100 last:border-0">
                                    <td className="px-3 py-2">
                                      <code className="text-xs text-gray-600 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                        {group.hash.slice(0, 8)}...
                                      </code>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 truncate max-w-xs">
                                      {group.files.find(f => f.id === group.suggestedKeepId)?.name}
                                    </td>
                                    <td className="px-3 py-2 font-mono text-gray-900">
                                      {group.fileCount}
                                    </td>
                                    <td className="px-3 py-2 font-mono text-success-600">
                                      {formatFileSize(group.saveableSize)}
                                    </td>
                                    <td className="px-3 py-2">
                                      <Badge variant="warning" size="sm">待处理</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {selectedDeptDuplicates.length > 5 && (
                              <p className="text-xs text-gray-500 text-center mt-2">
                                还有 {selectedDeptDuplicates.length - 5} 条记录未显示
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'rectification' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  各部门待整改文件清单，可导出发送至各部门负责人确认
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => exportDepartmentReports(reports)}
                  >
                    导出全部整改清单
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        排名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部门名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文件总数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        重复组数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        重复率
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        重复占用空间
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        可节省空间
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        整改优先级
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => {
                      const duplicateRate = ((report.duplicateCount / report.fileCount) * 100).toFixed(1);
                      const priority =
                        parseFloat(duplicateRate) > 10
                          ? { label: '高', variant: 'danger' as const }
                          : parseFloat(duplicateRate) > 5
                          ? { label: '中', variant: 'warning' as const }
                          : { label: '低', variant: 'success' as const };

                      return (
                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                report.rank <= 3
                                  ? 'bg-primary-100 text-primary-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {report.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{report.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-700">
                            {formatNumber(report.fileCount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-900">
                            {formatNumber(report.duplicateCount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(parseFloat(duplicateRate) * 5, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-sm font-medium text-gray-700">
                                {duplicateRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-danger-600">
                            {formatFileSize(report.duplicateSize)}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-success-600">
                            {formatFileSize(report.saveableSize)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={priority.variant}>
                              {priority.label}优先级
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Download className="w-4 h-4" />}
                              onClick={() => {
                                const deptDuplicates = getDepartmentDuplicates(report.name);
                                exportDuplicateGroups(deptDuplicates, `${report.name}-整改清单`);
                              }}
                              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2"
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">整改建议</p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• 建议高优先级部门在 7 个工作日内完成重复文件清理</li>
                      <li>• 导出整改清单发送至各部门负责人确认</li>
                      <li>• 清理完成后重新扫描验证清理效果</li>
                      <li>• 建议每季度开展一次全公司重复文件盘点</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
