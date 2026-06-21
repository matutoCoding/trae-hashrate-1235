export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 2)} ${sizes[i]}`;
}

export function formatFileSizePrecise(bytes: number): string {
  return `${bytes.toLocaleString()} B`;
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatDate(dateStr);
}

export function getFileTypeIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    pdf: 'file-text',
    doc: 'file-text',
    docx: 'file-text',
    xls: 'file-spreadsheet',
    xlsx: 'file-spreadsheet',
    ppt: 'file-presentation',
    pptx: 'file-presentation',
    jpg: 'file-image',
    jpeg: 'file-image',
    png: 'file-image',
    gif: 'file-image',
    mp4: 'file-video',
    avi: 'file-video',
    mp3: 'file-audio',
    zip: 'file-archive',
    rar: 'file-archive',
    txt: 'file-text',
  };
  return iconMap[fileType.toLowerCase()] || 'file';
}

export function getFileTypeColor(fileType: string): string {
  const colorMap: Record<string, string> = {
    pdf: 'text-red-500',
    doc: 'text-blue-500',
    docx: 'text-blue-500',
    xls: 'text-green-500',
    xlsx: 'text-green-500',
    ppt: 'text-orange-500',
    pptx: 'text-orange-500',
    jpg: 'text-purple-500',
    jpeg: 'text-purple-500',
    png: 'text-purple-500',
    gif: 'text-purple-500',
    mp4: 'text-pink-500',
    avi: 'text-pink-500',
    zip: 'text-yellow-600',
    rar: 'text-yellow-600',
  };
  return colorMap[fileType.toLowerCase()] || 'text-gray-500';
}

export function truncateHash(hash: string, length: number = 8): string {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
}

export function truncatePath(path: string, maxLength: number = 60): string {
  if (path.length <= maxLength) return path;
  const parts = path.split('/');
  if (parts.length <= 3) return path;
  return `${parts[0]}/.../${parts.slice(-2).join('/')}`;
}
