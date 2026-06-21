import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Trash2,
  FileText,
  User,
  Clock,
  Hash,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Folder,
  X,
  Database,
  Layers,
  ListChecks,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  formatFileSize,
  formatDateTime,
  truncateHash,
  formatNumber,
  getFileTypeColor,
} from '@/utils/format';
import { getDepartments, getFileTypes, getSourceDiskName } from '@/utils/mock';
import { exportDuplicateGroups } from '@/utils/export';
import type { FilterOptions, FileItem } from '@/types';

export default function Duplicates() {
  const {
    duplicates,
    loading,
    selectedFileIds,
    expandedGroupIds,
    filters,
    batchPlan,
    fetchDuplicates,
    toggleFileSelection,
    clearFileSelection,
    selectAllFiles,
    toggleGroupExpand,
    setFilters,
    clearFilters,
    moveToRecycle,
    createBatchPlan,
    addToBatchPlan,
    removeFromBatchPlan,
    clearBatchPlan,
    executeBatchPlan,
  } = useAppStore();

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveReason, setMoveReason] = useState('内容重复');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchReason, setBatchReason] = useState('内容重复');

  const departments = getDepartments();
  const fileTypes = getFileTypes();
  const sourceDisks = [
    { id: 'department', name: '部门盘' },
    { id: 'project', name: '项目盘' },
    { id: 'archive', name: '归档盘' },
  ];

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleApplyFilters = () => {
    fetchDuplicates(filters);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    clearFilters();
    fetchDuplicates({});
  };

  const handleMoveToRecycle = async () => {
    if (selectedFileIds.length === 0) return;
    await moveToRecycle(selectedFileIds, moveReason);
    setShowMoveModal(false);
    setMoveReason('内容重复');
  };

  const getSelectedFiles = (): FileItem[] => {
    const files: FileItem[] = [];
    duplicates.forEach(group => {
      group.files.forEach(file => {
        if (selectedFileIds.includes(file.id)) {
          files.push(file);
        }
      });
    });
    return files;
  };

  const selectedFiles = getSelectedFiles();
  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const isInBatchPlan = (groupId: string, fileId: string): boolean => {
    if (!batchPlan) return false;
    const item = batchPlan.items.find(i => i.groupId === groupId);
    return item ? item.fileIds.includes(fileId) : false;
  };

  const handleBatchToggle = (groupId: string, fileIds: string[]) => {
    if (!batchPlan) {
      createBatchPlan();
    }
    
    const allInBatch = fileIds.every(id => isInBatchPlan(groupId, id));
    if (allInBatch) {
      removeFromBatchPlan(groupId, fileIds);
    } else {
      addToBatchPlan(groupId, fileIds);
    }
  };

  const handleFileBatchToggle = (groupId: string, fileId: string) => {
    if (!batchPlan) {
      createBatchPlan();
    }
    
    if (isInBatchPlan(groupId, fileId)) {
      removeFromBatchPlan(groupId, [fileId]);
    } else {
      addToBatchPlan(groupId, [fileId]);
    }
  };

  const handleExecuteBatch = async () => {
    if (!batchPlan || batchPlan.items.length === 0) return;
    await executeBatchPlan(batchReason);
    setShowBatchModal(false);
    setBatchMode(false);
    setBatchReason('内容重复');
  };

  const toggleBatchMode = () => {
    if (batchMode) {
      clearBatchPlan();
    }
    setBatchMode(!batchMode);
  };

  if (loading && duplicates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            共 <span className="font-semibold text-gray-900">{formatNumber(duplicates.length)}</span> 组重复文件
            {selectedFileIds.length > 0 && !batchMode && (
              <span className="ml-4">
                已选择 <span className="font-semibold text-primary-600">{formatNumber(selectedFileIds.length)}</span> 个文件
                <span className="text-gray-500">（{formatFileSize(totalSelectedSize)}）</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            筛选
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<ListChecks className="w-4 h-4" />}
            onClick={toggleBatchMode}
            className={batchMode ? 'bg-primary-100 text-primary-700 border-primary-200' : ''}
          >
            {batchMode ? '退出批量模式' : '批量处置'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => exportDuplicateGroups(duplicates)}
          >
            导出
          </Button>
          {!batchMode && (
            <Button
              variant="warning"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              disabled={selectedFileIds.length === 0}
              onClick={() => setShowMoveModal(true)}
            >
              移入待回收区
            </Button>
          )}
          {batchMode && (
            <Button
              variant="warning"
              size="sm"
              icon={<Layers className="w-4 h-4" />}
              disabled={!batchPlan || batchPlan.items.length === 0}
              onClick={() => setShowBatchModal(true)}
            >
              生成处置方案
            </Button>
          )}
        </div>
      </div>

      {batchMode && batchPlan && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-primary-900">批量处置模式</p>
              <p className="text-sm text-primary-700">
                已选择 <span className="font-semibold">{formatNumber(batchPlan.totalFileCount)}</span> 个文件，
                预计释放 <span className="font-semibold">{formatFileSize(batchPlan.totalSaveableSize)}</span> 空间
                {batchPlan.departments.length > 0 && (
                  <span className="ml-2">· 涉及 {batchPlan.departments.length} 个部门</span>
                )}
                {batchPlan.sourceDisks.length > 0 && (
                  <span className="ml-2">· {batchPlan.sourceDisks.map(d => getSourceDiskName(d)).join('、')}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearBatchPlan}>
              清空选择
            </Button>
          </div>
        </div>
      )}

      {showFilterPanel && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">筛选条件</h4>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来源盘</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.sourceDisk || ''}
                onChange={(e) => setFilters({ sourceDisk: e.target.value || undefined })}
              >
                <option value="">全部来源</option>
                {sourceDisks.map(disk => (
                  <option key={disk.id} value={disk.id}>{disk.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.department || ''}
                onChange={(e) => setFilters({ department: e.target.value || undefined })}
              >
                <option value="">全部部门</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.fileType || ''}
                onChange={(e) => setFilters({ fileType: e.target.value || undefined })}
              >
                <option value="">全部类型</option>
                {fileTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小重复次数</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.minDuplicates || ''}
                onChange={(e) => setFilters({ minDuplicates: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">不限</option>
                <option value="2">≥ 2 次</option>
                <option value="3">≥ 3 次</option>
                <option value="4">≥ 4 次</option>
                <option value="5">≥ 5 次</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小可节省空间</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.minSize || ''}
                onChange={(e) => setFilters({ minSize: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">不限</option>
                <option value="1048576">≥ 1 MB</option>
                <option value="10485760">≥ 10 MB</option>
                <option value="104857600">≥ 100 MB</option>
                <option value="1073741824">≥ 1 GB</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              重置
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyFilters}>
              应用筛选
            </Button>
          </div>
        </div>
      )}

      {selectedFileIds.length > 0 && !batchMode && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-warning-700">
            <AlertCircle className="w-5 h-5" />
            <span>
              已选择 <strong>{formatNumber(selectedFileIds.length)}</strong> 个文件，
              预计可释放 <strong>{formatFileSize(totalSelectedSize)}</strong> 空间
            </span>
          </div>
          <button
            onClick={clearFileSelection}
            className="text-sm text-warning-600 hover:text-warning-800"
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
                <th className="px-4 py-3 text-left w-10">
                  {!batchMode && (
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={
                        duplicates.length > 0 &&
                        duplicates.every(g =>
                          g.files.filter(f => f.id !== g.suggestedKeepId).every(f => selectedFileIds.includes(f.id))
                        )
                      }
                      onChange={() => {
                        const allNonKeepIds = duplicates.flatMap(g =>
                          g.files.filter(f => f.id !== g.suggestedKeepId).map(f => f.id)
                        );
                        selectAllFiles(allNonKeepIds);
                      }}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  展开
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  哈希值
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源盘
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所属部门
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文件数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总大小
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  可节省空间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建议保留
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {duplicates.map((group) => {
                const isExpanded = expandedGroupIds.includes(group.id);
                const nonKeepFiles = group.files.filter(f => f.id !== group.suggestedKeepId);
                const allNonKeepSelected = nonKeepFiles.every(f => selectedFileIds.includes(f.id));
                const someNonKeepSelected = nonKeepFiles.some(f => selectedFileIds.includes(f.id));
                const allInBatch = nonKeepFiles.every(f => isInBatchPlan(group.id, f.id));
                const someInBatch = nonKeepFiles.some(f => isInBatchPlan(group.id, f.id));

                return (
                  <>
                    <tr
                      key={group.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {!batchMode && nonKeepFiles.length > 0 && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={allNonKeepSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someNonKeepSelected && !allNonKeepSelected;
                            }}
                            onChange={() => selectAllFiles(nonKeepFiles.map(f => f.id))}
                          />
                        )}
                        {batchMode && nonKeepFiles.length > 0 && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={allInBatch}
                            ref={(el) => {
                              if (el) el.indeterminate = someInBatch && !allInBatch;
                            }}
                            onChange={() => handleBatchToggle(group.id, nonKeepFiles.map(f => f.id))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGroupExpand(group.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {truncateHash(group.hash)}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm">
                          <Database className="w-3 h-3 mr-1" />
                          {getSourceDiskName(group.sourceDisk)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">
                          <Folder className="w-3 h-3 mr-1" />
                          {group.department}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {group.fileCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">
                          {formatFileSize(group.totalSize)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-success-600">
                          {formatFileSize(group.saveableSize)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {group.files.find(f => f.id === group.suggestedKeepId)?.name.slice(0, 18)}...
                        </Badge>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="bg-gray-50 p-0">
                          <div className="p-4 border-l-4 border-primary-500">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="px-4 py-2 text-left w-10"></th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">文件名</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">路径</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">大小</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建人</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">创建时间</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">最近访问</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.files.map((file) => {
                                  const isKeep = file.id === group.suggestedKeepId;
                                  const isSelected = selectedFileIds.includes(file.id);
                                  const inBatch = isInBatchPlan(group.id, file.id);

                                  return (
                                    <tr
                                      key={file.id}
                                      className={`border-b border-gray-100 last:border-0 ${isSelected ? 'bg-warning-50' : ''} ${isKeep ? 'bg-success-50/50' : ''} ${inBatch ? 'bg-primary-50' : ''}`}
                                    >
                                      <td className="px-4 py-3">
                                        {!isKeep && !batchMode && (
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={isSelected}
                                            onChange={() => toggleFileSelection(file.id)}
                                          />
                                        )}
                                        {!isKeep && batchMode && (
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={inBatch}
                                            onChange={() => handleFileBatchToggle(group.id, file.id)}
                                          />
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className={`w-4 h-4 ${getFileTypeColor(file.fileType)}`} />
                                          <span className={`text-sm ${isKeep ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                            {file.name}
                                          </span>
                                          {isKeep && (
                                            <Badge variant="success" size="sm">
                                              建议保留
                                            </Badge>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <code className="text-xs text-gray-500 font-mono">{file.path}</code>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="font-mono text-sm text-gray-700">
                                          {formatFileSize(file.size)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                          <User className="w-3 h-3 text-gray-400" />
                                          {file.createdBy}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Clock className="w-3 h-3" />
                                          {formatDateTime(file.createdAt)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Clock className="w-3 h-3" />
                                          {formatDateTime(file.lastAccessedAt)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        {isKeep ? (
                                          <Badge variant="success">保留</Badge>
                                        ) : inBatch ? (
                                          <Badge variant="info">已选入方案</Badge>
                                        ) : isSelected ? (
                                          <Badge variant="warning">已选择</Badge>
                                        ) : (
                                          <Badge variant="default">待处理</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title="移入待回收区"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">操作确认</p>
                <p className="text-sm text-warning-700 mt-1">
                  您即将将 <strong>{formatNumber(selectedFileIds.length)}</strong> 个文件移入待回收区。
                  这些文件将保留在待回收区，等待法务/行政二次确认后才能永久删除。
                </p>
                <p className="text-sm text-warning-600 mt-2">
                  预计可释放空间：<strong>{formatFileSize(totalSelectedSize)}</strong>
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">移出原因</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={moveReason}
              onChange={(e) => setMoveReason(e.target.value)}
            >
              <option value="内容重复">内容重复</option>
              <option value="版本过期">版本过期</option>
              <option value="路径冗余">路径冗余</option>
              <option value="已归档">已归档</option>
              <option value="其他">其他原因</option>
            </select>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件列表预览</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {selectedFiles.slice(0, 5).map(file => (
                  <div key={file.id} className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 truncate">{file.name}</span>
                      <span className="text-gray-500 font-mono ml-2 flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{file.path}</p>
                  </div>
                ))}
                {selectedFiles.length > 5 && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">
                    还有 {selectedFiles.length - 5} 个文件未显示...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowMoveModal(false)}>
              取消
            </Button>
            <Button variant="warning" onClick={handleMoveToRecycle} loading={loading}>
              确认移入待回收区
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="批量处置方案确认"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary-800">方案概览</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-primary-600">涉及文件数</p>
                    <p className="text-lg font-bold text-primary-800 font-mono">
                      {formatNumber(batchPlan?.totalFileCount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">预计释放空间</p>
                    <p className="text-lg font-bold text-primary-800 font-mono">
                      {formatFileSize(batchPlan?.totalSaveableSize || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">涉及部门</p>
                    <p className="text-sm font-medium text-primary-800">
                      {batchPlan?.departments.join('、') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">来源盘</p>
                    <p className="text-sm font-medium text-primary-800">
                      {batchPlan?.sourceDisks.map(d => getSourceDiskName(d)).join('、') || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处置原因</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={batchReason}
              onChange={(e) => setBatchReason(e.target.value)}
            >
              <option value="内容重复">内容重复</option>
              <option value="版本过期">版本过期</option>
              <option value="路径冗余">路径冗余</option>
              <option value="已归档">已归档</option>
              <option value="批量清理">批量清理</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">处置影响说明</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 所有选中的文件将被移入待回收区</li>
              <li>• 需要法务/行政人员二次确认后才能永久删除</li>
              <li>• 在待回收区内可随时恢复文件至原路径</li>
              <li>• 所有操作将记录在审计日志中</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowBatchModal(false)}>
              取消
            </Button>
            <Button
              variant="warning"
              onClick={handleExecuteBatch}
              loading={loading}
              icon={<Trash2 className="w-4 h-4" />}
            >
              确认执行批量处置
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
