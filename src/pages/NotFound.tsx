import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12 text-gray-400" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2 font-mono">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">页面未找到</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页继续操作。
      </p>
      <Link to="/">
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          返回首页
        </Button>
      </Link>
    </div>
  );
}
