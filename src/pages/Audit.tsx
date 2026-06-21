import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  FileSearch,
  FolderTree,
  User,
  Clock,
  Eye,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Send,
  ThumbsUp,
  ThumbsDown,
  History,
  RefreshCw,
  FilterX,
  Shield,
  Scan,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDateTime, formatFileSize, formatNumber, formatRelativeTime } from '@/utils/format';
import type { DisposalHistoryEvent, DisposalEventType } from '@/types';
import { getDiskTypes, getDepartments } from '@/utils/mock';

const eventTypeConfig: Record<DisposalEventType, {
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  variant: any;
}> = {
  detected: { label: '扫描发现', color: 'text-info-700', bgColor: 'bg-info-50', icon: Scan, variant: 'info' as const },
  moved_to_recycle: { label: '移至待回收', color: 'text-warning-700', bgColor: 'bg-warning-50', icon: Trash2, variant: 'warning' as const },
  review_pending: { label: '待审核', color: 'text-info-700', bgColor: 'bg-info-50', icon: Clock, variant: 'info' as const },
  approved: { label: '审核通过', color: 'text-success-700', bgColor: 'bg-success-50', icon: CheckCircle2, variant: 'success' as const },
  rejected: { label: '审核驳回', color: 'text-danger-700', bgColor: 'bg-danger-50', icon: XCircle, variant: 'danger' as const },
  deleted: { label: '永久删除', color: 'text-danger-700', bgColor: 'bg-danger-50', icon: XCircle, variant: 'danger' as const },
  restored: { label: '恢复原位置', color: 'text-success-700', bgColor: 'bg-success-50', icon: CheckCircle2, variant: 'success' as const },
};

interface AuditRecord {
  fileId: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  department: string;
  sourceDisk: string;
  filePath: string;
  events: DisposalHistoryEvent[];
  firstSeen: string;
  lastAction: string;
  lastActionTime: string;
  finalStatus: string;
}

export default function Audit() {
  const { disposalHistory, allDuplicates, loading } = useAppStore();

  const [fileName, setFileName] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [sourceDisk, setSourceDisk] = useState<string>('');
  const [operationType, setOperationType] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [detailRecord, setDetailRecord] = useState<AuditRecord | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const DEPARTMENTS = getDepartments();

  // 从 allDuplicates 中查找文件 size
  const fileSizeMap = useMemo(() => {
    const m = new Map<string, number>();
    allDuplicates.forEach(g => {
      g.files.forEach(f => {
        m.set(f.id, f.size);
      });
    });
    return m;
  }, [allDuplicates]);

  const records = useMemo<AuditRecord[]>(() => {
    const fileMap = new Map<string, AuditRecord>();
    disposalHistory.forEach(event => {
      const existing = fileMap.get(event.fileId);
      const statusOrder: DisposalEventType[] = ['detected', 'moved_to_recycle', 'review_pending', 'rejected', 'approved', 'restored', 'deleted'];
      const getFinalStatus = (events: DisposalHistoryEvent[]) => {
        const ordered = [...events].sort((a, b) => statusOrder.indexOf(a.type) - statusOrder.indexOf(b.type));
        const last = ordered[ordered.length - 1];
        if (!last) return '未处理';
        return eventTypeConfig[last.type].label;
      };
      if (existing) {
        existing.events.push(event);
        const sorted = existing.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        existing.firstSeen = sorted[0].timestamp;
        const last = sorted[sorted.length - 1];
        existing.lastAction = eventTypeConfig[last.type].label;
        existing.lastActionTime = last.timestamp;
        existing.finalStatus = getFinalStatus(sorted);
      } else {
        const newRecord: AuditRecord = {
          fileId: event.fileId,
          fileName: event.fileName,
          fileHash: event.fileHash,
          fileSize: fileSizeMap.get(event.fileId) || 0,
          department: event.department,
          sourceDisk: event.sourceDisk,
          filePath: event.filePath,
          events: [event],
          firstSeen: event.timestamp,
          lastAction: eventTypeConfig[event.type].label,
          lastActionTime: event.timestamp,
          finalStatus: eventTypeConfig[event.type].label,
        };
        fileMap.set(event.fileId, newRecord);
      }
    });
    return Array.from(fileMap.values())
      .sort((a, b) => new Date(b.lastActionTime).getTime() - new Date(a.lastActionTime).getTime());
  }, [disposalHistory, fileSizeMap]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (fileName && !r.fileName.toLowerCase().includes(fileName.toLowerCase())) return false;
      if (fileHash && !r.fileHash.toLowerCase().includes(fileHash.toLowerCase())) return false;
      if (department && r.department !== department) return false;
      if (sourceDisk && r.sourceDisk !== sourceDisk) return false;
      if (operationType && !r.events.some(e => e.type === operationType)) return false;
      if (startTime) {
        const startTs = new Date(startTime).getTime();
        const lastTs = new Date(r.lastActionTime).getTime();
        if (lastTs < startTs) return false;
      }
      if (endTime) {
        const endTs = new Date(endTime).getTime() + 24 * 60 * 60 * 1000;
        const lastTs = new Date(r.lastActionTime).getTime();
        if (lastTs > endTs) return false;
      }
      return true;
    });
  }, [records, fileName, fileHash, department, sourceDisk, operationType, startTime, endTime]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  const resetFilters = () => {
    setFileName('');
    setFileHash('');
    setDepartment('');
    setSourceDisk('');
    setOperationType('');
    setStartTime('');
    setEndTime('');
    setPage(1);
  };

  const operationTypeOptions = Object.entries(eventTypeConfig).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  const departmentOptions = DEPARTMENTS;
  const diskOptions = getDiskTypes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary-600" />
          审计检索
        </h1>
        <p className="text-gray-500 mt-1">
          追溯文件从发现到最终处置的完整操作链路，支持多维度检索与合规审计
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FilterX className="w-4 h-4 text-gray-500" />
            检索条件
          </h2>
          <Button variant="ghost" size="sm" onClick={resetFilters} icon={<FilterX className="w-4 h-4" />}>
            重置条件
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件名</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="输入文件名关键词"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={fileName}
                onChange={(e) => { setFileName(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件哈希 (MD5)</label>
            <div className="relative">
              <FileSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="输入哈希值关键词"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={fileHash}
                onChange={(e) => { setFileHash(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属部门</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            >
              <option value="">全部部门</option>
              {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源盘</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={sourceDisk}
              onChange={(e) => { setSourceDisk(e.target.value); setPage(1); }}
            >
              <option value="">全部来源盘</option>
              {diskOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作类型（包含任一）</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={operationType}
              onChange={(e) => { setOperationType(e.target.value); setPage(1); }}
            >
              <option value="">全部操作</option>
              {operationTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <Badge variant="info" size="sm">
            共 {formatNumber(filteredRecords.length)} 条文件记录
          </Badge>
          <Badge variant="default" size="sm">
            含 {formatNumber(disposalHistory.length)} 条操作事件
          </Badge>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">文件名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">文件哈希</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">部门</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">来源盘</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">文件大小</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">链路长度</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">最终状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">首次发现</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">最后操作</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-primary-500" />
                    <p>加载审计记录中...</p>
                  </td>
                </tr>
              ) : pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-500">
                    <FileSearch className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>暂无符合条件的审计记录</p>
                    {filteredRecords.length === 0 && records.length > 0 && (
                      <p className="text-sm mt-1">请调整检索条件后重试</p>
                    )}
                  </td>
                </tr>
              ) : (
                pagedRecords.map((record) => {
                  const lastType = record.events[record.events.length - 1]?.type;
                  return (
                    <tr key={record.fileId} className="border-b border-gray-100 hover:bg-gray-50 animate-fade-in">
                      <td className="py-3 px-4">
                        <div className="max-w-[220px]">
                          <p className="font-medium text-gray-900 truncate" title={record.fileName}>
                            {record.fileName}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5" title={record.filePath}>
                            {record.filePath}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                          {record.fileHash.slice(0, 8)}...{record.fileHash.slice(-4)}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default" size="sm">{record.department}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{record.sourceDisk}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700 font-mono text-xs">{record.fileSize > 0 ? formatFileSize(record.fileSize) : '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold font-mono ${record.events.length >= 3 ? 'text-warning-600' : 'text-gray-700'}`}>
                          {record.events.length} 步
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            lastType === 'deleted' ? 'danger' :
                            lastType === 'restored' || lastType === 'approved' ? 'success' :
                            lastType === 'rejected' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {record.finalStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-500 font-mono">{formatDateTime(record.firstSeen)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-xs text-gray-700">{record.lastAction}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(record.lastActionTime)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => setDetailRecord(record)}
                        >
                          查看链路
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              第 {formatNumber((page - 1) * pageSize + 1)} - {formatNumber(Math.min(page * pageSize, filteredRecords.length))} 条 / 共 {formatNumber(filteredRecords.length)} 条
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm font-mono text-gray-600 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title={`文件处置完整链路：${detailRecord?.fileName || ''}`}
        size="xl"
      >
        {detailRecord && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">文件哈希</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-mono text-gray-700 break-all inline-block">
                    {detailRecord.fileHash}
                  </code>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">文件大小</p>
                  <p className="font-medium text-gray-900">{detailRecord.fileSize > 0 ? formatFileSize(detailRecord.fileSize) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">所属部门</p>
                  <p className="font-medium text-gray-900">{detailRecord.department}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">来源盘</p>
                  <p className="font-medium text-gray-900">{detailRecord.sourceDisk}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">完整路径</p>
                  <p className="font-medium text-gray-900 break-all font-mono text-xs">{detailRecord.filePath}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-primary-500" />
                操作时间线
                <Badge variant="info" size="sm">共 {detailRecord.events.length} 步</Badge>
              </h4>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                {detailRecord.events
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((event, index) => {
                    const cfg = eventTypeConfig[event.type];
                    const Icon = cfg.icon;
                    const isFirst = index === 0;
                    const isLast = index === detailRecord.events.length - 1;
                    return (
                      <div key={event.id} className="relative pl-12 pb-8 last:pb-0">
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                          isLast ? 'border-primary-100 ring-2 ring-primary-500' : 'border-white bg-gray-100'
                        } ${cfg.bgColor} ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`rounded-lg border p-4 ${isLast ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={cfg.variant} size="sm">
                                  第 {index + 1} 步 · {cfg.label}
                                </Badge>
                                {isFirst && <Badge variant="default" size="sm">起点</Badge>}
                                {isLast && <Badge variant="info" size="sm">当前状态</Badge>}
                              </div>
                              {event.remark && (
                                <p className="text-sm text-gray-700 mt-2">{event.remark}</p>
                              )}
                              {event.reason && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="text-gray-500">原因：</span>{event.reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-mono text-gray-600">{formatDateTime(event.timestamp)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(event.timestamp)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              操作人：{event.operator}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
