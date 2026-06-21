import { useEffect, useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  User,
  Clock,
  FileText,
  HardDrive,
  RefreshCw,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle,
  ShieldCheck,
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
import { exportRecycleItems } from '@/utils/export';

export default function Recycle() {
  const {
    recycleItems,
    loading,
    fetchRecycleItems,
    approveDeletion,
    rejectDeletion,
  } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmingIds, setConfirmingIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRecycleItems();
  }, [fetchRecycleItems]);

  const pendingItems = recycleItems.filter(item => item.status === 'pending');
  const totalPendingSize = pendingItems.reduce((sum, item) => sum + item.fileItem.size, 0);

  const handleSelectAll = () => {
    if (selectedIds.length === pendingItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingItems.map(item => item.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openApproveModal = (ids: string[]) => {
    setConfirmingIds(ids);
    setConfirmText('');
    setShowApproveModal(true);
  };

  const openRejectModal = (ids: string[]) => {
    setConfirmingIds(ids);
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (confirmText !== '确认删除') return;
    await approveDeletion(confirmingIds);
    setShowApproveModal(false);
    setSelectedIds([]);
    setConfirmText('');
  };

  const handleReject = async () => {
    await rejectDeletion(confirmingIds);
    setShowRejectModal(false);
    setSelectedIds([]);
  };

  const selectedItems = pendingItems.filter(item => selectedIds.includes(item.id));
  const selectedSize = selectedItems.reduce((sum, item) => sum + item.fileItem.size, 0);

  if (loading && recycleItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-warning-700">待确认文件</p>
              <p className="text-2xl font-bold text-warning-800 font-mono">
                {formatNumber(pendingItems.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-700">涉及空间</p>
              <p className="text-2xl font-bold text-primary-800 font-mono">
                {formatFileSize(totalPendingSize)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-success-50 border border-success-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-success-700">预计节省</p>
              <p className="text-2xl font-bold text-success-800 font-mono">
                {formatFileSize(totalPendingSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-warning-50 border-l-4 border-warning-500 rounded-r-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning-800">安全处置流程</p>
            <p className="text-sm text-warning-700 mt-1">
              待回收区的文件需要法务/行政人员二次确认后才能永久删除。
              您可以选择恢复文件至原路径，或确认执行永久删除操作。
              所有操作均会记录在审计日志中。
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共 <span className="font-semibold text-gray-900">{formatNumber(pendingItems.length)}</span> 个待确认文件
          {selectedIds.length > 0 && (
            <span className="ml-4">
              已选择 <span className="font-semibold text-primary-600">{formatNumber(selectedIds.length)}</span> 个文件
              <span className="text-gray-500">（{formatFileSize(selectedSize)}）</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => exportRecycleItems(pendingItems)}
          >
            导出清单
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={<CheckCircle className="w-4 h-4" />}
            disabled={selectedIds.length === 0}
            onClick={() => openApproveModal(selectedIds)}
          >
            确认删除
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<XCircle className="w-4 h-4" />}
            disabled={selectedIds.length === 0}
            onClick={() => openRejectModal(selectedIds)}
          >
            恢复文件
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={pendingItems.length > 0 && selectedIds.length === pendingItems.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < pendingItems.length;
                    }}
                    onChange={handleSelectAll}
                  />
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
                  创建人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  移入时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原因
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                    <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>待回收区为空</p>
                    <p className="text-sm mt-1">所有文件已处理完毕</p>
                  </td>
                </tr>
              ) : (
                pendingItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-warning-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${getFileTypeColor(item.fileItem.fileType)}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {item.fileItem.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-500 font-mono">
                        {item.fileItem.path}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-700">
                        {formatFileSize(item.fileItem.size)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {item.fileItem.department}
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
                        {formatDateTime(item.movedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{item.movedBy}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="warning" size="sm">
                        {item.reason}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<CheckCircle className="w-4 h-4 text-success-600" />}
                          onClick={() => openApproveModal([item.id])}
                          className="text-success-600 hover:text-success-700 hover:bg-success-50 px-2"
                        >
                          删除
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<XCircle className="w-4 h-4 text-danger-600" />}
                          onClick={() => openRejectModal([item.id])}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 px-2"
                        >
                          恢复
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="确认永久删除"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">危险操作警告</p>
                <p className="text-sm text-danger-700 mt-1">
                  您即将永久删除 <strong>{formatNumber(confirmingIds.length)}</strong> 个文件。
                  此操作不可撤销，删除后将无法恢复。
                </p>
                <p className="text-sm text-danger-600 mt-2">
                  预计释放空间：
                  <strong>
                    {formatFileSize(
                      pendingItems
                        .filter(item => confirmingIds.includes(item.id))
                        .reduce((sum, item) => sum + item.fileItem.size, 0)
                    )}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              安全验证
            </label>
            <p className="text-xs text-gray-500 mb-2">
              请输入 <span className="font-mono font-bold text-gray-900">确认删除</span> 以继续
            </p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-danger-500"
              placeholder="请输入确认删除"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">审计记录</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 操作时间将被记录</li>
              <li>• 操作人信息将被记录</li>
              <li>• 删除文件清单将被存档</li>
              <li>• 操作不可撤销</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleApprove}
              disabled={confirmText !== '确认删除'}
              loading={loading}
            >
              确认永久删除
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="恢复文件"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success-800">恢复文件确认</p>
                <p className="text-sm text-success-700 mt-1">
                  您即将恢复 <strong>{formatNumber(confirmingIds.length)}</strong> 个文件至原路径。
                  文件将从待回收区移除，恢复正常访问权限。
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              取消
            </Button>
            <Button variant="success" onClick={handleReject} loading={loading}>
              确认恢复
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
