import type { DuplicateGroup, DepartmentReport, FileItem } from '@/types';
import { formatFileSize, formatDateTime } from './format';

export function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]): void {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const value = row[c.key];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  const csvContent = [header, ...rows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDuplicateGroups(groups: DuplicateGroup[], filename: string = '重复文件清单'): void {
  const flattened = groups.flatMap(group =>
    group.files.map((file, index) => ({
      groupId: group.id,
      hash: group.hash,
      fileCount: group.fileCount,
      totalSize: formatFileSize(group.totalSize),
      saveableSize: formatFileSize(group.saveableSize),
      department: group.department,
      sourceDisk: group.sourceDisk === 'department' ? '部门盘' : group.sourceDisk === 'project' ? '项目盘' : '归档盘',
      fileName: file.name,
      filePath: file.path,
      fileSize: formatFileSize(file.size),
      fileSizeBytes: file.size,
      fileType: file.fileType,
      createdBy: file.createdBy,
      createdAt: formatDateTime(file.createdAt),
      lastAccessedAt: formatDateTime(file.lastAccessedAt),
      isSuggestedKeep: file.id === group.suggestedKeepId ? '是' : '否',
      fileOrder: index + 1,
    }))
  );

  const columns = [
    { key: 'groupId', label: '组ID' },
    { key: 'hash', label: '哈希值(SHA-256)' },
    { key: 'fileCount', label: '文件数量' },
    { key: 'totalSize', label: '组总大小' },
    { key: 'saveableSize', label: '可节省空间' },
    { key: 'department', label: '所属部门' },
    { key: 'sourceDisk', label: '来源盘' },
    { key: 'fileOrder', label: '序号' },
    { key: 'fileName', label: '文件名' },
    { key: 'fileType', label: '文件类型' },
    { key: 'filePath', label: '完整路径' },
    { key: 'fileSize', label: '文件大小' },
    { key: 'fileSizeBytes', label: '大小(字节)' },
    { key: 'createdBy', label: '创建人' },
    { key: 'createdAt', label: '创建时间' },
    { key: 'lastAccessedAt', label: '最近访问时间' },
    { key: 'isSuggestedKeep', label: '建议保留' },
  ];

  exportToCSV(flattened, filename, columns);
}

export function exportDepartmentReports(reports: DepartmentReport[], filename: string = '部门整改清单'): void {
  const data = reports.map(r => ({
    rank: r.rank,
    name: r.name,
    duplicateCount: r.duplicateCount,
    duplicateSize: formatFileSize(r.duplicateSize),
    duplicateSizeBytes: r.duplicateSize,
    saveableSize: formatFileSize(r.saveableSize),
    saveableSizeBytes: r.saveableSize,
    fileCount: r.fileCount,
    duplicateRate: ((r.duplicateCount / r.fileCount) * 100).toFixed(2) + '%',
    pendingRecycleCount: r.pendingRecycleCount,
    pendingRecycleSize: formatFileSize(r.pendingRecycleSize),
    priority: r.rank <= 3 ? '重点整改' : r.rank <= 6 ? '关注' : '正常',
  }));

  const columns = [
    { key: 'rank', label: '排名' },
    { key: 'name', label: '部门名称' },
    { key: 'priority', label: '优先级' },
    { key: 'fileCount', label: '文件总数' },
    { key: 'duplicateCount', label: '重复文件组数' },
    { key: 'duplicateRate', label: '重复率' },
    { key: 'duplicateSize', label: '重复占用空间' },
    { key: 'duplicateSizeBytes', label: '重复空间(字节)' },
    { key: 'saveableSize', label: '可节省空间' },
    { key: 'saveableSizeBytes', label: '可节省(字节)' },
    { key: 'pendingRecycleCount', label: '待处置文件数' },
    { key: 'pendingRecycleSize', label: '待处置空间' },
  ];

  exportToCSV(data, filename, columns);
}

export function exportRecycleItems(items: { fileItem: FileItem; movedAt: string; movedBy: string; reason: string }[], filename: string = '待回收文件清单'): void {
  const data = items.map(item => ({
    fileName: item.fileItem.name,
    filePath: item.fileItem.path,
    fileSize: formatFileSize(item.fileItem.size),
    fileSizeBytes: item.fileItem.size,
    department: item.fileItem.department,
    sourceDisk: item.fileItem.sourceDisk === 'department' ? '部门盘' : item.fileItem.sourceDisk === 'project' ? '项目盘' : '归档盘',
    createdBy: item.fileItem.createdBy,
    createdAt: formatDateTime(item.fileItem.createdAt),
    lastAccessedAt: formatDateTime(item.fileItem.lastAccessedAt),
    movedAt: formatDateTime(item.movedAt),
    movedBy: item.movedBy,
    reason: item.reason,
    hash: item.fileItem.hash,
  }));

  const columns = [
    { key: 'fileName', label: '文件名' },
    { key: 'filePath', label: '完整路径' },
    { key: 'fileSize', label: '文件大小' },
    { key: 'fileSizeBytes', label: '大小(字节)' },
    { key: 'department', label: '所属部门' },
    { key: 'sourceDisk', label: '来源盘' },
    { key: 'createdBy', label: '创建人' },
    { key: 'createdAt', label: '创建时间' },
    { key: 'lastAccessedAt', label: '最近访问时间' },
    { key: 'movedAt', label: '移入待回收时间' },
    { key: 'movedBy', label: '操作人' },
    { key: 'reason', label: '移出原因' },
    { key: 'hash', label: '哈希值' },
  ];

  exportToCSV(data, filename, columns);
}
