'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import type { Exam } from '../../types';

// 文件类型定义
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedAt: Date;
  examId?: string;
}

// 支持的文件类型
const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: '📄', label: 'PDF' },
  'application/msword': { icon: '�', label: 'Word文档' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '�', label: 'Word文档' },
};

interface MaterialUploadProps {
  selectedExam?: Exam | null;
  onFileUploaded?: (file: UploadedFile) => void;
}

export default function MaterialUpload({ selectedExam, onFileUploaded }: MaterialUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // 处理文件上传
  const handleFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      // 检查文件类型
      if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
        console.warn(`Unsupported file type: ${file.type}`);
        continue;
      }

      // 模拟文件上传
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        url: URL.createObjectURL(file), // 临时URL用于预览
        examId: selectedExam?.id,
      };

      setUploadedFiles(prev => [...prev, newFile]);
      onFileUploaded?.(newFile);
    }
    
    setIsUploading(false);
  }, [selectedExam, onFileUploaded]);

  // 处理文件拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [handleFiles]);

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  }, [handleFiles]);

  // 删除文件
  const handleDeleteFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 添加链接
  const handleAddLink = useCallback(() => {
    if (!linkUrl.trim()) return;
    
    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: linkUrl,
      type: 'link',
      size: 0,
      url: linkUrl,
      uploadedAt: new Date(),
      examId: selectedExam?.id,
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    onFileUploaded?.(newFile);
    setLinkUrl('');
    setShowLinkInput(false);
  }, [linkUrl, selectedExam, onFileUploaded]);

  // 添加文本内容
  const handleAddText = useCallback(() => {
    if (!textContent.trim() || !textTitle.trim()) return;
    
    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: textTitle,
      type: 'text/plain',
      size: new Blob([textContent]).size,
      uploadedAt: new Date(),
      examId: selectedExam?.id,
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    onFileUploaded?.(newFile);
    setTextContent('');
    setTextTitle('');
    setShowTextInput(false);
  }, [textContent, textTitle, selectedExam, onFileUploaded]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          学习资料上传
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          上传您的学习资料，支持多种文件格式和来源
        </p>
      </div>

      {/* 主要上传区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：文件上传 */}
        <div className="space-y-4">
          {/* 拖拽上传区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📎</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              拖拽文件到此处
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              或者点击下方按钮选择文件
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              支持 PDF、文档、音频、视频等格式。单个文件最大 50MB。
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt,.md,.mp3,.wav,.mp4,.ppt,.pptx"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                选择文件
              </Button>
            </label>
          </div>

          {/* 其他上传方式 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Google Drive 集成 */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12"
              onClick={() => {
                // TODO: 集成 Google Drive API
                alert('Google Drive 集成功能开发中...');
              }}
            >
              <span className="text-lg">📁</span>
              <span className="text-sm">Google Drive</span>
            </Button>

            {/* 链接输入 */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12"
              onClick={() => setShowLinkInput(true)}
            >
              <span className="text-lg">🔗</span>
              <span className="text-sm">添加链接</span>
            </Button>

            {/* 文本输入 */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12"
              onClick={() => setShowTextInput(true)}
            >
              <span className="text-lg">📝</span>
              <span className="text-sm">输入文本</span>
            </Button>
          </div>
        </div>

        {/* 右侧：已上传文件列表 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            已上传的资料 ({uploadedFiles.length})
          </h3>
          
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-3xl mb-2">📚</div>
              <p>还没有上传任何资料</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-xl">
                    {file.type === 'link' ? '🔗' : SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]?.icon || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file.type === 'link' ? '外部链接' : formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 上传进度提示 */}
      {isUploading && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            正在处理文件...
          </div>
        </div>
      )}

      {/* 考试关联提示 */}
      {selectedExam && (
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>提示：</strong>这些资料将与考试 &ldquo;{selectedExam.title}&rdquo; 关联，帮助您更好地准备相关内容。
          </p>
        </div>
      )}

      {/* 链接输入模态框 */}
      {showLinkInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">添加学习链接</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">链接地址</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAddLink} disabled={!linkUrl.trim()}>
                  添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文本输入模态框 */}
      {showTextInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">添加文本资料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">标题</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="为您的文本资料起个标题"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">内容</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="输入或粘贴您的学习资料内容..."
                  rows={10}
                  className="w-full px-3 py-2 border border-input rounded-md resize-y"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTextInput(false);
                    setTextContent('');
                    setTextTitle('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleAddText} 
                  disabled={!textContent.trim() || !textTitle.trim()}
                >
                  添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
