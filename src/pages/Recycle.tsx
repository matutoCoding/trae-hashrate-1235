import { useEffect, useState } from 'react';
import {
  Trash2,
  Clock,
  FileText,
  User,
  Folder,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Download,
  ShieldCheck,
  HardDrive,
  FileWarning,
  ChevronDown,
  ChevronRight,
  Eye,
  History,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatFileSize, formatDateTime, formatNumber, getFileTypeColor } from '@/utils/format';
import { getSourceDiskName } from '@/utils/mock';
import { exportRecycleItems } from '@/utils/export';
import type { RecycleItem, DisposalHistoryEvent, DeletedItem, RestoredItem } from '@/types';

const eventTypeConfig: Record<DisposalHistoryEvent['type'], { label: string; color: string; icon: string }> = {
  detected: { label: '发现重复', color: 'bg-info-500', icon: '🔍' },
  moved_to_recycle: { label: '移入待回收', color: 'bg-warning-500', icon: '📦' },
  review_pending: { label: '待审核', color: 'bg-info-400', icon: '⏳' },
  approved: { label: '审核通过', color: 'bg-success-500', icon: '✅' },
  rejected: { label: '驳回申请', color: 'bg-danger-400', icon: '❌' },
  deleted: { label: '永久删除', color: 'bg-danger-600', icon: '🗑️' },
  restored: { label: '恢复文件', color: 'bg-success-400', icon: '↩️' },
};

function DisposalTimeline({ history }: { history: DisposalHistoryEvent[] }) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="pl-6 pr-2 py-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">处置时间线</span>
      </div>
      <div className="space-y-4">
        {sortedHistory.map((event, index) => {
          const config = eventTypeConfig[event.type];
          const isLast = index === sortedHistory.length - 1;
          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {config.icon}
                </div>
                {!isLast && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{config.label}</span>
                  <Badge variant="default" size="xs">
                    {event.operator}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
                </div>
                {event.reason && (
                  <p className="text-xs text-gray-600 mt-1">原因：{event.reason}</p>
                )}
                {event.remark && (
                  <p className="text-xs text-gray-500 mt-0.5">{event.remark}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Recycle() {
  const {
    recycleItems,
    deletedItems,
    restoredItems,
    loading,
    overview,
    fetchRecycleItems,
    fetchOverview,
    approveDeletion,
    rejectDeletion,
  } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [actionType, setActionType] = useState<'delete' | 'restore'>('delete');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSourceDisk, setFilterSourceDisk] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'deleted' | 'restored'>('pending');

  const pendingItems = recycleItems.filter(item => item.status === 'pending');
  
  type DisplayItem = (RecycleItem | DeletedItem | RestoredItem) & { _type: 'pending' | 'deleted' | 'restored' };
  
  const allItems: DisplayItem[] = [
    ...pendingItems.map(i => ({ ...i, _type: 'pending' as const })),
    ...deletedItems.map(i => ({ ...i, _type: 'deleted' as const })),
    ...restoredItems.map(i => ({ ...i, _type: 'restored' as const })),
  ];
  
  const itemsByTab: DisplayItem[] = allItems.filter(i => i._type === activeTab);
  
  const filteredItems = itemsByTab.filter(item => {
    const matchDept = !filterDepartment || item.fileItem.department === filterDepartment;
    const matchDisk = !filterSourceDisk || item.fileItem.sourceDisk === filterSourceDisk;
    const matchKeyword = !searchKeyword || 
      item.fileItem.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.fileItem.path.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchDept && matchDisk && matchKeyword;
  });

  const totalPendingSize = filteredItems.reduce((sum, item) => sum + item.fileItem.size, 0);
  const totalSaveable = activeTab === 'pending' ? (overview?.pendingRecycleSize || 0) : totalPendingSize;
  const totalFreedByDeleted = deletedItems.reduce((sum, item) => sum + item.fileItem.size, 0);

  const card1Title = activeTab === 'pending' ? '待确认文件' : activeTab === 'deleted' ? '已删除文件' : '已恢复文件';
  const card2Title = activeTab === 'pending' ? '涉及空间' : activeTab === 'deleted' ? '已释放空间' : '恢复文件空间';
  const card3Title = activeTab === 'pending' ? '预计节省' : activeTab === 'deleted' ? '累计清理次数' : '累计恢复次数';

  const departments = Array.from(new Set(itemsByTab.map(i => i.fileItem.department)));
  const sourceDisks = Array.from(new Set(itemsByTab.map(i => i.fileItem.sourceDisk)));

  useEffect(() => {
    fetchRecycleItems();
    fetchOverview();
  }, [fetchRecycleItems, fetchOverview]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApprove = () => {
    setActionType('delete');
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const handleReject = () => {
    setActionType('restore');
    setShowRestoreModal(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== '确认删除') return;
    await approveDeletion(selectedIds);
    setShowDeleteModal(false);
    setSelectedIds([]);
    setDeleteConfirmText('');
  };

  const confirmRestore = async () => {
    await rejectDeletion(selectedIds);
    setShowRestoreModal(false);
    setSelectedIds([]);
  };

  const selectedSize = filteredItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.fileItem.size, 0);

  if (loading && pendingItems.length === 0) {
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
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              activeTab === 'pending' ? 'bg-warning-100' : activeTab === 'deleted' ? 'bg-danger-100' : 'bg-success-100'
            }`}>
              {activeTab === 'pending' && <FileWarning className={`w-6 h-6 text-warning-600`} />}
              {activeTab === 'deleted' && <Trash2 className={`w-6 h-6 text-danger-600`} />}
              {activeTab === 'restored' && <RefreshCw className={`w-6 h-6 text-success-600`} />}
            </div>
            <div>
              <p className="text-sm text-gray-500">{card1Title}</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {formatNumber(filteredItems.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card2Title}</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {activeTab === 'deleted' ? formatFileSize(totalFreedByDeleted) : formatFileSize(totalPendingSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card3Title}</p>
              <p className={`text-2xl font-bold font-mono ${
                activeTab === 'pending' ? 'text-success-600' : 'text-gray-900'
              }`}>
                {activeTab === 'pending' 
                  ? formatFileSize(totalSaveable)
                  : activeTab === 'deleted'
                    ? `${formatNumber(deletedItems.length)} 次`
                    : `${formatNumber(restoredItems.length)} 次`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已释放空间</p>
              <p className="text-2xl font-bold text-info-600 font-mono">
                {formatFileSize(overview?.totalFreedSpace || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <nav className="flex -mb-px border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('pending'); setSelectedIds([]); }}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'pending'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            待确认
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'pending' ? 'bg-warning-100 text-warning-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatNumber(pendingItems.length)}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('deleted'); setSelectedIds([]); }}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'deleted'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            已删除
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'deleted' ? 'bg-danger-100 text-danger-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatNumber(deletedItems.length)}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('restored'); setSelectedIds([]); }}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'restored'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            已恢复
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'restored' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatNumber(restoredItems.length)}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-info-800">安全处置流程</p>
              <p className="text-sm text-info-700 mt-1">
                待回收区的文件需要法务/行政人员二次确认后才能永久删除。
                您可以选择恢复文件至原路径，或确认执行永久删除操作。
                所有操作均会记录在审计日志中，点击文件行可查看完整处置时间线。
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-xs text-info-600">
                  <div className="w-2 h-2 rounded-full bg-info-500" />
                  <span>第1步：发现重复</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-info-400 rotate-180" />
                <div className="flex items-center gap-1 text-xs text-info-600">
                  <div className="w-2 h-2 rounded-full bg-warning-500" />
                  <span>第2步：移入待回收</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-info-400 rotate-180" />
                <div className="flex items-center gap-1 text-xs text-info-600">
                  <div className="w-2 h-2 rounded-full bg-info-500" />
                  <span>第3步：二次审核</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-info-400 rotate-180" />
                <div className="flex items-center gap-1 text-xs text-info-600">
                  <div className="w-2 h-2 rounded-full bg-danger-500" />
                  <span>第4步：永久删除</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'pending' && (
        <div className={`rounded-lg p-4 border ${activeTab === 'deleted' ? 'bg-danger-50 border-danger-200' : 'bg-success-50 border-success-200'}`}>
          <div className="flex items-start gap-3">
            <History className={`w-5 h-5 flex-shrink-0 mt-0.5 ${activeTab === 'deleted' ? 'text-danger-600' : 'text-success-600'}`} />
            <div>
              <p className={`font-medium ${activeTab === 'deleted' ? 'text-danger-800' : 'text-success-800'}`}>
                {activeTab === 'deleted' ? '已删除文件记录' : '已恢复文件记录'}
              </p>
              <p className={`text-sm mt-1 ${activeTab === 'deleted' ? 'text-danger-700' : 'text-success-700'}`}>
                这里展示的是{activeTab === 'deleted' ? '已经永久删除的文件审计记录，可展开查看完整处置时间线，删除文件不可恢复。' : '已恢复至原路径的文件审计记录，可展开查看完整处置时间线。'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索文件名或路径..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">全部部门</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterSourceDisk}
              onChange={(e) => setFilterSourceDisk(e.target.value)}
            >
              <option value="">全部来源盘</option>
              {sourceDisks.map(disk => (
                <option key={disk} value={disk}>{getSourceDiskName(disk)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共 <span className="font-semibold text-gray-900">{formatNumber(filteredItems.length)}</span> 个{activeTab === 'pending' ? '待确认' : activeTab === 'deleted' ? '已删除' : '已恢复'}文件
          {activeTab === 'pending' && selectedIds.length > 0 && (
            <span className="ml-4">
              已选择 <span className="font-semibold text-primary-600">{formatNumber(selectedIds.length)}</span> 个
              <span className="text-gray-500">（{formatFileSize(selectedSize)}）</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => exportRecycleItems(filteredItems.map((i: any) => ({ 
              fileItem: i.fileItem, 
              movedAt: (i as any).movedAt || (i as any).deletedAt || (i as any).restoredAt, 
              movedBy: (i as any).movedBy || (i as any).deletedBy || (i as any).restoredBy, 
              reason: i.reason 
            })))}
          >
            导出清单
          </Button>
          {activeTab === 'pending' && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                disabled={selectedIds.length === 0}
                onClick={handleReject}
              >
                恢复文件
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                disabled={selectedIds.length === 0}
                onClick={handleApprove}
              >
                确认删除
              </Button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'pending' && selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-700">
            <AlertTriangle className="w-5 h-5" />
            <span>
              已选择 <strong>{formatNumber(selectedIds.length)}</strong> 个文件，
              共 <strong>{formatFileSize(selectedSize)}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            取消选择
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab === 'pending' && (
                  <th className="px-2 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredItems.length;
                      }}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-2 py-3 text-left w-10">
                  <span className="sr-only">展开</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文件名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原路径
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  大小
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  部门
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源盘
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'pending' ? '移入时间' : activeTab === 'deleted' ? '删除时间' : '恢复时间'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'pending' ? '原因' : '处置原因'}
                </th>
                {activeTab === 'pending' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item: DisplayItem) => {
                const isExpanded = expandedIds.includes(item.id);
                return (
                  <>
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${activeTab === 'pending' && selectedIds.includes(item.id) ? 'bg-primary-50' : ''}`}
                    >
                      {activeTab === 'pending' && (
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleSelect(item.id)}
                          />
                        </td>
                      )}
                      <td className="px-2 py-3">
                        <button
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => toggleExpand(item.id)}
                          title={isExpanded ? '收起时间线' : '展开时间线'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${getFileTypeColor(item.fileItem.fileType)}`} />
                          <span className="text-sm font-medium text-gray-900">
                            {item.fileItem.name}
                          </span>
                          {activeTab !== 'pending' && (
                            <Badge variant={activeTab === 'deleted' ? 'danger' : 'success'} size="xs">
                              {activeTab === 'deleted' ? '已删除' : '已恢复'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-gray-500 font-mono max-w-xs truncate block">
                          {item.fileItem.path}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">
                          {formatFileSize(item.fileItem.size)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">
                          <Folder className="w-3 h-3 mr-1" />
                          {item.fileItem.department}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm">
                          <Database className="w-3 h-3 mr-1" />
                          {getSourceDiskName(item.fileItem.sourceDisk)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <User className="w-3 h-3 text-gray-400" />
                          {item.fileItem.createdBy}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(
                            (item as any).movedAt || (item as any).deletedAt || (item as any).restoredAt
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          操作人：{(item as any).movedBy || (item as any).deletedBy || (item as any).restoredBy}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="warning" size="sm">
                          {item.reason}
                        </Badge>
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="查看时间线"
                              onClick={() => toggleExpand(item.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                              title="恢复文件"
                              onClick={() => {
                                setSelectedIds([item.id]);
                                setActionType('restore');
                                setShowRestoreModal(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                              title="确认删除"
                              onClick={() => {
                                setSelectedIds([item.id]);
                                setActionType('delete');
                                setShowDeleteModal(true);
                                setDeleteConfirmText('');
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && item.history && item.history.length > 0 && (
                      <tr>
                        <td colSpan={activeTab === 'pending' ? 11 : 10} className="p-0">
                          <DisposalTimeline history={item.history} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {searchKeyword || filterDepartment || filterSourceDisk 
                ? '没有找到匹配的文件'
                : activeTab === 'pending' ? '待回收区暂无文件'
                  : activeTab === 'deleted' ? '暂无已删除文件记录'
                  : '暂无已恢复文件记录'
              }
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'pending' && '从重复文件页面移出的文件会显示在这里'}
              {activeTab === 'deleted' && '永久删除的文件记录将保留审计追踪'}
              {activeTab === 'restored' && '驳回删除申请后恢复的文件将显示在这里'}
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认永久删除"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">危险操作</p>
                <p className="text-sm text-danger-700 mt-1">
                  您即将永久删除 <strong>{formatNumber(selectedIds.length)}</strong> 个文件。
                  此操作不可撤销，删除后文件将无法恢复。
                </p>
                <p className="text-sm text-danger-600 mt-2">
                  释放空间：<strong>{formatFileSize(selectedSize)}</strong>
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              请输入 <span className="text-danger-600 font-bold">"确认删除"</span> 以继续
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="请输入确认删除"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              <strong>提示：</strong>请谨慎操作，永久删除的文件将无法恢复。
              建议在删除前与相关部门确认文件是否已归档或不再使用。
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteConfirmText !== '确认删除'}
              loading={loading}
              icon={<Trash2 className="w-4 h-4" />}
            >
              永久删除
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="恢复文件确认"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success-800">恢复文件</p>
                <p className="text-sm text-success-700 mt-1">
                  您即将恢复 <strong>{formatNumber(selectedIds.length)}</strong> 个文件至原路径。
                  恢复后文件将重新出现在重复文件列表中。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              <strong>说明：</strong>恢复操作会将文件移回原始位置，
              并重新纳入重复文件统计。如果您只是想暂时保留文件，
              建议先确认文件是否仍在使用中。
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
              取消
            </Button>
            <Button
              variant="success"
              onClick={confirmRestore}
              loading={loading}
              icon={<XCircle className="w-4 h-4" />}
            >
              确认恢复
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
