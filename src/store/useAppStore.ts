import { create } from 'zustand';
import type {
  OverviewStats,
  DuplicateGroup,
  RecycleItem,
  DepartmentReport,
  ActivityLog,
  ScanProgress,
  FilterOptions,
} from '@/types';
import {
  generateOverviewStats,
  generateDuplicateGroups,
  generateRecycleItems,
  generateDepartmentReports,
  generateActivityLogs,
  getDiskTypes,
  delay,
} from '@/utils/mock';

interface AppState {
  overview: OverviewStats | null;
  duplicates: DuplicateGroup[];
  recycleItems: RecycleItem[];
  reports: DepartmentReport[];
  activities: ActivityLog[];
  loading: boolean;
  currentScan: ScanProgress | null;
  selectedFileIds: string[];
  filters: FilterOptions;
  expandedGroupIds: string[];

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
}

export const useAppStore = create<AppState>((set, get) => ({
  overview: null,
  duplicates: [],
  recycleItems: [],
  reports: [],
  activities: [],
  loading: false,
  currentScan: null,
  selectedFileIds: [],
  filters: {},
  expandedGroupIds: [],

  fetchOverview: async () => {
    set({ loading: true });
    await delay(800);
    set({ overview: generateOverviewStats(), loading: false });
  },

  fetchDuplicates: async (filters?: FilterOptions) => {
    set({ loading: true });
    await delay(1000);
    let data = generateDuplicateGroups(50);

    if (filters) {
      if (filters.department) {
        data = data.filter(d => d.department === filters.department);
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
    set({ loading: true });
    await delay(600);
    set({ recycleItems: generateRecycleItems(20), loading: false });
  },

  fetchReports: async () => {
    set({ loading: true });
    await delay(700);
    set({ reports: generateDepartmentReports(), loading: false });
  },

  fetchActivities: async () => {
    set({ loading: true });
    await delay(500);
    set({ activities: generateActivityLogs(15), loading: false });
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
          const { fetchDuplicates, addActivity } = get();
          fetchDuplicates();
          addActivity('scan', `完成${disk?.name || diskType}扫描，发现重复文件 ${Math.floor(Math.random() * 500) + 100} 组`);
          set({ currentScan: null });
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

    const { duplicates, addActivity } = get();
    const movedFiles: RecycleItem[] = [];

    duplicates.forEach(group => {
      group.files.forEach(file => {
        if (fileIds.includes(file.id)) {
          movedFiles.push({
            id: `recycle-${Date.now()}-${Math.random()}`,
            fileItem: file,
            movedAt: new Date().toISOString(),
            movedBy: '当前用户',
            reason,
            status: 'pending',
          });
        }
      });
    });

    set(state => ({
      recycleItems: [...movedFiles, ...state.recycleItems],
      selectedFileIds: [],
      loading: false,
    }));

    addActivity('move', `将 ${fileIds.length} 个文件移入待回收区`);
  },

  approveDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(1000);

    const { recycleItems, addActivity } = get();
    const approvedItems = recycleItems.filter(item => recycleItemIds.includes(item.id));
    const totalSize = approvedItems.reduce((sum, item) => sum + item.fileItem.size, 0);

    const formatSize = (bytes: number) => {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    set(state => ({
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      loading: false,
    }));

    addActivity('delete', `永久删除 ${recycleItemIds.length} 个文件，释放空间 ${formatSize(totalSize)}`);
    addActivity('approve', `审核通过 ${recycleItemIds.length} 个文件的删除申请`);
  },

  rejectDeletion: async (recycleItemIds: string[]) => {
    set({ loading: true });
    await delay(600);

    const { addActivity } = get();

    set(state => ({
      recycleItems: state.recycleItems.filter(item => !recycleItemIds.includes(item.id)),
      loading: false,
    }));

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
}));
