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
} from '@/types';

const departments = ['研发部', '市场部', '财务部', '人力资源部', '法务部', '行政部', '产品部', '运营部'];
const users = ['张伟', '李娜', '王强', '刘芳', '陈明', '杨洋', '赵磊', '周婷', '吴静', '郑浩'];
const fileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'mp4', 'zip'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFileSize(): number {
  const sizes = [
    randomInt(1024, 1024 * 100),
    randomInt(1024 * 100, 1024 * 1024),
    randomInt(1024 * 1024, 1024 * 1024 * 50),
    randomInt(1024 * 1024 * 50, 1024 * 1024 * 500),
  ];
  return randomFromArray(sizes);
}

const diskTypes: DiskType[] = [
  { id: 'department', name: '部门盘', description: '各部门工作目录', icon: 'folder-tree', totalSize: 10 * 1024 * 1024 * 1024 * 1024, usedSize: 6.5 * 1024 * 1024 * 1024 * 1024 },
  { id: 'project', name: '项目盘', description: '项目协作共享空间', icon: 'briefcase', totalSize: 5 * 1024 * 1024 * 1024 * 1024, usedSize: 3.2 * 1024 * 1024 * 1024 * 1024 },
  { id: 'archive', name: '归档盘', description: '历史资料归档存储', icon: 'archive', totalSize: 20 * 1024 * 1024 * 1024 * 1024, usedSize: 12.8 * 1024 * 1024 * 1024 * 1024 },
];

function generateFileItem(hash: string, baseName: string, index: number): FileItem {
  const fileType = randomFromArray(fileTypes);
  const department = randomFromArray(departments);
  const pathsByDept: Record<string, string[]> = {
    '研发部': ['/研发部/技术文档', '/研发部/代码仓库', '/研发部/设计文档'],
    '市场部': ['/市场部/营销方案', '/市场部/品牌素材', '/市场部/活动策划'],
    '财务部': ['/财务部/财务报表', '/财务部/税务资料', '/财务部/审计档案'],
    '人力资源部': ['/人力资源部/员工档案', '/人力资源部/招聘资料', '/人力资源部/培训材料'],
    '法务部': ['/法务部/合同模板', '/法务部/法律意见书', '/法务部/诉讼档案'],
    '行政部': ['/行政部/办公制度', '/行政部/固定资产', '/行政部/会议纪要'],
    '产品部': ['/产品部/需求文档', '/产品部/原型设计', '/产品部/竞品分析'],
    '运营部': ['/运营部/运营计划', '/运营部/数据分析', '/运营部/用户反馈'],
  };
  const basePath = randomFromArray(pathsByDept[department] || ['/公共文档']);
  const names = [`${baseName}_v${index + 1}`, `${baseName}_副本${index + 1}`, `${baseName}(${index + 1})`, baseName];
  const name = `${randomFromArray(names)}.${fileType}`;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return {
    id: generateId(),
    name,
    path: `${basePath}/${name}`,
    size: randomFileSize(),
    hash,
    createdAt: randomDate(ninetyDaysAgo, now),
    lastAccessedAt: randomDate(ninetyDaysAgo, now),
    createdBy: randomFromArray(users),
    department,
    fileType,
  };
}

function generateKeepSuggestion(files: FileItem[]): string {
  const sorted = [...files].sort((a, b) => {
    const dateA = new Date(a.lastAccessedAt).getTime();
    const dateB = new Date(b.lastAccessedAt).getTime();
    return dateB - dateA;
  });
  return sorted[0].id;
}

export function generateDuplicateGroups(count: number = 50): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const baseNames = [
    '项目计划书', '年度预算', '产品需求文档', '设计规范', '培训材料',
    '会议纪要', '合同模板', '品牌手册', '数据报告', '用户手册',
    '技术方案', '市场分析', '财务报表', '员工手册', '安全规范',
  ];

  for (let i = 0; i < count; i++) {
    const hash = generateHash();
    const fileCount = randomInt(2, 6);
    const baseName = randomFromArray(baseNames);
    const files: FileItem[] = [];

    for (let j = 0; j < fileCount; j++) {
      files.push(generateFileItem(hash, baseName, j));
    }

    const fileSize = files[0].size;
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
      department: files[0].department,
    });
  }

  return groups.sort((a, b) => b.saveableSize - a.saveableSize);
}

export function generateRecycleItems(count: number = 20): RecycleItem[] {
  const items: RecycleItem[] = [];
  const groups = generateDuplicateGroups(Math.ceil(count / 2));
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const reasons = ['内容重复', '版本过期', '路径冗余', '已归档'];

  for (const group of groups) {
    for (const file of group.files.slice(1)) {
      if (items.length >= count) break;
      items.push({
        id: generateId(),
        fileItem: file,
        movedAt: randomDate(sevenDaysAgo, now),
        movedBy: randomFromArray(users),
        reason: randomFromArray(reasons),
        status: 'pending',
      });
    }
  }

  return items.sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime());
}

export function generateDepartmentReports(): DepartmentReport[] {
  const reports: DepartmentReport[] = departments.map((name, index) => {
    const duplicateCount = randomInt(20, 200);
    const duplicateSize = randomInt(1, 100) * 1024 * 1024 * 1024;
    return {
      id: generateId(),
      name,
      duplicateCount,
      duplicateSize,
      saveableSize: duplicateSize * 0.6,
      fileCount: randomInt(1000, 10000),
      rank: index + 1,
    };
  });

  return reports.sort((a, b) => b.duplicateSize - a.duplicateSize).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function generateDailyTrend(): DailyTrend[] {
  const trend: DailyTrend[] = [];
  const now = new Date();
  let baseGroups = 1200;
  let baseSpace = 500 * 1024 * 1024 * 1024;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    baseGroups += randomInt(-50, 80);
    baseSpace += randomInt(-10, 20) * 1024 * 1024 * 1024;
    trend.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      duplicateGroups: Math.max(800, baseGroups),
      saveableSpace: Math.max(200 * 1024 * 1024 * 1024, baseSpace),
    });
  }

  return trend;
}

export function generateDepartmentDistribution(): DepartmentDistribution[] {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  return departments.map((name, index) => ({
    name,
    value: randomInt(5, 25),
    color: colors[index % colors.length],
  }));
}

export function generateOverviewStats(): OverviewStats {
  return {
    totalDuplicateGroups: 2847,
    totalSaveableSpace: 523.8 * 1024 * 1024 * 1024,
    involvedDepartments: 8,
    topDuplicateSource: '研发部',
    trend: generateDailyTrend(),
    departmentDistribution: generateDepartmentDistribution(),
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
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const types: Array<'scan' | 'move' | 'approve' | 'reject' | 'delete'> = ['scan', 'move', 'approve', 'reject', 'delete'];

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

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
