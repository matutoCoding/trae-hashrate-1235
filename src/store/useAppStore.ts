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
} from '@/utils/mock';

interface AppState {
  isInitialized: boolean;
  overview: OverviewStats | null;
  duplicates: DuplicateGroup[];
  allDuplicates: DuplicateGroup[];
  recycleItems: RecycleItem[];
  reports: DepartmentReport[];
  activities: ActivityLog[];
  loading: boolean;
  currentScan: ScanProgress | null;
  selectedFileIds: string[];
  filters: FilterOptions;
  expandedGroupIds: string[];
  batchPlan: BatchDisposalPlan | null;

  initializeData: () => Promise<void>;
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

  toggleFileSelection: (fileId: string) => void;
  clearFileSelection: () => void;
  selectAllFiles: (fileIds: string[]) => void;

  toggleGroupExpand: (groupId: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;

  addActivity: (type: ActivityLog['type'], description: string) => void;

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
  reports: [],
  activities: [],
  loading: false,
  currentScan: null,
  selectedFileIds: [],
  filters: {},
  expandedGroupIds: [],
  batchPlan: null,

  initializeData: async () => {
    if (get().isInitialized) return;
    
    set({ loading: true });
    await delay(800);

    resetRandomSeed();
    const allDuplicates = generateDuplicateGroups(80);
    const recycleItems = generateRecycleItems(15);
    const activities = generateActivityLogs(20);
    const reports = generateDepartmentReports(allDuplicates, recycleItems);
    const overview = generateOverviewStats(allDuplicates, recycleItems);

    set({
      isInitialized: true,
      allDuplicates,
      duplicates: allDuplicates,
      recycleItems,
      activities,
      reports,
      overview,
      loading: false,
    });
  },

  recalculateDerivedData: () => {
    const { allDuplicates, recycleItems } = get();
    const reports = generateDepartmentReports(allDuplicates, recycleItems);
    const overview = generateOverviewStats(allDuplicates, recycleItems);
    set({ reports, overview });
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
        '/研发部/技术文档/API规范.pdf',
        '/市场部/品牌素材/logo设计.psd',
        '/财务部/财务报表/2024年度审计报告.xlsx',
        '/人力资源部/员工档案/入职材料.docx',
        '/项目盘/产品需求文档/PRD-v3.docx',
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
          const { addActivity, allDuplicates } = get();
          const newGroups = generateDuplicateGroups(30).map(g => ({
            ...g,
            sourceDisk: diskType,
          }));
          const updatedDuplicates = [...newGroups, ...allDuplicates].sort((a, b) => b.saveableSize - a.saveableSize);
          
          set({ allDuplicates: updatedDuplicates, duplicates: updatedDuplicates, currentScan: null });
          get().recalculateDerivedData();
          addActivity('scan', `完成${disk?.name || diskType}扫描，新增重复文件 ${newGroups.length} 组`);
        }, 500);
      }
    }, 300);
  },

  stopScan: () => {
    set({ currentScan: null });
  },

  moveToRecycle: async (fileIds: string[], reason: string) => {
    set({ loading: true });
    await delay(800);

    const { allDuplicates, addActivity } = get();
    const movedFiles: RecycleItem[] = [];
    const movedFileIds = new Set(fileIds);

    allDuplicates.forEach(group => {
      group.files.forEach(file => {
        if (movedFileIds.has(file.id)) {
          movedFiles.push({
            id: `recycle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            fileItem: file,
            movedAt: new Date().toISOString(),
            movedBy: '当前用户',
            reason,
            status: 'pending',
          });
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
      recycleItems: [...movedFiles, ...state.recycleItems],
      selectedFileIds: [],
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('move', `将 ${fileIds.length} 个文件移入待回收区，预计释放 ${formatSize(movedFiles.reduce((s, f) => s + f.fileItem.size, 0))}`);
  },

  approveDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(1000);

    const { recycleItems, addActivity } = get();
    const approvedItems = recycleItems.filter(item => recycleItemIds.includes(item.id));
    const totalSize = approvedItems.reduce((sum, item) => sum + item.fileItem.size, 0);

    set(state => ({
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('delete', `永久删除 ${recycleItemIds.length} 个文件，释放空间 ${formatSize(totalSize)}`);
    addActivity('approve', `审核通过 ${recycleItemIds.length} 个文件的删除申请`);
  },

  rejectDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(600);

    const { recycleItems, addActivity, allDuplicates } = get();
    const rejectedItems = recycleItems.filter(item => recycleItemIds.includes(item.id));
    
    const updatedDuplicates = [...allDuplicates];
    
    rejectedItems.forEach(item => {
      const file = item.fileItem;
      const existingGroup = updatedDuplicates.find(g => g.hash === file.hash);
      
      if (existingGroup) {
        const alreadyExists = existingGroup.files.some(f => f.id === file.id);
        if (!alreadyExists) {
          existingGroup.files.push(file);
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
          files: [file],
          suggestedKeepId: file.id,
          department: file.department,
          sourceDisk: file.sourceDisk,
        });
      }
    });

    updatedDuplicates.sort((a, b) => b.saveableSize - a.saveableSize);

    set(state => ({
      allDuplicates: updatedDuplicates,
      duplicates: updatedDuplicates,
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      loading: false,
    }));

    get().recalculateDerivedData();
    addActivity('reject', `恢复 ${recycleItemIds.length} 个文件至原路径`);
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

  setFilters: (filters: Partial<FilterOptions>) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  addActivity: (type: ActivityLog['type'], description: string) => {
    const newActivity: ActivityLog = {
      id: `activity-${Date.now()}`,
      type,
      description,
      operator: '当前用户',
      timestamp: new Date().toISOString(),
    };
    set(state => ({ activities: [newActivity, ...state.activities].slice(0, 50) }));
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
