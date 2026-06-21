export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  hash: string;
  createdAt: string;
  lastAccessedAt: string;
  createdBy: string;
  department: string;
  fileType: string;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  fileCount: number;
  totalSize: number;
  saveableSize: number;
  files: FileItem[];
  suggestedKeepId: string;
  department: string;
}

export interface RecycleItem {
  id: string;
  fileItem: FileItem;
  movedAt: string;
  movedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DepartmentReport {
  id: string;
  name: string;
  duplicateCount: number;
  duplicateSize: number;
  saveableSize: number;
  fileCount: number;
  rank: number;
}

export interface DailyTrend {
  date: string;
  duplicateGroups: number;
  saveableSpace: number;
}

export interface DepartmentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface OverviewStats {
  totalDuplicateGroups: number;
  totalSaveableSpace: number;
  involvedDepartments: number;
  topDuplicateSource: string;
  trend: DailyTrend[];
  departmentDistribution: DepartmentDistribution[];
}

export type ActivityType = 'scan' | 'move' | 'approve' | 'reject' | 'delete';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  operator: string;
  timestamp: string;
}

export interface ScanProgress {
  isScanning: boolean;
  diskType: string;
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  percentage: number;
}

export interface DiskType {
  id: string;
  name: string;
  description: string;
  icon: string;
  totalSize: number;
  usedSize: number;
}

export interface FilterOptions {
  department?: string;
  fileType?: string;
  minSize?: number;
  maxSize?: number;
  minDuplicates?: number;
}
