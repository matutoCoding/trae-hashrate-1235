import { useEffect, useState, useMemo } from 'react';
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
  Send,
  CheckCircle2,
  XCircle,
  History,
  Mail,
  Search,
  Filter,
  RotateCcw,
  Square,
  CheckSquare,
  Users,
  Shield,
  MinusSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  formatFileSize,
  formatDateTime,
  formatNumber,
  getFileTypeColor,
} from '@/utils/format';
import { getSourceDiskName, getDepartmentHead, getDepartments } from '@/utils/mock';
import { exportDepartmentReports } from '@/utils/export';
import type { DisposalHistoryEvent, RectificationItem, DepartmentReport } from '@/types';

const eventTypeConfig: Record<DisposalHistoryEvent['type'], { label: string; color: string; icon: string }> = {
  detected: { label: '发现重复', color: 'bg-info-500', icon: '🔍' },
  moved_to_recycle: { label: '移入待回收', color: 'bg-warning-500', icon: '📦' },
  review_pending: { label: '待审核', color: 'bg-info-400', icon: '⏳' },
  approved: { label: '审核通过', color: 'bg-success-500', icon: '✅' },
  rejected: { label: '驳回申请', color: 'bg-danger-400', icon: '❌' },
  deleted: { label: '永久删除', color: 'bg-danger-600', icon: '🗑️' },
  restored: { label: '恢复文件', color: 'bg-success-400', icon: '↩️' },
};

const rectificationStatusConfig = {
  pending: { variant: 'warning' as const, label: '待确认', color: 'text-warning-600 bg-warning-50' },
  confirmed: { variant: 'success' as const, label: '已确认', color: 'text-success-600 bg-success-50' },
  rejected: { variant: 'danger' as const, label: '已驳回', color: 'text-danger-600 bg-danger-50' },
};

export default function Reports() {
  const {
    reports,
    allDuplicates,
    disposalHistory,
    rectificationItems,
    loading,
    fetchReports,
    sendRectification,
    confirmRectification,
    rejectRectification,
    getDisposalHistoryForDepartment,
    getRectificationForDepartment,
    resetAllData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ranking' | 'checklist'>('ranking');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'topFiles' | 'disposal' | 'rectification'>('topFiles');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentReport | null>(null);
  const [selectedRectification, setSelectedRectification] = useState<RectificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rectificationStatusFilter, setRectificationStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // 新增：负责人视角 & 批量操作
  const [checklistViewMode, setChecklistViewMode] = useState<'admin' | 'owner'>('admin');
  const [ownerDepartment, setOwnerDepartment] = useState<string>(getDepartments()[0]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false);
  const [showBatchRejectModal, setShowBatchRejectModal] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');

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

  const getPriorityLevel = (report: DepartmentReport): 'high' | 'medium' | 'low' => {
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

  const handleSendRectification = () => {
    if (!selectedDept || selectedGroupIds.length === 0) return;
    sendRectification(selectedDept.name, selectedGroupIds, '当前用户');
    setShowSendModal(false);
    setSelectedGroupIds([]);
    setSelectedDept(null);
  };

  const handleConfirmRectification = (item: RectificationItem) => {
    confirmRectification(item.id, item.department + '负责人');
  };

  const handleRejectRectification = () => {
    if (!selectedRectification || !rejectReason.trim()) return;
    rejectRectification(selectedRectification.id, rejectReason, selectedRectification.department + '负责人');
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedRectification(null);
  };

  // 批量确认
  const handleBatchConfirm = () => {
    if (selectedItemIds.length === 0) return;
    selectedItemIds.forEach(id => {
      confirmRectification(id, ownerDepartment + '负责人');
    });
    setSelectedItemIds([]);
    setShowBatchConfirmModal(false);
  };

  // 批量驳回
  const handleBatchReject = () => {
    if (selectedItemIds.length === 0 || !batchRejectReason.trim()) return;
    selectedItemIds.forEach(id => {
      rejectRectification(id, batchRejectReason, ownerDepartment + '负责人');
    });
    setSelectedItemIds([]);
    setBatchRejectReason('');
    setShowBatchRejectModal(false);
  };

  const openSendModal = (dept: DepartmentReport) => {
    const deptGroups = getDepartmentDuplicates(dept.name);
    const availableGroupIds = deptGroups
      .filter(g => g.files.filter(f => f.id !== g.suggestedKeepId && f.status === 'active').length > 0)
      .map(g => g.id);
    setSelectedGroupIds(availableGroupIds);
    setSelectedDept(dept);
    setShowSendModal(true);
  };

  const totalDuplicateGroups = reports.reduce((sum, r) => sum + r.duplicateCount, 0);
  const totalDuplicateSize = reports.reduce((sum, r) => sum + r.duplicateSize, 0);
  const totalSaveable = reports.reduce((sum, r) => sum + r.saveableSize, 0);
  const totalPendingRecycle = reports.reduce((sum, r) => sum + r.pendingRecycleCount, 0);
  const totalFileCount = reports.reduce((sum, r) => sum + r.totalFileCount, 0);
  const totalDuplicateFileCount = reports.reduce((sum, r) => sum + r.fileCount, 0);
  const overallDuplicateRate = totalFileCount > 0 ? (totalDuplicateFileCount / totalFileCount) * 100 : 0;

  // 负责人视角下：强制只看本部门，默认只看待确认
  const displayRectificationItems = useMemo(() => {
    let items = rectificationItems;
    if (checklistViewMode === 'owner') {
      items = items.filter(r => r.department === ownerDepartment);
      // 负责人视角默认只显示待确认
      if (rectificationStatusFilter === 'all') {
        items = items.filter(r => r.status === 'pending');
      } else {
        items = items.filter(r => r.status === rectificationStatusFilter);
      }
    } else {
      items = items.filter(item => {
        const matchStatus = rectificationStatusFilter === 'all' || item.status === rectificationStatusFilter;
        return matchStatus;
      });
    }
    // 关键词过滤
    if (searchKeyword) {
      items = items.filter(item =>
        item.department.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.files.some(f => f.name.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }
    return items;
  }, [rectificationItems, checklistViewMode, ownerDepartment, rectificationStatusFilter, searchKeyword]);

  const filteredRectificationItems = displayRectificationItems;

  // 负责人视角下的计数（只统计本部门）
  const ownerScopedItems = useMemo(() => 
    checklistViewMode === 'owner' 
      ? rectificationItems.filter(r => r.department === ownerDepartment)
      : rectificationItems
  , [rectificationItems, checklistViewMode, ownerDepartment]);

  const pendingCount = ownerScopedItems.filter(r => r.status === 'pending').length;
  const confirmedCount = ownerScopedItems.filter(r => r.status === 'confirmed').length;
  const rejectedCount = ownerScopedItems.filter(r => r.status === 'rejected').length;

  // 批量选择辅助
  const selectableItemIds = filteredRectificationItems
    .filter(r => checklistViewMode === 'owner' ? r.status === 'pending' : r.status === 'pending')
    .map(r => r.id);
  const allSelected = selectableItemIds.length > 0 && selectableItemIds.every(id => selectedItemIds.includes(id));
  const someSelected = selectableItemIds.some(id => selectedItemIds.includes(id)) && !allSelected;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(selectableItemIds);
    }
  };
  const toggleSelectOne = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const currentHead = getDepartmentHead(ownerDepartment);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
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
              <p className="text-xs text-gray-500">重复组数</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                {formatNumber(totalDuplicateGroups)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">重复文件数</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                {formatNumber(totalDuplicateFileCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 text-info-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">总体重复率</p>
              <p className="text-xl font-bold text-info-600 font-mono">
                {overallDuplicateRate.toFixed(1)}%
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

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 text-warning-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">待处置</p>
              <p className="text-xl font-bold text-warning-600 font-mono">
                {formatNumber(totalPendingRecycle)}
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
            {pendingCount > 0 && (
              <Badge variant="warning" size="xs" className="ml-2">{pendingCount} 待确认</Badge>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetAllData}
            title="重置所有数据"
          >
            重置数据
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportAll}
          >
            导出全部报告
          </Button>
        </div>
      </div>

      {activeTab === 'ranking' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              按重复占用空间从高到低排序，帮助识别重点整改部门。点击部门行可展开查看详情、处置记录和整改清单
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {reports.map((report) => {
              const isExpanded = expandedDept === report.name;
              const priority = getPriorityLevel(report);
              const topFiles = getTopDuplicateFiles(report.name, 5);
              const deptHistory = getDisposalHistoryForDepartment(report.name);
              const deptRectification = getRectificationForDepartment(report.name);
              const head = getDepartmentHead(report.name);

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
                          {deptRectification.filter(r => r.status === 'pending').length > 0 && (
                            <Badge variant="info" size="sm">
                              {deptRectification.filter(r => r.status === 'pending').length} 个待确认
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                          <p className="text-sm text-gray-500">
                            {formatNumber(report.duplicateCount)} 组重复 · {formatNumber(report.fileCount)} 个文件
                          </p>
                          <p className="text-sm text-gray-400">|</p>
                          <p className="text-sm text-gray-500">
                            文件总数：{formatNumber(report.totalFileCount)}
                          </p>
                          <p className="text-sm text-gray-400">|</p>
                          <p className="text-sm text-gray-500">
                            重复率：{(report.duplicateRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400">|</p>
                          <p className="text-sm text-gray-500">
                            负责人：{head.name}
                          </p>
                        </div>
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
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              expandedSection === 'topFiles'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setExpandedSection('topFiles'); }}
                          >
                            <Target className="w-4 h-4 inline-block mr-1" />
                            Top 重复文件
                          </button>
                          <button
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              expandedSection === 'disposal'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setExpandedSection('disposal'); }}
                          >
                            <History className="w-4 h-4 inline-block mr-1" />
                            处置记录
                            {deptHistory.length > 0 && (
                              <Badge variant="info" size="xs" className="ml-1">{deptHistory.length}</Badge>
                            )}
                          </button>
                          <button
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              expandedSection === 'rectification'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setExpandedSection('rectification'); }}
                          >
                            <ListChecks className="w-4 h-4 inline-block mr-1" />
                            整改清单
                            {deptRectification.length > 0 && (
                              <Badge variant="info" size="xs" className="ml-1">{deptRectification.length}</Badge>
                            )}
                          </button>
                          <div className="flex-1" />
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Send className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openSendModal(report);
                            }}
                          >
                            发送整改清单
                          </Button>
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

                        {expandedSection === 'topFiles' && (
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
                        )}

                        {expandedSection === 'disposal' && (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {deptHistory.length > 0 ? (
                              deptHistory.slice(0, 20).map((event) => {
                                const config = eventTypeConfig[event.type];
                                return (
                                  <div key={event.id} className="flex gap-3 bg-white rounded border border-gray-200 p-3">
                                    <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white text-xs flex-shrink-0`}>
                                      {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900">{config.label}</span>
                                        <Badge variant="default" size="xs">{event.operator}</Badge>
                                        <span className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
                                      </div>
                                      <p className="text-sm text-gray-700 mt-1 truncate">
                                        <FileText className="w-3 h-3 inline-block mr-1 text-gray-400" />
                                        {event.fileName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5 truncate font-mono">
                                        {event.filePath}
                                      </p>
                                      {event.reason && (
                                        <p className="text-xs text-gray-600 mt-1">原因：{event.reason}</p>
                                      )}
                                      {event.remark && (
                                        <p className="text-xs text-gray-500 mt-0.5">{event.remark}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm text-gray-500 py-8 text-center">暂无处置记录</p>
                            )}
                          </div>
                        )}

                        {expandedSection === 'rectification' && (
                          <div className="space-y-3">
                            {deptRectification.length > 0 ? (
                              deptRectification.map((item) => {
                                const statusConfig = rectificationStatusConfig[item.status];
                                return (
                                  <div key={item.id} className="bg-white rounded border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${statusConfig.color} flex items-center justify-center`}>
                                          {item.status === 'pending' && <Clock className="w-5 h-5 text-warning-600" />}
                                          {item.status === 'confirmed' && <CheckCircle2 className="w-5 h-5 text-success-600" />}
                                          {item.status === 'rejected' && <XCircle className="w-5 h-5 text-danger-600" />}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">
                                              整改清单 #{item.id.slice(-6)}
                                            </span>
                                            <Badge variant={statusConfig.variant} size="sm">
                                              {statusConfig.label}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            发送时间：{formatDateTime(item.sentAt)} · 发送人：{item.sentBy}
                                          </p>
                                          {item.confirmedAt && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                              {item.status === 'confirmed' ? '确认' : '驳回'}时间：{formatDateTime(item.confirmedAt)} · {item.confirmedBy}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {item.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="success"
                                            size="sm"
                                            icon={<CheckCircle2 className="w-4 h-4" />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConfirmRectification(item);
                                            }}
                                          >
                                            确认
                                          </Button>
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            icon={<XCircle className="w-4 h-4" />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedRectification(item);
                                              setShowRejectModal(true);
                                            }}
                                          >
                                            驳回
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-500 text-xs">涉及文件数</p>
                                        <p className="font-mono font-medium text-gray-900">{item.fileCount} 个</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 text-xs">可节省空间</p>
                                        <p className="font-mono font-medium text-success-600">{formatFileSize(item.saveableSize)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 text-xs">来源盘</p>
                                        <p className="font-medium text-gray-900">{getSourceDiskName(item.sourceDisk)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 text-xs">涉及组数</p>
                                        <p className="font-mono font-medium text-gray-900">1 组</p>
                                      </div>
                                    </div>
                                    {item.rejectReason && (
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs text-danger-600">
                                          <strong>驳回原因：</strong>{item.rejectReason}
                                        </p>
                                      </div>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <p className="text-xs text-gray-500 mb-2">涉及文件：</p>
                                      <div className="space-y-1">
                                        {item.files.map(file => (
                                          <div key={file.id} className="text-xs text-gray-600 flex items-center gap-2">
                                            <FileText className={`w-3 h-3 ${getFileTypeColor(file.fileType)}`} />
                                            <span className="truncate font-mono">{file.path}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8">
                                <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">暂无整改清单</p>
                                <p className="text-xs text-gray-400 mt-1">点击右上角"发送整改清单"按钮向该部门发送</p>
                              </div>
                            )}
                          </div>
                        )}

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
        <div className="space-y-4">
          {/* 视角切换 + 部门选择 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <button
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                      checklistViewMode === 'admin'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setChecklistViewMode('admin'); setSelectedItemIds([]); }}
                  >
                    <Shield className="w-4 h-4" />
                    管理视角
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                      checklistViewMode === 'owner'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setChecklistViewMode('owner'); setSelectedItemIds([]); setRectificationStatusFilter('all'); }}
                  >
                    <Users className="w-4 h-4" />
                    部门负责人视角
                  </button>
                </div>
                {checklistViewMode === 'owner' && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-primary-200 text-primary-700 font-semibold">
                      {currentHead.name.slice(0, 1)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="pr-3 border-r border-primary-200">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-primary-600">所属部门：</label>
                          <select
                            value={ownerDepartment}
                            onChange={(e) => { setOwnerDepartment(e.target.value); setSelectedItemIds([]); }}
                            className="w-36 px-2 py-1.5 border border-primary-300 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <p className="text-xs text-primary-500 mt-0.5">
                          负责人：<strong>{currentHead.name}</strong> · {currentHead.email}
                        </p>
                      </div>
                      <Badge variant="warning" size="sm">
                        本部门待确认 {pendingCount} 条
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              {/* 批量操作工具栏（仅负责人视角且有选中时显示） */}
              {checklistViewMode === 'owner' && selectedItemIds.length > 0 && (
                <div className="flex items-center gap-2 bg-warning-50 border border-warning-200 rounded-lg px-4 py-2">
                  <span className="text-sm text-warning-800">
                    已选 <strong>{formatNumber(selectedItemIds.length)}</strong> 条待确认清单
                  </span>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<ThumbsUp className="w-4 h-4" />}
                    onClick={() => setShowBatchConfirmModal(true)}
                  >
                    批量确认
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<ThumbsDown className="w-4 h-4" />}
                    onClick={() => setShowBatchRejectModal(true)}
                  >
                    批量驳回
                  </Button>
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700 px-2"
                    onClick={() => setSelectedItemIds([])}
                  >
                    取消选择
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-1">
                  <button
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      rectificationStatusFilter === 'all'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setRectificationStatusFilter('all')}
                  >
                    {checklistViewMode === 'owner' ? '默认(待确认)' : '全部'}
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      rectificationStatusFilter === 'pending'
                        ? 'bg-warning-100 text-warning-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setRectificationStatusFilter('pending')}
                  >
                    待确认
                    <Badge variant="warning" size="xs" className="ml-1">{pendingCount}</Badge>
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      rectificationStatusFilter === 'confirmed'
                        ? 'bg-success-100 text-success-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setRectificationStatusFilter('confirmed')}
                  >
                    已确认
                    <Badge variant="success" size="xs" className="ml-1">{confirmedCount}</Badge>
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      rectificationStatusFilter === 'rejected'
                        ? 'bg-danger-100 text-danger-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setRectificationStatusFilter('rejected')}
                  >
                    已驳回
                    <Badge variant="danger" size="xs" className="ml-1">{rejectedCount}</Badge>
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={checklistViewMode === 'owner' ? '搜索文件名...' : '搜索部门或文件名...'}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {checklistViewMode === 'owner' && (
                      <th className="px-4 py-3 text-left w-12">
                        <button
                          onClick={toggleSelectAll}
                          className="text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-40"
                          disabled={selectableItemIds.length === 0}
                          title="全选本页待确认清单"
                        >
                          {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : someSelected ? (
                            <MinusSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部门
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      负责人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      来源盘
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可节省空间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发送时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      确认时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRectificationItems.map((item) => {
                    const statusConfig = rectificationStatusConfig[item.status];
                    const head = getDepartmentHead(item.department);
                    const canSelect = item.status === 'pending';
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
                        {checklistViewMode === 'owner' && (
                          <td className="px-4 py-3">
                            {canSelect ? (
                              <button
                                onClick={() => toggleSelectOne(item.id)}
                                className="text-gray-500 hover:text-primary-600 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-primary-600" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300">
                                <Square className="w-5 h-5 opacity-30" />
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          {item.rejectReason && (
                            <p className="text-xs text-danger-600 mt-1 max-w-[220px] truncate" title={item.rejectReason}>
                              驳回原因：{item.rejectReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{item.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700">{head.name}</span>
                          </div>
                          <p className="text-xs text-gray-400">{head.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="sm">
                            {getSourceDiskName(item.sourceDisk)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-700">
                            {formatNumber(item.fileCount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-success-600">
                            {formatFileSize(item.saveableSize)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{formatDateTime(item.sentAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {item.confirmedAt ? (
                            <span className="text-xs text-gray-500">{formatDateTime(item.confirmedAt)}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="success"
                                size="xs"
                                icon={<CheckCircle2 className="w-3 h-3" />}
                                onClick={() => handleConfirmRectification(item)}
                              >
                                确认
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                icon={<XCircle className="w-3 h-3" />}
                                onClick={() => {
                                  setSelectedRectification(item);
                                  setShowRejectModal(true);
                                }}
                              >
                                驳回
                              </Button>
                            </div>
                          )}
                          {item.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={<Download className="w-3 h-3" />}
                            >
                              查看
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRectificationItems.length === 0 && (
              <div className="py-16 text-center">
                <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchKeyword || rectificationStatusFilter !== (checklistViewMode === 'owner' ? 'all' : 'all')
                    ? '没有找到匹配的整改清单'
                    : checklistViewMode === 'owner'
                      ? `${ownerDepartment}暂无待确认的整改清单，干得漂亮！`
                      : '暂无整改清单'
                  }
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {checklistViewMode === 'owner'
                    ? '如有疑问请联系管理员核对'
                    : '从部门排行榜中点击"发送整改清单"可向各部门分发'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-800">数据说明</p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>文件总数：</strong>基于各部门当前存储量估算值 &nbsp;|&nbsp;
              <strong>重复率：</strong>重复文件数 / 文件总数 &nbsp;|&nbsp;
              <strong>可节省空间：</strong>删除多余副本后可释放的空间 &nbsp;|&nbsp;
              <strong>待处置数：</strong>已移入待回收区但尚未最终删除的文件数量
            </p>
            <p className="text-sm text-gray-500 mt-1">
              所有数据均基于当前页面的重复文件组和待回收处理状态实时计算，切换页面或重新进入后数据保持一致。
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={`发送整改清单 - ${selectedDept?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-info-800">发送整改清单</p>
                <p className="text-sm text-info-700 mt-1">
                  选择需要该部门确认清理的重复文件组，发送后部门负责人可以进行确认或驳回。
                </p>
                {selectedDept && (
                  <p className="text-sm text-info-600 mt-2">
                    <strong>接收人：</strong>{getDepartmentHead(selectedDept.name).name} ({getDepartmentHead(selectedDept.name).email})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择需要整改的重复文件组
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              {selectedDept && getDepartmentDuplicates(selectedDept.name).length > 0 ? (
                getDepartmentDuplicates(selectedDept.name).map((group) => {
                  const keepFile = group.files.find(f => f.id === group.suggestedKeepId);
                  const availableFiles = group.files.filter(f => f.id !== group.suggestedKeepId && f.status === 'active');
                  const isSelected = selectedGroupIds.includes(group.id);
                  const disabled = availableFiles.length === 0;

                  return (
                    <div
                      key={group.id}
                      className={`p-3 border-b border-gray-100 last:border-b-0 ${disabled ? 'bg-gray-50 opacity-60' : isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupIds(prev => [...prev, group.id]);
                            } else {
                              setSelectedGroupIds(prev => prev.filter(id => id !== group.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${getFileTypeColor(keepFile?.fileType || 'pdf')}`} />
                            <span className="text-sm font-medium text-gray-900">
                              {keepFile?.name}
                            </span>
                            <Badge variant="info" size="xs">
                              {getSourceDiskName(group.sourceDisk)}
                            </Badge>
                            {disabled && (
                              <Badge variant="default" size="xs">已处置</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate font-mono">
                            {keepFile?.path}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{group.fileCount} 个副本</span>
                            <span className="text-success-600">{formatFileSize(group.saveableSize)} 可节省</span>
                            <span>{availableFiles.length} 个可清理</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 py-8 text-center">该部门暂无重复文件组</p>
              )}
            </div>
          </div>

          {selectedGroupIds.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700">
                已选择 <strong>{formatNumber(selectedGroupIds.length)}</strong> 组文件，
                涉及 <strong>{formatNumber(
                  getDepartmentDuplicates(selectedDept?.name || '')
                    .filter(g => selectedGroupIds.includes(g.id))
                    .reduce((sum, g) => sum + g.files.filter(f => f.id !== g.suggestedKeepId && f.status === 'active').length, 0)
                )}</strong> 个文件，
                预计可释放 <strong>{formatFileSize(
                  getDepartmentDuplicates(selectedDept?.name || '')
                    .filter(g => selectedGroupIds.includes(g.id))
                    .reduce((sum, g) => sum + g.saveableSize, 0)
                )}</strong> 空间
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSendModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSendRectification}
              disabled={selectedGroupIds.length === 0}
              icon={<Send className="w-4 h-4" />}
            >
              发送整改清单
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回整改清单"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">驳回整改清单</p>
                <p className="text-sm text-danger-700 mt-1">
                  请填写驳回原因，以便管理员了解情况并重新核对文件清单。
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              驳回原因 <span className="text-danger-600">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500 resize-none"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请详细说明驳回原因，例如：文件仍在使用中、清单有误、需要进一步核对等..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectRectification}
              disabled={!rejectReason.trim()}
              icon={<XCircle className="w-4 h-4" />}
            >
              确认驳回
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量确认 Modal */}
      <Modal
        isOpen={showBatchConfirmModal}
        onClose={() => setShowBatchConfirmModal(false)}
        title="批量确认整改清单"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ThumbsUp className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success-800">批量确认整改清单</p>
                <p className="text-sm text-success-700 mt-1">
                  即将确认以下整改清单，请仔细核对后再执行。确认后相关文件将视为部门已承诺清理。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">所属部门</span>
              <Badge variant="default" size="sm">{ownerDepartment}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">确认数量</span>
              <span className="font-semibold text-success-700 font-mono">{formatNumber(selectedItemIds.length)} 条</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">涉及文件数</span>
              <span className="font-mono text-gray-700">
                {formatNumber(
                  filteredRectificationItems
                    .filter(r => selectedItemIds.includes(r.id))
                    .reduce((s, r) => s + r.fileCount, 0)
                )} 个
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">预计节省空间</span>
              <span className="font-mono text-success-700 font-semibold">
                {formatFileSize(
                  filteredRectificationItems
                    .filter(r => selectedItemIds.includes(r.id))
                    .reduce((s, r) => s + r.saveableSize, 0)
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBatchConfirmModal(false)}>
              取消
            </Button>
            <Button
              variant="success"
              onClick={handleBatchConfirm}
              icon={<ThumbsUp className="w-4 h-4" />}
            >
              确认并处理 {formatNumber(selectedItemIds.length)} 条
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量驳回 Modal */}
      <Modal
        isOpen={showBatchRejectModal}
        onClose={() => setShowBatchRejectModal(false)}
        title="批量驳回整改清单"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ThumbsDown className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">批量驳回整改清单</p>
                <p className="text-sm text-danger-700 mt-1">
                  请填写统一驳回原因，管理员将根据该原因重新核对文件清单。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">所属部门</span>
              <Badge variant="default" size="sm">{ownerDepartment}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">驳回数量</span>
              <span className="font-semibold text-danger-700 font-mono">{formatNumber(selectedItemIds.length)} 条</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              驳回原因 <span className="text-danger-600">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500 resize-none"
              rows={5}
              value={batchRejectReason}
              onChange={(e) => setBatchRejectReason(e.target.value)}
              placeholder="请详细说明驳回原因，例如：文件仍在使用中、清单有误、需要进一步核对、部分文件已自行清理等..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBatchRejectModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleBatchReject}
              disabled={!batchRejectReason.trim()}
              icon={<ThumbsDown className="w-4 h-4" />}
            >
              确认驳回 {formatNumber(selectedItemIds.length)} 条
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
