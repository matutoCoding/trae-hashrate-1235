import { create } from 'zustand';
import type {
  OverviewStats,
  DuplicateGroup,
  RecycleItem,
  DepartmentReport,
  ActivityLog,
  ScanProgress,
  FilterOptions,
  BatchDisposalPlan,
  DisposalHistoryEvent,
  DeletedItem,
  RectificationItem,
  PersistentState,
  FileItem,
} from '@/types';
import {
  generateDuplicateGroups,
  generateRecycleItems,
  generateDepartmentReports,
  generateOverviewStats,
  generateActivityLogs,
  generateEmptyBatchPlan,
  getDiskTypes,
  delay,
  resetRandomSeed,
  generateDisposalHistoryEvent,
  generateRectificationItem,
  getDepartmentHead,
} from '@/utils/mock';

const STORAGE_KEY = 'hash-dedup-state-v1';
const CURRENT_OPERATOR = '当前用户';

interface AppState {
  isInitialized: boolean;
  overview: OverviewStats | null;
  duplicates: DuplicateGroup[];
  allDuplicates: DuplicateGroup[];
  recycleItems: RecycleItem[];
  deletedItems: DeletedItem[];
  reports: DepartmentReport[];
  activities: ActivityLog[];
  disposalHistory: DisposalHistoryEvent[];
  rectificationItems: RectificationItem[];
  totalFreedSpace: number;
  loading: boolean;
  currentScan: ScanProgress | null;
  selectedFileIds: string[];
  filters: FilterOptions;
  expandedGroupIds: string[];
  expandedReportIds: string[];
  batchPlan: BatchDisposalPlan | null;

  initializeData: () => Promise<void>;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  resetAllData: () => Promise<void>;
  recalculateDerivedData: () => void;

  fetchOverview: () => Promise<void>;
  fetchDuplicates: (filters?: FilterOptions) => Promise<void>;
  fetchRecycleItems: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchActivities: () => Promise<void>;

  startScan: (diskType: string) => Promise<void>;
  stopScan: () => void;

  moveToRecycle: (fileIds: string[], reason: string) => Promise<void>;
  approveDeletion: (recycleItemIds: string[]) => Promise<void>;
  rejectDeletion: (recycleItemIds: string[]) => Promise<void>;

  addDisposalHistory: (event: DisposalHistoryEvent) => void;
  getDisposalHistoryForFile: (fileId: string) => DisposalHistoryEvent[];
  getDisposalHistoryForDepartment: (department: string) => DisposalHistoryEvent[];

  sendRectification: (department: string, groupIds: string[], sentBy: string) => Promise<void>;
  confirmRectification: (rectificationId: string, confirmedBy: string) => Promise<void>;
  rejectRectification: (rectificationId: string, rejectReason: string, rejectedBy: string) => Promise<void>;
  getRectificationForDepartment: (department: string) => RectificationItem[];

  toggleFileSelection: (fileId: string) => void;
  clearFileSelection: () => void;
  selectAllFiles: (fileIds: string[]) => void;

  toggleGroupExpand: (groupId: string) => void;
  toggleReportExpand: (reportId: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;

  addActivity: (type: ActivityLog['type'], description: string, extra?: { department?: string; fileIds?: string[]; groupIds?: string[] }) => void;

  createBatchPlan: () => void;
  addToBatchPlan: (groupId: string, fileIds: string[]) => void;
  removeFromBatchPlan: (groupId: string, fileIds: string[]) => void;
  clearBatchPlan: () => void;
  executeBatchPlan: (reason: string) => Promise<void>;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  overview: null,
  duplicates: [],
  allDuplicates: [],
  recycleItems: [],
  deletedItems: [],
  reports: [],
  activities: [],
  disposalHistory: [],
  rectificationItems: [],
  totalFreedSpace: 0,
  loading: false,
  currentScan: null,
  selectedFileIds: [],
  filters: {},
  expandedGroupIds: [],
  expandedReportIds: [],
  batchPlan: null,

  saveToLocalStorage: () => {
    const state = get();
    const persistent: PersistentState = {
      allDuplicates: state.allDuplicates,
      recycleItems: state.recycleItems,
      deletedItems: state.deletedItems,
      activities: state.activities,
      disposalHistory: state.disposalHistory,
      rectificationItems: state.rectificationItems,
      totalFreedSpace: state.totalFreedSpace,
      initializedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },

  loadFromLocalStorage: (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const persistent: PersistentState = JSON.parse(saved);
      
      const reports = generateDepartmentReports(
        persistent.allDuplicates,
        persistent.recycleItems,
        persistent.rectificationItems,
        persistent.deletedItems
      );
      const overview = generateOverviewStats(
        persistent.allDuplicates,
        persistent.recycleItems,
        persistent.deletedItems,
        persistent.totalFreedSpace
      );

      set({
        isInitialized: true,
        allDuplicates: persistent.allDuplicates,
        duplicates: persistent.allDuplicates,
        recycleItems: persistent.recycleItems,
        deletedItems: persistent.deletedItems || [],
        activities: persistent.activities,
        disposalHistory: persistent.disposalHistory || [],
        rectificationItems: persistent.rectificationItems || [],
        totalFreedSpace: persistent.totalFreedSpace || 0,
        reports,
        overview,
      });

      return true;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return false;
    }
  },

  resetAllData: async () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      isInitialized: false,
      allDuplicates: [],
      duplicates: [],
      recycleItems: [],
      deletedItems: [],
      activities: [],
      disposalHistory: [],
      rectificationItems: [],
      totalFreedSpace: 0,
      reports: [],
      overview: null,
    });
    await get().initializeData();
  },

  initializeData: async () => {
    if (get().isInitialized) return;

    const loaded = get().loadFromLocalStorage();
    if (loaded) {
      return;
    }

    set({ loading: true });
    await delay(800);

    resetRandomSeed();
    const allDuplicates = generateDuplicateGroups(80);
    const { items: recycleItems, history: initialHistory } = generateRecycleItems(15);
    const activities = generateActivityLogs(20);
    
    allDuplicates.forEach(group => {
      group.files.forEach(file => {
        const detectedEvent = generateDisposalHistoryEvent(
          'detected',
          file,
          '系统',
          undefined,
          '哈希盘点发现重复文件'
        );
        detectedEvent.timestamp = group.detectedAt || file.detectedAt || detectedEvent.timestamp;
        initialHistory.push(detectedEvent);
      });
    });

    const reports = generateDepartmentReports(allDuplicates, recycleItems, [], []);
    const overview = generateOverviewStats(allDuplicates, recycleItems, [], 0);

    set({
      isInitialized: true,
      allDuplicates,
      duplicates: allDuplicates,
      recycleItems,
      deletedItems: [],
      disposalHistory: initialHistory,
      rectificationItems: [],
      totalFreedSpace: 0,
      activities,
      reports,
      overview,
      loading: false,
    });

    get().saveToLocalStorage();
  },

  recalculateDerivedData: () => {
    const { allDuplicates, recycleItems, rectificationItems, deletedItems, totalFreedSpace } = get();
    const reports = generateDepartmentReports(allDuplicates, recycleItems, rectificationItems, deletedItems);
    const overview = generateOverviewStats(allDuplicates, recycleItems, deletedItems, totalFreedSpace);
    set({ reports, overview });
    get().saveToLocalStorage();
  },

  fetchOverview: async () => {
    const { isInitialized, initializeData, recalculateDerivedData } = get();
    if (!isInitialized) {
      await initializeData();
      return;
    }
    recalculateDerivedData();
  },

  fetchDuplicates: async (filters?: FilterOptions) => {
    const { isInitialized, initializeData, allDuplicates } = get();
    if (!isInitialized) {
      await initializeData();
    }

    set({ loading: true });
    await delay(300);

    let data = get().allDuplicates;

    if (filters) {
      if (filters.department) {
        data = data.filter(d => d.department === filters.department);
      }
      if (filters.sourceDisk) {
        data = data.filter(d => d.sourceDisk === filters.sourceDisk);
      }
      if (filters.minDuplicates) {
        data = data.filter(d => d.fileCount >= filters.minDuplicates!);
      }
      if (filters.minSize) {
        data = data.filter(d => d.saveableSize >= filters.minSize!);
      }
      if (filters.maxSize) {
        data = data.filter(d => d.saveableSize <= filters.maxSize!);
      }
      if (filters.fileType) {
        data = data.filter(d =>
          d.files.some(f => f.fileType === filters.fileType)
        );
      }
    }

    set({ duplicates: data, filters: filters || {}, loading: false });
  },

  fetchRecycleItems: async () => {
    const { isInitialized, initializeData } = get();
    if (!isInitialized) {
      await initializeData();
    }
  },

  fetchReports: async () => {
    const { isInitialized, initializeData, recalculateDerivedData } = get();
    if (!isInitialized) {
      await initializeData();
      return;
    }
    recalculateDerivedData();
  },

  fetchActivities: async () => {
    const { isInitialized, initializeData } = get();
    if (!isInitialized) {
      await initializeData();
    }
  },

  startScan: async (diskType: string) => {
    const disk = getDiskTypes().find(d => d.id === diskType);
    const totalFiles = Math.floor(Math.random() * 20000) + 10000;

    set({
      currentScan: {
        isScanning: true,
        diskType: disk?.name || diskType,
        currentFile: '扫描中...',
        processedFiles: 0,
        totalFiles,
        percentage: 0,
      },
    });

    const scanInterval = setInterval(() => {
      const current = get().currentScan;
      if (!current || !current.isScanning) {
        clearInterval(scanInterval);
        return;
      }

      const increment = Math.floor(Math.random() * 200) + 50;
      const newProcessed = Math.min(current.processedFiles + increment, current.totalFiles);
      const percentage = (newProcessed / current.totalFiles) * 100;

      const mockFiles = [
        `/${diskType === 'department' ? '研发部' : diskType === 'project' ? '项目盘' : '归档盘'}/技术文档/API规范.pdf`,
        `/${diskType === 'department' ? '市场部' : diskType === 'project' ? '项目盘' : '归档盘'}/品牌素材/logo设计.psd`,
        `/${diskType === 'department' ? '财务部' : diskType === 'project' ? '项目盘' : '归档盘'}/财务报表/2024年度审计报告.xlsx`,
      ];

      set({
        currentScan: {
          ...current,
          processedFiles: newProcessed,
          percentage,
          currentFile: mockFiles[Math.floor(Math.random() * mockFiles.length)],
        },
      });

      if (newProcessed >= current.totalFiles) {
        clearInterval(scanInterval);
        setTimeout(() => {
          const { addActivity, allDuplicates, disposalHistory } = get();
          
          resetRandomSeed();
          const newGroups = generateDuplicateGroups(15).map(g => ({
            ...g,
            sourceDisk: diskType,
            detectedAt: new Date().toISOString(),
            files: g.files.map(f => ({
              ...f,
              sourceDisk: diskType,
              detectedAt: new Date().toISOString(),
              status: 'active' as const,
            })),
          }));

          const newHistory: DisposalHistoryEvent[] = [];
          newGroups.forEach(group => {
            group.files.forEach(file => {
              const detectedEvent = generateDisposalHistoryEvent(
                'detected',
                file,
                '系统',
                undefined,
                `${disk?.name || diskType}扫描发现重复文件`
              );
              detectedEvent.timestamp = group.detectedAt || file.detectedAt || detectedEvent.timestamp;
              newHistory.push(detectedEvent);
            });
          });

          const updatedDuplicates = [...newGroups, ...allDuplicates].sort((a, b) => b.saveableSize - a.saveableSize);
          const updatedHistory = [...newHistory, ...disposalHistory];
          
          set({ 
            allDuplicates: updatedDuplicates, 
            duplicates: updatedDuplicates, 
            currentScan: null,
            disposalHistory: updatedHistory,
          });
          get().recalculateDerivedData();
          addActivity('scan', `完成${disk?.name || diskType}扫描，新增重复文件 ${newGroups.length} 组`);
        }, 500);
      }
    }, 300);
  },

  stopScan: () => {
    set({ currentScan: null });
  },

  addDisposalHistory: (event: DisposalHistoryEvent) => {
    set(state => ({
      disposalHistory: [event, ...state.disposalHistory],
    }));
  },

  getDisposalHistoryForFile: (fileId: string) => {
    return get().disposalHistory.filter(h => h.fileId === fileId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getDisposalHistoryForDepartment: (department: string) => {
    return get().disposalHistory.filter(h => h.department === department)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  moveToRecycle: async (fileIds: string[], reason: string) => {
    set({ loading: true });
    await delay(800);

    const { allDuplicates, addActivity, disposalHistory } = get();
    const movedItems: RecycleItem[] = [];
    const movedFileIds = new Set(fileIds);
    const newHistory: DisposalHistoryEvent[] = [];

    allDuplicates.forEach(group => {
      group.files.forEach(file => {
        if (movedFileIds.has(file.id)) {
          const fileWithStatus: FileItem = { ...file, status: 'pending_recycle' };
          
          const historyEvent = generateDisposalHistoryEvent(
            'moved_to_recycle',
            file,
            CURRENT_OPERATOR,
            reason,
            '移入待回收区'
          );
          
          const detectedEvents = disposalHistory.filter(
            h => h.fileId === file.id && h.type === 'detected'
          );
          
          movedItems.push({
            id: `recycle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            fileItem: fileWithStatus,
            movedAt: new Date().toISOString(),
            movedBy: CURRENT_OPERATOR,
            reason,
            status: 'pending',
            history: [...detectedEvents, historyEvent],
          });
          
          newHistory.push(historyEvent);
        }
      });
    });

    const updatedDuplicates = allDuplicates.map(group => {
      const remainingFiles = group.files.filter(f => !movedFileIds.has(f.id));
      const fileCount = remainingFiles.length;
      if (fileCount === 0) return null;
      
      const fileSize = remainingFiles[0].size;
      const totalSize = fileSize * fileCount;
      const saveableSize = fileCount > 1 ? fileSize * (fileCount - 1) : 0;
      
      let suggestedKeepId = group.suggestedKeepId;
      if (!remainingFiles.find(f => f.id === suggestedKeepId)) {
        suggestedKeepId = remainingFiles[0].id;
      }

      return {
        ...group,
        files: remainingFiles,
        fileCount,
        totalSize,
        saveableSize,
        suggestedKeepId,
      };
    }).filter(Boolean) as DuplicateGroup[];

    set(state => ({
      allDuplicates: updatedDuplicates,
      duplicates: updatedDuplicates,
      recycleItems: [...movedItems, ...state.recycleItems],
      disposalHistory: [...newHistory, ...state.disposalHistory],
      selectedFileIds: [],
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('move', `将 ${fileIds.length} 个文件移入待回收区，预计释放 ${formatSize(movedItems.reduce((s, f) => s + f.fileItem.size, 0))}`, {
      fileIds,
    });
  },

  approveDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(1000);

    const { recycleItems, addActivity, disposalHistory } = get();
    const approvedItems = recycleItems.filter(item => recycleItemIds.includes(item.id));
    const totalSize = approvedItems.reduce((sum, item) => sum + item.fileItem.size, 0);
    
    const deletedItems: DeletedItem[] = [];
    const newHistory: DisposalHistoryEvent[] = [];

    approvedItems.forEach(item => {
      const approvedEvent = generateDisposalHistoryEvent(
        'approved',
        item.fileItem,
        CURRENT_OPERATOR,
        item.reason,
        '审核通过，准备删除'
      );
      
      const deletedEvent = generateDisposalHistoryEvent(
        'deleted',
        item.fileItem,
        CURRENT_OPERATOR,
        item.reason,
        '已永久删除'
      );

      const fileWithStatus: FileItem = { ...item.fileItem, status: 'deleted' };

      deletedItems.push({
        id: `deleted-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fileItem: fileWithStatus,
        deletedAt: deletedEvent.timestamp,
        deletedBy: CURRENT_OPERATOR,
        reason: item.reason,
        history: [...item.history, approvedEvent, deletedEvent],
      });

      newHistory.push(approvedEvent, deletedEvent);
    });

    set(state => ({
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      deletedItems: [...deletedItems, ...state.deletedItems],
      disposalHistory: [...newHistory, ...state.disposalHistory],
      totalFreedSpace: state.totalFreedSpace + totalSize,
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('delete', `永久删除 ${recycleItemIds.length} 个文件，释放空间 ${formatSize(totalSize)}`, {
      fileIds: approvedItems.map(i => i.fileItem.id),
    });
    addActivity('approve', `审核通过 ${recycleItemIds.length} 个文件的删除申请`, {
      fileIds: approvedItems.map(i => i.fileItem.id),
    });
  },

  rejectDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(600);

    const { recycleItems, addActivity, allDuplicates, disposalHistory } = get();
    const rejectedItems = recycleItems.filter(item => recycleItemIds.includes(item.id));
    
    const updatedDuplicates = [...allDuplicates];
    const newHistory: DisposalHistoryEvent[] = [];
    
    rejectedItems.forEach(item => {
      const file = item.fileItem;
      
      const rejectedEvent = generateDisposalHistoryEvent(
        'rejected',
        file,
        CURRENT_OPERATOR,
        item.reason,
        '驳回删除申请，已恢复'
      );
      
      const restoredEvent = generateDisposalHistoryEvent(
        'restored',
        file,
        CURRENT_OPERATOR,
        undefined,
        '文件已恢复至原路径'
      );
      
      newHistory.push(rejectedEvent, restoredEvent);
      
      const fileWithStatus: FileItem = { ...file, status: 'active' };
      
      const existingGroup = updatedDuplicates.find(g => g.hash === file.hash);
      
      if (existingGroup) {
        const alreadyExists = existingGroup.files.some(f => f.id === file.id);
        if (!alreadyExists) {
          existingGroup.files.push(fileWithStatus);
          existingGroup.fileCount = existingGroup.files.length;
          existingGroup.totalSize = existingGroup.files[0].size * existingGroup.fileCount;
          existingGroup.saveableSize = existingGroup.files[0].size * (existingGroup.fileCount - 1);
        }
      } else {
        updatedDuplicates.push({
          id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          hash: file.hash,
          fileCount: 1,
          totalSize: file.size,
          saveableSize: 0,
          files: [fileWithStatus],
          suggestedKeepId: file.id,
          department: file.department,
          sourceDisk: file.sourceDisk,
          detectedAt: new Date().toISOString(),
        });
      }
    });

    updatedDuplicates.sort((a, b) => b.saveableSize - a.saveableSize);

    set(state => ({
      allDuplicates: updatedDuplicates,
      duplicates: updatedDuplicates,
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      disposalHistory: [...newHistory, ...state.disposalHistory],
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('reject', `恢复 ${recycleItemIds.length} 个文件至原路径`, {
      fileIds: rejectedItems.map(i => i.fileItem.id),
    });
  },

  sendRectification: async (department: string, groupIds: string[], sentBy: string) => {
    set({ loading: true });
    await delay(500);

    const { allDuplicates, rectificationItems, addActivity } = get();
    const newItems: RectificationItem[] = [];

    groupIds.forEach(groupId => {
      const group = allDuplicates.find(g => g.id === groupId);
      if (group && group.department === department) {
        const redundantFileIds = group.files
          .filter(f => f.id !== group.suggestedKeepId && f.status === 'active')
          .map(f => f.id);
        
        if (redundantFileIds.length > 0) {
          newItems.push(generateRectificationItem(group, redundantFileIds, sentBy));
        }
      }
    });

    set(state => ({
      rectificationItems: [...newItems, ...state.rectificationItems],
      loading: false,
    }));

    get().recalculateDerivedData();
    
    const head = getDepartmentHead(department);
    addActivity('send_rectification', `向 ${department}(${head.name}) 发送整改清单，涉及 ${newItems.length} 组重复文件`, {
      department,
      groupIds: newItems.map(i => i.groupId),
    });
  },

  confirmRectification: async (rectificationId: string, confirmedBy: string) => {
    set({ loading: true });
    await delay(500);

    const { rectificationItems, addActivity } = get();
    
    set(state => ({
      rectificationItems: state.rectificationItems.map(item =>
        item.id === rectificationId
          ? {
              ...item,
              status: 'confirmed' as const,
              confirmedAt: new Date().toISOString(),
              confirmedBy,
            }
          : item
      ),
      loading: false,
    }));

    const item = rectificationItems.find(i => i.id === rectificationId);
    if (item) {
      addActivity('confirm_rectification', `${item.department} 确认整改清单，同意清理 ${item.fileCount} 个文件`, {
        department: item.department,
        groupIds: [item.groupId],
        fileIds: item.fileIds,
      });
    }

    get().recalculateDerivedData();
  },

  rejectRectification: async (rectificationId: string, rejectReason: string, rejectedBy: string) => {
    set({ loading: true });
    await delay(500);

    const { rectificationItems, addActivity } = get();
    
    set(state => ({
      rectificationItems: state.rectificationItems.map(item =>
        item.id === rectificationId
          ? {
              ...item,
              status: 'rejected' as const,
              confirmedAt: new Date().toISOString(),
              confirmedBy: rejectedBy,
              rejectReason,
            }
          : item
      ),
      loading: false,
    }));

    const item = rectificationItems.find(i => i.id === rectificationId);
    if (item) {
      addActivity('reject_rectification', `${item.department} 驳回整改清单：${rejectReason}`, {
        department: item.department,
        groupIds: [item.groupId],
      });
    }

    get().recalculateDerivedData();
  },

  getRectificationForDepartment: (department: string) => {
    return get().rectificationItems
      .filter(item => item.department === department)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  toggleFileSelection: (fileId: string) => {
    set(state => ({
      selectedFileIds: state.selectedFileIds.includes(fileId)
        ? state.selectedFileIds.filter(id => id !== fileId)
        : [...state.selectedFileIds, fileId],
    }));
  },

  clearFileSelection: () => {
    set({ selectedFileIds: [] });
  },

  selectAllFiles: (fileIds: string[]) => {
    const { selectedFileIds } = get();
    const allSelected = fileIds.every(id => selectedFileIds.includes(id));
    if (allSelected) {
      set({ selectedFileIds: selectedFileIds.filter(id => !fileIds.includes(id)) });
    } else {
      const newSelected = [...new Set([...selectedFileIds, ...fileIds])];
      set({ selectedFileIds: newSelected });
    }
  },

  toggleGroupExpand: (groupId: string) => {
    set(state => ({
      expandedGroupIds: state.expandedGroupIds.includes(groupId)
        ? state.expandedGroupIds.filter(id => id !== groupId)
        : [...state.expandedGroupIds, groupId],
    }));
  },

  toggleReportExpand: (reportId: string) => {
    set(state => ({
      expandedReportIds: state.expandedReportIds.includes(reportId)
        ? state.expandedReportIds.filter(id => id !== reportId)
        : [...state.expandedReportIds, reportId],
    }));
  },

  setFilters: (filters: Partial<FilterOptions>) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  addActivity: (type: ActivityLog['type'], description: string, extra?: { department?: string; fileIds?: string[]; groupIds?: string[] }) => {
    const newActivity: ActivityLog = {
      id: `activity-${Date.now()}`,
      type,
      description,
      operator: CURRENT_OPERATOR,
      timestamp: new Date().toISOString(),
      ...extra,
    };
    set(state => ({ activities: [newActivity, ...state.activities].slice(0, 50) }));
    get().saveToLocalStorage();
  },

  createBatchPlan: () => {
    set({ batchPlan: generateEmptyBatchPlan() });
  },

  addToBatchPlan: (groupId: string, fileIds: string[]) => {
    set(state => {
      if (!state.batchPlan) return state;

      const existingItem = state.batchPlan.items.find(i => i.groupId === groupId);
      let newItems: typeof state.batchPlan.items;

      if (existingItem) {
        const mergedFileIds = [...new Set([...existingItem.fileIds, ...fileIds])];
        newItems = state.batchPlan.items.map(i =>
          i.groupId === groupId ? { ...i, fileIds: mergedFileIds } : i
        );
      } else {
        newItems = [...state.batchPlan.items, { groupId, fileIds }];
      }

      const totalFileCount = newItems.reduce((sum, i) => sum + i.fileIds.length, 0);
      const groups = state.allDuplicates.filter(g => newItems.some(i => i.groupId === g.id));
      let totalSaveableSize = 0;
      const deptSet = new Set<string>();
      const diskSet = new Set<string>();

      groups.forEach(group => {
        const item = newItems.find(i => i.groupId === group.id);
        if (item) {
          const perFileSize = group.files[0]?.size || 0;
          totalSaveableSize += perFileSize * item.fileIds.length;
          deptSet.add(group.department);
          diskSet.add(group.sourceDisk);
        }
      });

      return {
        batchPlan: {
          ...state.batchPlan,
          items: newItems,
          totalFileCount,
          totalSaveableSize,
          departments: Array.from(deptSet),
          sourceDisks: Array.from(diskSet),
        },
      };
    });
  },

  removeFromBatchPlan: (groupId: string, fileIds: string[]) => {
    set(state => {
      if (!state.batchPlan) return state;

      const newItems = state.batchPlan.items
        .map(item => {
          if (item.groupId !== groupId) return item;
          const remainingIds = item.fileIds.filter(id => !fileIds.includes(id));
          if (remainingIds.length === 0) return null;
          return { ...item, fileIds: remainingIds };
        })
        .filter(Boolean) as typeof state.batchPlan.items;

      const totalFileCount = newItems.reduce((sum, i) => sum + i.fileIds.length, 0);
      const groups = state.allDuplicates.filter(g => newItems.some(i => i.groupId === g.id));
      let totalSaveableSize = 0;
      const deptSet = new Set<string>();
      const diskSet = new Set<string>();

      groups.forEach(group => {
        const item = newItems.find(i => i.groupId === group.id);
        if (item) {
          const perFileSize = group.files[0]?.size || 0;
          totalSaveableSize += perFileSize * item.fileIds.length;
          deptSet.add(group.department);
          diskSet.add(group.sourceDisk);
        }
      });

      return {
        batchPlan: {
          ...state.batchPlan,
          items: newItems,
          totalFileCount,
          totalSaveableSize,
          departments: Array.from(deptSet),
          sourceDisks: Array.from(diskSet),
        },
      };
    });
  },

  clearBatchPlan: () => {
    set({ batchPlan: null });
  },

  executeBatchPlan: async (reason: string) => {
    const { batchPlan, moveToRecycle } = get();
    if (!batchPlan) return;

    const allFileIds = batchPlan.items.flatMap(i => i.fileIds);
    await moveToRecycle(allFileIds, reason);
    
    set({ batchPlan: null });
  },
}));
