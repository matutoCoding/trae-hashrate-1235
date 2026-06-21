export type FileStatus = 'active' | 'pending_recycle' | 'recycled' | 'deleted' | 'restored';

export type DisposalEventType = 'detected' | 'moved_to_recycle' | 'review_pending' | 'approved' | 'rejected' | 'deleted' | 'restored';

export interface DisposalHistoryEvent {
  id: string;
  type: DisposalEventType;
  fileId: string;
  fileHash: string;
  fileName: string;
  filePath: string;
  department: string;
  sourceDisk: string;
  operator: string;
  timestamp: string;
  remark?: string;
  reason?: string;
}

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
  sourceDisk: string;
  detectedAt?: string;
  status: FileStatus;
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
  sourceDisk: string;
  detectedAt?: string;
}

export interface RecycleItem {
  id: string;
  fileItem: FileItem;
  movedAt: string;
  movedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  history: DisposalHistoryEvent[];
}

export interface DeletedItem {
  id: string;
  fileItem: FileItem;
  deletedAt: string;
  deletedBy: string;
  reason: string;
  history: DisposalHistoryEvent[];
}

export type RectificationStatus = 'pending' | 'confirmed' | 'rejected';

export interface RectificationItem {
  id: string;
  department: string;
  groupId: string;
  fileIds: string[];
  fileCount: number;
  totalSize: number;
  saveableSize: number;
  sourceDisk: string;
  sentAt: string;
  sentBy: string;
  status: RectificationStatus;
  confirmedAt?: string;
  confirmedBy?: string;
  rejectReason?: string;
  files: FileItem[];
}

export interface DepartmentReport {
  id: string;
  name: string;
  duplicateCount: number;
  duplicateSize: number;
  saveableSize: number;
  fileCount: number;
  rank: number;
  pendingRecycleCount: number;
  pendingRecycleSize: number;
  totalFileCount: number;
  duplicateRate: number;
  head: string;
  headEmail: string;
  rectificationCount: number;
  rectificationPending: number;
  rectificationConfirmed: number;
  rectificationRejected: number;
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
  pendingRecycleCount: number;
  pendingRecycleSize: number;
  totalDeletedCount: number;
  totalDeletedSize: number;
  totalFreedSpace: number;
}

export type ActivityType = 'scan' | 'move' | 'approve' | 'reject' | 'delete' | 'send_rectification' | 'confirm_rectification' | 'reject_rectification';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  operator: string;
  timestamp: string;
  department?: string;
  fileIds?: string[];
  groupIds?: string[];
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
  sourceDisk?: string;
  rectificationStatus?: RectificationStatus;
}

export interface BatchDisposalItem {
  groupId: string;
  fileIds: string[];
}

export interface BatchDisposalPlan {
  id: string;
  name: string;
  createdAt: string;
  items: BatchDisposalItem[];
  totalFileCount: number;
  totalSaveableSize: number;
  departments: string[];
  sourceDisks: string[];
  status: 'draft' | 'confirmed' | 'executed';
}

export interface PersistentState {
  allDuplicates: DuplicateGroup[];
  recycleItems: RecycleItem[];
  deletedItems: DeletedItem[];
  activities: ActivityLog[];
  disposalHistory: DisposalHistoryEvent[];
  rectificationItems: RectificationItem[];
  totalFreedSpace: number;
  initializedAt: string;
}
