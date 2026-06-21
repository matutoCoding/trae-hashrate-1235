import type {
  FileItem,
  DuplicateGroup,
  RecycleItem,
  DepartmentReport,
  OverviewStats,
  ActivityLog,
  DiskType,
  DailyTrend,
  DepartmentDistribution,
  BatchDisposalPlan,
  DisposalHistoryEvent,
  DeletedItem,
  RectificationItem,
} from '@/types';

const FIXED_SEED = 20240101;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = mulberry32(FIXED_SEED);

export function resetRandomSeed() {
  rng = mulberry32(FIXED_SEED);
}

const departments = ['研发部', '市场部', '财务部', '人力资源部', '法务部', '行政部', '产品部', '运营部'];

const departmentHeads: Record<string, { name: string; email: string }> = {
  '研发部': { name: '王强', email: 'wangqiang@company.com' },
  '市场部': { name: '李娜', email: 'lina@company.com' },
  '财务部': { name: '张伟', email: 'zhangwei@company.com' },
  '人力资源部': { name: '刘芳', email: 'liufang@company.com' },
  '法务部': { name: '陈明', email: 'chenming@company.com' },
  '行政部': { name: '杨洋', email: 'yangyang@company.com' },
  '产品部': { name: '赵磊', email: 'zhaolei@company.com' },
  '运营部': { name: '周婷', email: 'zhouting@company.com' },
};

const users = ['张伟', '李娜', '王强', '刘芳', '陈明', '杨洋', '赵磊', '周婷', '吴静', '郑浩'];
const fileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'mp4', 'zip'];
const sourceDisks = ['department', 'project', 'archive'];
const sourceDiskNames: Record<string, string> = {
  department: '部门盘',
  project: '项目盘',
  archive: '归档盘',
};

export function getDepartmentHead(dept: string) {
  return departmentHeads[dept] || { name: '待定', email: 'pending@company.com' };
}

function generateId(): string {
  return rng().toString(36).substring(2, 15) + rng().toString(36).substring(2, 15);
}

function generateHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(rng() * chars.length)];
  }
  return hash;
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + rng() * (end.getTime() - start.getTime())).toISOString();
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFileSize(fileType: string): number {
  const sizeRanges: Record<string, [number, number]> = {
    pdf: [1024 * 1024, 50 * 1024 * 1024],
    docx: [50 * 1024, 10 * 1024 * 1024],
    xlsx: [100 * 1024, 20 * 1024 * 1024],
    pptx: [500 * 1024, 100 * 1024 * 1024],
    jpg: [500 * 1024, 10 * 1024 * 1024],
    png: [500 * 1024, 10 * 1024 * 1024],
    mp4: [50 * 1024 * 1024, 500 * 1024 * 1024],
    zip: [10 * 1024 * 1024, 200 * 1024 * 1024],
  };
  const range = sizeRanges[fileType] || [1024 * 1024, 50 * 1024 * 1024];
  return randomInt(range[0], range[1]);
}

const diskTypes: DiskType[] = [
  { id: 'department', name: '部门盘', description: '各部门工作目录', icon: 'folder-tree', totalSize: 10 * 1024 * 1024 * 1024 * 1024, usedSize: 6.5 * 1024 * 1024 * 1024 * 1024 },
  { id: 'project', name: '项目盘', description: '项目协作共享空间', icon: 'briefcase', totalSize: 5 * 1024 * 1024 * 1024 * 1024, usedSize: 3.2 * 1024 * 1024 * 1024 * 1024 },
  { id: 'archive', name: '归档盘', description: '历史资料归档存储', icon: 'archive', totalSize: 20 * 1024 * 1024 * 1024 * 1024, usedSize: 12.8 * 1024 * 1024 * 1024 * 1024 },
];

const basePathsByDeptAndDisk: Record<string, Record<string, string[]>> = {
  '研发部': {
    department: ['/研发部/技术文档', '/研发部/代码仓库', '/研发部/设计文档'],
    project: ['/项目盘/研发项目/技术方案', '/项目盘/研发项目/接口文档'],
    archive: ['/归档盘/研发归档/历史版本', '/归档盘/研发归档/项目复盘'],
  },
  '市场部': {
    department: ['/市场部/营销方案', '/市场部/品牌素材', '/市场部/活动策划'],
    project: ['/项目盘/市场项目/推广方案', '/项目盘/市场项目/素材库'],
    archive: ['/归档盘/市场归档/历年活动', '/归档盘/市场归档/品牌资料'],
  },
  '财务部': {
    department: ['/财务部/财务报表', '/财务部/税务资料', '/财务部/审计档案'],
    project: ['/项目盘/财务项目/预算编制', '/项目盘/财务项目/成本核算'],
    archive: ['/归档盘/财务归档/年度报表', '/归档盘/财务归档/审计报告'],
  },
  '人力资源部': {
    department: ['/人力资源部/员工档案', '/人力资源部/招聘资料', '/人力资源部/培训材料'],
    project: ['/项目盘/HR项目/组织发展', '/项目盘/HR项目/薪酬体系'],
    archive: ['/归档盘/HR归档/离职档案', '/归档盘/HR归档/历史制度'],
  },
  '法务部': {
    department: ['/法务部/合同模板', '/法务部/法律意见书', '/法务部/诉讼档案'],
    project: ['/项目盘/法务项目/合规审查', '/项目盘/法务项目/知识产权'],
    archive: ['/归档盘/法务归档/合同原件', '/归档盘/法务归档/涉诉材料'],
  },
  '行政部': {
    department: ['/行政部/办公制度', '/行政部/固定资产', '/行政部/会议纪要'],
    project: ['/项目盘/行政项目/办公室搬迁', '/项目盘/行政项目/采购管理'],
    archive: ['/归档盘/行政归档/制度文件', '/归档盘/行政归档/会议记录'],
  },
  '产品部': {
    department: ['/产品部/需求文档', '/产品部/原型设计', '/产品部/竞品分析'],
    project: ['/项目盘/产品项目/PRD文档', '/项目盘/产品项目/用户研究'],
    archive: ['/归档盘/产品归档/历史版本', '/归档盘/产品归档/市场调研'],
  },
  '运营部': {
    department: ['/运营部/运营计划', '/运营部/数据分析', '/运营部/用户反馈'],
    project: ['/项目盘/运营项目/活动运营', '/项目盘/运营项目/用户增长'],
    archive: ['/归档盘/运营归档/活动数据', '/归档盘/运营归档/分析报告'],
  },
};

function generateFileItem(
  hash: string,
  baseName: string,
  fileType: string,
  fileSize: number,
  index: number,
  department: string,
  sourceDisk: string,
  detectedAt: string
): FileItem {
  const paths = basePathsByDeptAndDisk[department]?.[sourceDisk] || ['/公共文档'];
  const basePath = paths[index % paths.length];
  const nameVariants = [
    `${baseName}_v${index + 1}`,
    `${baseName}_副本${index + 1}`,
    `${baseName}(${index + 1})`,
    `${baseName}_最终版`,
    `${baseName}_最新版`,
    baseName,
  ];
  const name = `${nameVariants[index % nameVariants.length]}.${fileType}`;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const createdDate = randomDate(ninetyDaysAgo, now);
  const lastAccessedDate = new Date(Math.max(
    new Date(createdDate).getTime(),
    now.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000
  )).toISOString();

  return {
    id: generateId(),
    name,
    path: `${basePath}/${name}`,
    size: fileSize,
    hash,
    createdAt: createdDate,
    lastAccessedAt: lastAccessedDate,
    createdBy: randomFromArray(users),
    department,
    fileType,
    sourceDisk,
    status: 'active',
    detectedAt,
  };
}

function generateKeepSuggestion(files: FileItem[]): string {
  const sorted = [...files].sort((a, b) => {
    const dateA = new Date(a.lastAccessedAt).getTime();
    const dateB = new Date(b.lastAccessedAt).getTime();
    if (dateB !== dateA) return dateB - dateA;
    const createDateA = new Date(a.createdAt).getTime();
    const createDateB = new Date(b.createdAt).getTime();
    return createDateA - createDateB;
  });
  return sorted[0].id;
}

export function generateDuplicateGroups(count: number = 50): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const baseNames = [
    '项目计划书', '年度预算', '产品需求文档', '设计规范', '培训材料',
    '会议纪要', '合同模板', '品牌手册', '数据报告', '用户手册',
    '技术方案', '市场分析', '财务报表', '员工手册', '安全规范',
    '绩效考核表', '岗位职责说明', '流程图', '需求规格说明书', '测试报告',
  ];

  for (let i = 0; i < count; i++) {
    const hash = generateHash();
    const fileCount = randomInt(2, 5);
    const baseName = randomFromArray(baseNames);
    const fileType = randomFromArray(fileTypes);
    const fileSize = randomFileSize(fileType);
    const department = randomFromArray(departments);
    const sourceDisk = randomFromArray(sourceDisks);
    const detectedAt = randomDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    const files: FileItem[] = [];

    for (let j = 0; j < fileCount; j++) {
      files.push(generateFileItem(hash, baseName, fileType, fileSize, j, department, sourceDisk, detectedAt));
    }

    const totalSize = fileSize * fileCount;
    const saveableSize = fileSize * (fileCount - 1);
    const suggestedKeepId = generateKeepSuggestion(files);

    groups.push({
      id: generateId(),
      hash,
      fileCount,
      totalSize,
      saveableSize,
      files,
      suggestedKeepId,
      department,
      sourceDisk,
      detectedAt,
    });
  }

  return groups.sort((a, b) => b.saveableSize - a.saveableSize);
}

export function generateRecycleItems(count: number = 20): { items: RecycleItem[]; history: DisposalHistoryEvent[] } {
  const items: RecycleItem[] = [];
  const history: DisposalHistoryEvent[] = [];
  const groups = generateDuplicateGroups(Math.ceil(count / 2));
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const reasons = ['内容重复', '版本过期', '路径冗余', '已归档'];

  for (const group of groups) {
    for (const file of group.files.slice(1)) {
      if (items.length >= count) break;
      
      const movedAt = randomDate(sevenDaysAgo, now);
      const movedBy = randomFromArray(users);
      const reason = randomFromArray(reasons);
      
      const detectedEvent: DisposalHistoryEvent = {
        id: generateId(),
        type: 'detected',
        fileId: file.id,
        fileHash: file.hash,
        fileName: file.name,
        filePath: file.path,
        department: file.department,
        sourceDisk: file.sourceDisk,
        operator: '系统',
        timestamp: group.detectedAt || movedAt,
        remark: '哈希盘点发现重复文件',
      };
      
      const movedEvent: DisposalHistoryEvent = {
        id: generateId(),
        type: 'moved_to_recycle',
        fileId: file.id,
        fileHash: file.hash,
        fileName: file.name,
        filePath: file.path,
        department: file.department,
        sourceDisk: file.sourceDisk,
        operator: movedBy,
        timestamp: movedAt,
        reason,
        remark: '移入待回收区',
      };
      
      history.push(detectedEvent, movedEvent);
      
      const fileWithStatus = { ...file, status: 'pending_recycle' as const };
      
      items.push({
        id: generateId(),
        fileItem: fileWithStatus,
        movedAt,
        movedBy,
        reason,
        status: 'pending',
        history: [detectedEvent, movedEvent],
      });
    }
  }

  return {
    items: items.sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()),
    history,
  };
}

export function generateDepartmentReports(
  duplicateGroups: DuplicateGroup[],
  recycleItems: RecycleItem[],
  rectificationItems: RectificationItem[] = [],
  deletedItems: DeletedItem[] = []
): DepartmentReport[] {
  const deptMap = new Map<string, {
    duplicateCount: number;
    duplicateSize: number;
    saveableSize: number;
    fileCount: number;
    totalFileCount: number;
    pendingRecycleCount: number;
    pendingRecycleSize: number;
    rectificationCount: number;
    rectificationPending: number;
    rectificationConfirmed: number;
    rectificationRejected: number;
    deletedCount: number;
    deletedSize: number;
  }>();

  departments.forEach(dept => {
    const head = getDepartmentHead(dept);
    deptMap.set(dept, {
      duplicateCount: 0,
      duplicateSize: 0,
      saveableSize: 0,
      fileCount: 0,
      totalFileCount: randomInt(8000, 20000),
      pendingRecycleCount: 0,
      pendingRecycleSize: 0,
      rectificationCount: 0,
      rectificationPending: 0,
      rectificationConfirmed: 0,
      rectificationRejected: 0,
      deletedCount: 0,
      deletedSize: 0,
    });
  });

  duplicateGroups.forEach(group => {
    const data = deptMap.get(group.department);
    if (data) {
      data.duplicateCount += 1;
      data.duplicateSize += group.totalSize;
      data.saveableSize += group.saveableSize;
      data.fileCount += group.fileCount;
    }
  });

  recycleItems.filter(i => i.status === 'pending').forEach(item => {
    const data = deptMap.get(item.fileItem.department);
    if (data) {
      data.pendingRecycleCount += 1;
      data.pendingRecycleSize += item.fileItem.size;
    }
  });

  rectificationItems.forEach(item => {
    const data = deptMap.get(item.department);
    if (data) {
      data.rectificationCount += 1;
      if (item.status === 'pending') data.rectificationPending += 1;
      if (item.status === 'confirmed') data.rectificationConfirmed += 1;
      if (item.status === 'rejected') data.rectificationRejected += 1;
    }
  });

  deletedItems.forEach(item => {
    const data = deptMap.get(item.fileItem.department);
    if (data) {
      data.deletedCount += 1;
      data.deletedSize += item.fileItem.size;
    }
  });

  const reports: DepartmentReport[] = [];
  deptMap.forEach((data, name) => {
    const head = getDepartmentHead(name);
    reports.push({
      id: generateId(),
      name,
      duplicateCount: data.duplicateCount,
      duplicateSize: data.duplicateSize,
      saveableSize: data.saveableSize,
      fileCount: data.fileCount,
      totalFileCount: data.totalFileCount,
      duplicateRate: data.totalFileCount > 0 ? data.fileCount / data.totalFileCount : 0,
      rank: 0,
      pendingRecycleCount: data.pendingRecycleCount,
      pendingRecycleSize: data.pendingRecycleSize,
      head: head.name,
      headEmail: head.email,
      rectificationCount: data.rectificationCount,
      rectificationPending: data.rectificationPending,
      rectificationConfirmed: data.rectificationConfirmed,
      rectificationRejected: data.rectificationRejected,
    });
  });

  return reports.sort((a, b) => b.duplicateSize - a.duplicateSize).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function generateDailyTrend(): DailyTrend[] {
  const trend: DailyTrend[] = [];
  const now = new Date();
  let baseGroups = 2400;
  let baseSpace = 450 * 1024 * 1024 * 1024;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    baseGroups += randomInt(-30, 50);
    baseSpace += randomInt(-5, 10) * 1024 * 1024 * 1024;
    trend.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      duplicateGroups: Math.max(1500, baseGroups),
      saveableSpace: Math.max(200 * 1024 * 1024 * 1024, baseSpace),
    });
  }

  return trend;
}

export function generateDepartmentDistribution(
  duplicateGroups: DuplicateGroup[]
): DepartmentDistribution[] {
  const deptSizeMap = new Map<string, number>();
  
  duplicateGroups.forEach(group => {
    const current = deptSizeMap.get(group.department) || 0;
    deptSizeMap.set(group.department, current + group.saveableSize);
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  
  return departments.map((name, index) => ({
    name,
    value: deptSizeMap.get(name) || 0,
    color: colors[index % colors.length],
  })).filter(d => d.value > 0);
}

export function generateOverviewStats(
  duplicateGroups: DuplicateGroup[],
  recycleItems: RecycleItem[],
  deletedItems: DeletedItem[] = [],
  totalFreedSpace: number = 0
): OverviewStats {
  const totalDuplicateGroups = duplicateGroups.length;
  const totalSaveableSpace = duplicateGroups.reduce((sum, g) => sum + g.saveableSize, 0);
  const involvedDepartments = new Set(duplicateGroups.map(g => g.department)).size;
  
  const deptSizes = new Map<string, number>();
  duplicateGroups.forEach(g => {
    deptSizes.set(g.department, (deptSizes.get(g.department) || 0) + g.saveableSize);
  });
  
  let topDept = '-';
  let maxSize = 0;
  deptSizes.forEach((size, dept) => {
    if (size > maxSize) {
      maxSize = size;
      topDept = dept;
    }
  });

  const pendingRecycle = recycleItems.filter(i => i.status === 'pending');
  const totalDeletedCount = deletedItems.length;
  const totalDeletedSize = deletedItems.reduce((sum, i) => sum + i.fileItem.size, 0);

  return {
    totalDuplicateGroups,
    totalSaveableSpace,
    involvedDepartments,
    topDuplicateSource: topDept,
    trend: generateDailyTrend(),
    departmentDistribution: generateDepartmentDistribution(duplicateGroups),
    pendingRecycleCount: pendingRecycle.length,
    pendingRecycleSize: pendingRecycle.reduce((sum, i) => sum + i.fileItem.size, 0),
    totalDeletedCount,
    totalDeletedSize,
    totalFreedSpace,
  };
}

export function generateActivityLogs(count: number = 15): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const typeDescriptions: Record<string, string[]> = {
    scan: [
      '完成部门盘全量扫描，发现重复文件 1,247 组',
      '完成项目盘增量扫描，新增重复文件 86 组',
      '完成归档盘深度扫描，处理文件 45,892 个',
    ],
    move: [
      '将 42 个重复文件移入待回收区',
      '将 18 个过期文档移入待回收区',
      '将 3 个视频文件移入待回收区',
    ],
    approve: [
      '审核通过 28 个文件的删除申请',
      '批量确认删除 56 个重复文件',
    ],
    reject: [
      '恢复 5 个误移入的重要文件',
      '驳回 3 个合同文件的删除申请',
    ],
    delete: [
      '永久删除 28 个文件，释放空间 1.2 GB',
      '永久删除 56 个文件，释放空间 3.8 GB',
    ],
    send_rectification: [
      '向人力资源部发送整改清单，涉及 12 组重复文件',
      '向行政部发送整改清单，涉及 8 组重复文件',
    ],
    confirm_rectification: [
      '研发部确认整改清单，同意清理 15 组文件',
      '市场部确认整改清单，同意清理 9 组文件',
    ],
    reject_rectification: [
      '财务部驳回整改清单，需重新核对文件清单',
    ],
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const types: Array<ActivityLog['type']> = ['scan', 'move', 'approve', 'reject', 'delete', 'send_rectification', 'confirm_rectification', 'reject_rectification'];

  for (let i = 0; i < count; i++) {
    const type = randomFromArray(types);
    const descriptions = typeDescriptions[type];
    logs.push({
      id: generateId(),
      type,
      description: randomFromArray(descriptions),
      operator: randomFromArray(users),
      timestamp: randomDate(sevenDaysAgo, now),
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getDiskTypes(): DiskType[] {
  return diskTypes;
}

export function getSourceDiskName(diskId: string): string {
  return sourceDiskNames[diskId] || diskId;
}

export function getDepartments(): string[] {
  return departments;
}

export function getFileTypes(): string[] {
  return fileTypes;
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function generateEmptyBatchPlan(): BatchDisposalPlan {
  return {
    id: generateId(),
    name: '批量处置方案',
    createdAt: new Date().toISOString(),
    items: [],
    totalFileCount: 0,
    totalSaveableSize: 0,
    departments: [],
    sourceDisks: [],
    status: 'draft',
  };
}

export function generateDisposalHistoryEvent(
  type: DisposalHistoryEvent['type'],
  file: FileItem,
  operator: string,
  reason?: string,
  remark?: string
): DisposalHistoryEvent {
  return {
    id: generateId(),
    type,
    fileId: file.id,
    fileHash: file.hash,
    fileName: file.name,
    filePath: file.path,
    department: file.department,
    sourceDisk: file.sourceDisk,
    operator,
    timestamp: new Date().toISOString(),
    reason,
    remark,
  };
}

export function generateRectificationItem(
  group: DuplicateGroup,
  fileIds: string[],
  sentBy: string
): RectificationItem {
  const files = group.files.filter(f => fileIds.includes(f.id));
  return {
    id: generateId(),
    department: group.department,
    groupId: group.id,
    fileIds,
    fileCount: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    saveableSize: files.length > 1 ? files[0].size * (files.length - 1) : files.length > 0 ? files[0].size : 0,
    sourceDisk: group.sourceDisk,
    sentAt: new Date().toISOString(),
    sentBy,
    status: 'pending',
    files,
  };
}
