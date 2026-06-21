import { Bell, Search, Settings, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': '重复占用概览',
  '/duplicates': '重复文件盘点',
  '/recycle': '待回收文件确认',
  '/reports': '部门责任报告',
};

const pageDescriptions: Record<string, string> = {
  '/': '查看全公司重复文件占用情况，发起新的扫描任务',
  '/duplicates': '按哈希聚合展示重复文件组，选择多余副本移入待回收区',
  '/recycle': '审核待删除文件，执行二次确认或恢复操作',
  '/reports': '按部门统计重复占用情况，生成整改清单',
};

export default function Header() {
  const location = useLocation();
  const { currentScan, stopScan } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {pageTitles[location.pathname] || '系统'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {pageDescriptions[location.pathname] || ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {currentScan && currentScan.isScanning && (
            <div className="flex items-center gap-2 bg-warning-50 border border-warning-200 rounded px-3 py-2">
              <RefreshCw className="w-4 h-4 text-warning-600 animate-spin" />
              <div className="text-sm">
                <span className="text-warning-700 font-medium">
                  正在扫描{currentScan.diskType}
                </span>
                <span className="text-warning-600 ml-2">
                  {currentScan.percentage.toFixed(1)}%
                </span>
              </div>
              <button
                onClick={stopScan}
                className="text-xs text-warning-700 hover:text-warning-900 border-l border-warning-200 pl-2 ml-1"
              >
                停止
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文件路径、哈希值..."
              className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {currentScan && currentScan.isScanning && (
        <div className="mt-4 bg-gray-50 rounded p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 truncate max-w-xl">
              {currentScan.currentFile}
            </span>
            <span className="text-gray-500 font-mono">
              {currentScan.processedFiles.toLocaleString()} / {currentScan.totalFiles.toLocaleString()} 个文件
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${currentScan.percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </header>
  );
}
