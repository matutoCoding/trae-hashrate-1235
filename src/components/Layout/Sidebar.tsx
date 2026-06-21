import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Copy,
  Trash2,
  BarChart3,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    path: '/',
    icon: LayoutDashboard,
    label: '概览',
    description: '重复占用概览',
  },
  {
    path: '/duplicates',
    icon: Copy,
    label: '重复文件',
    description: '哈希盘点结果',
  },
  {
    path: '/recycle',
    icon: Trash2,
    label: '待回收区',
    description: '回收确认',
  },
  {
    path: '/reports',
    icon: BarChart3,
    label: '责任报告',
    description: '部门排行榜',
  },
  {
    path: '/audit',
    icon: Shield,
    label: '审计检索',
    description: '处置链路追踪',
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-primary-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">哈希去重</h1>
            <p className="text-xs text-primary-300">企业网盘管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded transition-all duration-200',
                'hover:bg-primary-800 hover:text-white',
                isActive
                  ? 'bg-primary-700 text-white shadow-inner'
                  : 'text-primary-200'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.label}</p>
              <p className="text-xs text-primary-400 truncate">{item.description}</p>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-800">
        <div className="bg-primary-800 rounded p-3">
          <p className="text-xs text-primary-300 mb-1">当前用户</p>
          <p className="font-medium text-sm">系统管理员</p>
          <p className="text-xs text-primary-400">admin@company.com</p>
        </div>
      </div>
    </aside>
  );
}
