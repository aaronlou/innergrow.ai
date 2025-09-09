'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { useI18n } from '../../contexts/I18nContext';
import type { Exam } from '../../types';

// 知识图谱节点类型
interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  category: string;
  level: number; // 1-3, 表示基础、中级、高级
  masteryStatus: 'not-started' | 'learning' | 'mastered';
  description?: string;
}

// 知识图谱边类型
interface GraphEdge {
  source: string;
  target: string;
  relationship: 'prerequisite' | 'builds_on' | 'related' | 'applies_to';
}

// 图谱数据类型
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// 聊天消息类型
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface KnowledgeGraphProps {
  selectedExam: Exam | null;
  availableExams?: Exam[];
  onExamChange?: (exam: Exam | null) => void;
}

export default function KnowledgeGraph({ 
  selectedExam, 
  availableExams = [], 
  onExamChange 
}: KnowledgeGraphProps) {
  const { t } = useI18n();
  const svgRef = React.useRef<SVGSVGElement>(null);
  
  // 状态管理
  const [selectedNode, setSelectedNode] = React.useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterLevel, setFilterLevel] = React.useState<number | 'all'>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = React.useState(false);
  const [showExamSelector, setShowExamSelector] = React.useState(!selectedExam);
  
  // AI 聊天状态
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isAiThinking, setIsAiThinking] = React.useState(false);

  // 根据选中的考试生成对应的知识图谱数据
  const generateExamSpecificGraphData = React.useCallback((exam: Exam): GraphData => {
    if (!exam) {
      return { nodes: [], edges: [] };
    }

    // 根据考试类别生成不同的知识图谱
    switch (exam.category) {
      case 'Language':
        return {
          nodes: [
            { id: '1', label: '语法基础', x: 100, y: 100, category: 'Grammar', level: 1, masteryStatus: 'mastered' },
            { id: '2', label: '词汇积累', x: 300, y: 150, category: 'Vocabulary', level: 1, masteryStatus: 'learning' },
            { id: '3', label: '阅读理解', x: 200, y: 250, category: 'Reading', level: 2, masteryStatus: 'not-started' },
            { id: '4', label: '听力训练', x: 400, y: 200, category: 'Listening', level: 2, masteryStatus: 'learning' },
            { id: '5', label: '口语表达', x: 150, y: 350, category: 'Speaking', level: 3, masteryStatus: 'not-started' },
            { id: '6', label: '写作技巧', x: 350, y: 300, category: 'Writing', level: 3, masteryStatus: 'not-started' },
          ],
          edges: [
            { source: '1', target: '3', relationship: 'prerequisite' },
            { source: '2', target: '3', relationship: 'prerequisite' },
            { source: '2', target: '4', relationship: 'prerequisite' },
            { source: '3', target: '5', relationship: 'builds_on' },
            { source: '4', target: '5', relationship: 'builds_on' },
            { source: '1', target: '6', relationship: 'prerequisite' },
            { source: '2', target: '6', relationship: 'prerequisite' },
          ]
        };

      case 'Technical':
        return {
          nodes: [
            { id: '1', label: '编程基础', x: 150, y: 100, category: 'Programming', level: 1, masteryStatus: 'mastered' },
            { id: '2', label: '数据结构', x: 300, y: 120, category: 'Data Structures', level: 2, masteryStatus: 'learning' },
            { id: '3', label: '算法设计', x: 450, y: 180, category: 'Algorithms', level: 3, masteryStatus: 'not-started' },
            { id: '4', label: '数据库', x: 200, y: 250, category: 'Database', level: 2, masteryStatus: 'learning' },
            { id: '5', label: '网络协议', x: 350, y: 280, category: 'Network', level: 2, masteryStatus: 'not-started' },
            { id: '6', label: '系统设计', x: 500, y: 320, category: 'System Design', level: 3, masteryStatus: 'not-started' },
          ],
          edges: [
            { source: '1', target: '2', relationship: 'prerequisite' },
            { source: '2', target: '3', relationship: 'builds_on' },
            { source: '1', target: '4', relationship: 'prerequisite' },
            { source: '4', target: '6', relationship: 'builds_on' },
            { source: '5', target: '6', relationship: 'applies_to' },
            { source: '3', target: '6', relationship: 'applies_to' },
          ]
        };

      case 'Business':
        return {
          nodes: [
            { id: '1', label: '商业基础', x: 120, y: 120, category: 'Business Fundamentals', level: 1, masteryStatus: 'mastered' },
            { id: '2', label: '市场营销', x: 280, y: 100, category: 'Marketing', level: 2, masteryStatus: 'learning' },
            { id: '3', label: '财务管理', x: 200, y: 220, category: 'Finance', level: 2, masteryStatus: 'learning' },
            { id: '4', label: '战略规划', x: 400, y: 180, category: 'Strategy', level: 3, masteryStatus: 'not-started' },
            { id: '5', label: '团队管理', x: 150, y: 320, category: 'Management', level: 2, masteryStatus: 'not-started' },
            { id: '6', label: '商业分析', x: 350, y: 280, category: 'Analysis', level: 3, masteryStatus: 'not-started' },
          ],
          edges: [
            { source: '1', target: '2', relationship: 'prerequisite' },
            { source: '1', target: '3', relationship: 'prerequisite' },
            { source: '2', target: '4', relationship: 'builds_on' },
            { source: '3', target: '4', relationship: 'builds_on' },
            { source: '1', target: '5', relationship: 'prerequisite' },
            { source: '3', target: '6', relationship: 'applies_to' },
          ]
        };

      case 'Health':
        return {
          nodes: [
            { id: '1', label: '解剖学基础', x: 150, y: 100, category: 'Anatomy', level: 1, masteryStatus: 'mastered' },
            { id: '2', label: '生理学', x: 300, y: 120, category: 'Physiology', level: 2, masteryStatus: 'learning' },
            { id: '3', label: '病理学', x: 450, y: 180, category: 'Pathology', level: 2, masteryStatus: 'not-started' },
            { id: '4', label: '诊断学', x: 200, y: 250, category: 'Diagnosis', level: 3, masteryStatus: 'not-started' },
            { id: '5', label: '治疗方法', x: 350, y: 280, category: 'Treatment', level: 3, masteryStatus: 'not-started' },
            { id: '6', label: '预防医学', x: 500, y: 320, category: 'Prevention', level: 2, masteryStatus: 'not-started' },
          ],
          edges: [
            { source: '1', target: '2', relationship: 'prerequisite' },
            { source: '2', target: '3', relationship: 'builds_on' },
            { source: '3', target: '4', relationship: 'builds_on' },
            { source: '4', target: '5', relationship: 'applies_to' },
            { source: '2', target: '6', relationship: 'related' },
            { source: '5', target: '6', relationship: 'related' },
          ]
        };

      default:
        return { nodes: [], edges: [] };
    }
  }, []);

  // 生成图谱数据
  const graphData = React.useMemo(() => {
    return selectedExam ? generateExamSpecificGraphData(selectedExam) : { nodes: [], edges: [] };
  }, [selectedExam, generateExamSpecificGraphData]);

  // 过滤数据
  const filteredGraphData = React.useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };

    let filteredNodes = graphData.nodes;

    // 搜索过滤
    if (searchTerm) {
      filteredNodes = filteredNodes.filter(node =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 层级过滤
    if (filterLevel !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.level === filterLevel);
    }

    // 类别过滤
    if (filterCategory !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.category === filterCategory);
    }

    // 过滤相关的边
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredEdges = graphData.edges.filter(edge =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, searchTerm, filterLevel, filterCategory]);

  // 计算布局
  const calculateLayout = React.useCallback(() => {
    if (!svgRef.current || filteredGraphData.nodes.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 简单的力导向布局算法
    const nodes = filteredGraphData.nodes.map(node => ({
      ...node,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      vx: 0,
      vy: 0,
    }));

    // 模拟力导向布局
    for (let i = 0; i < 100; i++) {
      // 排斥力
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const dx = nodes[k].x - nodes[j].x;
          const dy = nodes[k].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0) {
            const force = 200 / distance;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            nodes[j].vx -= fx;
            nodes[j].vy -= fy;
            nodes[k].vx += fx;
            nodes[k].vy += fy;
          }
        }
      }

      // 吸引力（基于边）
      filteredGraphData.edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0) {
            const force = distance * 0.01;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // 更新位置
      nodes.forEach(node => {
        node.x += node.vx * 0.1;
        node.y += node.vy * 0.1;
        node.vx *= 0.9;
        node.vy *= 0.9;

        // 边界检查
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });
    }

    return nodes;
  }, [filteredGraphData]);

  // 渲染图谱
  const renderGraph = React.useCallback(() => {
    if (!svgRef.current) return;

    const layoutNodes = calculateLayout();
    if (!layoutNodes) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    // 创建defs用于箭头标记
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#64748b');

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 绘制边
    filteredGraphData.edges.forEach(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', '#64748b');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
      }
    });

    // 绘制节点
    layoutNodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.style.cursor = 'pointer';

      // 节点圆圈
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', '20');
      
      // 根据掌握状态设置颜色
      const opacity = node.masteryStatus === 'mastered' ? '1' : 
                     node.masteryStatus === 'learning' ? '0.6' : '0.3';
      circle.setAttribute('fill', '#10b981');
      circle.setAttribute('opacity', opacity);
      circle.setAttribute('stroke', selectedNode?.id === node.id ? '#3b82f6' : '#fff');
      circle.setAttribute('stroke-width', selectedNode?.id === node.id ? '3' : '2');

      // 节点文本
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', (node.y + 35).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#374151');
      text.textContent = node.label;

      // 点击事件
      group.onclick = () => setSelectedNode(node);

      group.appendChild(circle);
      group.appendChild(text);
      svg.appendChild(group);
    });
  }, [filteredGraphData, selectedNode, calculateLayout]);

  // 当数据改变时重新渲染
  React.useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // 处理AI聊天
  const handleChatSubmit = React.useCallback(async () => {
    if (!chatInput.trim() || !selectedNode) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiThinking(true);

    // 模拟AI响应
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `关于"${selectedNode.label}"，这是一个${selectedNode.category}领域的重要概念。建议您先掌握相关的基础知识，然后通过实践加深理解。您当前的学习状态是${
          selectedNode.masteryStatus === 'mastered' ? '已掌握' :
          selectedNode.masteryStatus === 'learning' ? '学习中' : '未开始'
        }。`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiThinking(false);
    }, 1500);
  }, [chatInput, selectedNode]);

  // 获取唯一的类别列表
  const categories = React.useMemo(() => {
    return Array.from(new Set(graphData.nodes.map(node => node.category)));
  }, [graphData]);

  // 处理考试选择
  const handleExamSelect = (exam: Exam) => {
    onExamChange?.(exam);
    setShowExamSelector(false);
  };

  // 如果没有选中考试且有可用考试，显示考试选择器
  if (!selectedExam && availableExams.length > 0) {
    return (
      <div className="h-[calc(100vh-12rem)] bg-background flex items-center justify-center">
        <div className="max-w-2xl w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🧠</div>
            <h2 className="text-xl font-semibold mb-2">选择考试以查看知识图谱</h2>
            <p className="text-muted-foreground">每个考试都有专门的知识图谱来帮助您理解知识点之间的关系</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableExams.map(exam => (
              <div
                key={exam.id}
                className="p-4 border border-border rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/30"
                onClick={() => handleExamSelect(exam)}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-3 h-3 rounded-full mt-1 ${
                    exam.category === 'Language' ? 'bg-emerald-500' :
                    exam.category === 'Technical' ? 'bg-amber-500' :
                    exam.category === 'Business' ? 'bg-violet-500' :
                    exam.category === 'Health' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></span>
                  <div className="flex-1">
                    <h3 className="font-medium">{exam.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {exam.description}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                      exam.category === 'Language' ? 'bg-emerald-100 text-emerald-700' :
                      exam.category === 'Technical' ? 'bg-amber-100 text-amber-700' :
                      exam.category === 'Business' ? 'bg-violet-100 text-violet-700' :
                      exam.category === 'Health' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {exam.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] bg-background">
      {/* 顶部工具栏 - 紧凑设计 */}
      <div className="flex items-center gap-4 p-3 bg-muted/20 border-b border-border">
        {/* 考试信息 - 紧凑显示 */}
        {selectedExam ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                selectedExam.category === 'Language' ? 'bg-emerald-500' :
                selectedExam.category === 'Technical' ? 'bg-amber-500' :
                selectedExam.category === 'Business' ? 'bg-violet-500' :
                selectedExam.category === 'Health' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></span>
              <h3 className="font-medium text-sm">{selectedExam.title}</h3>
              <span className="text-xs text-muted-foreground">({selectedExam.category})</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredGraphData.nodes.length} 节点 • {filteredGraphData.edges.length} 连接
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 text-muted-foreground">
            <div className="text-sm">📚 {t('knowledgeGraph.selectExamFirst')}</div>
          </div>
        )}

        {/* 右侧工具栏 */}
        <div className="flex items-center gap-2">
          {/* 切换考试按钮 */}
          {availableExams.length > 0 && (
            <select
              value={selectedExam?.id || ''}
              onChange={(e) => {
                const exam = availableExams.find(ex => ex.id === e.target.value);
                if (exam) handleExamSelect(exam);
              }}
              className="px-2 py-1 text-xs border border-input rounded bg-background"
            >
              <option value="">选择考试</option>
              {availableExams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          )}
          
          {/* 搜索框 - 紧凑 */}
          {selectedExam && (
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32 px-2 py-1 text-xs border border-input rounded bg-background"
            />
          )}
          
          {/* 过滤器 - 紧凑 */}
          {selectedExam && (
            <>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2 py-1 text-xs border border-input rounded bg-background"
              >
                <option value="all">全部层级</option>
                <option value={1}>基础</option>
                <option value={2}>中级</option>
                <option value={3}>高级</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1 text-xs border border-input rounded bg-background"
              >
                <option value="all">全部类别</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </>
          )}
          
          {/* 右侧面板切换 */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="px-2 py-1 h-6"
          >
            {isRightPanelCollapsed ? '📋' : '✕'}
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex h-[calc(100%-3rem)]">
        {/* 图谱区域 */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isRightPanelCollapsed ? '' : 'mr-1'}`}>
          <div className="flex-1 relative">
            {selectedExam ? (
              <>
                {/* SVG 图谱 */}
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  className="bg-background"
                />
                
                {/* 图谱内嵌工具栏 */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      {/* 学习状态图例 */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span>已掌握</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                          <span>学习中</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500/25"></div>
                          <span>未开始</span>
                        </div>
                      </div>
                      
                      {/* 快捷操作 */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          学习路径
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          测验
                        </Button>
                        <Button size="sm" className="h-6 px-2 text-xs">
                          学习计划
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="text-lg font-medium mb-2">{t('knowledgeGraph.noExamSelected')}</h3>
                  <p className="text-sm">{t('knowledgeGraph.selectExamToViewGraph')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧面板 - 悬浮设计 */}
        {!isRightPanelCollapsed && (
          <div className="w-80 bg-background border-l border-border flex flex-col">
            {/* 面板头部 */}
            <div className="p-3 border-b border-border bg-muted/10">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">详情面板</h3>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsRightPanelCollapsed(true)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>

            {/* 节点信息 */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-border">
                <h4 className="font-medium text-sm mb-2">{t('knowledgeGraph.nodeDetails')}</h4>
                
                {selectedNode ? (
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm">{selectedNode.label}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          selectedNode.category === 'Grammar' ? 'bg-emerald-100 text-emerald-700' :
                          selectedNode.category === 'Programming' ? 'bg-amber-100 text-amber-700' :
                          selectedNode.category === 'Business Fundamentals' ? 'bg-violet-100 text-violet-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedNode.category}
                        </span>
                        <span className="text-xs">
                          {'★'.repeat(selectedNode.level)}{'☆'.repeat(3 - selectedNode.level)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          selectedNode.masteryStatus === 'mastered' ? 'bg-green-100 text-green-700' :
                          selectedNode.masteryStatus === 'learning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedNode.masteryStatus === 'mastered' ? '已掌握' :
                           selectedNode.masteryStatus === 'learning' ? '学习中' : '未开始'}
                        </span>
                      </div>
                    </div>
                    
                    {selectedNode.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">{selectedNode.description}</p>
                      </div>
                    )}
                    
                    {/* 相关连接 - 紧凑显示 */}
                    <div>
                      <h6 className="font-medium text-xs mb-1">相关连接</h6>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {filteredGraphData.edges
                          .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                          .slice(0, 3)
                          .map(edge => {
                            const isOutgoing = edge.source === selectedNode.id;
                            const connectedNodeId = isOutgoing ? edge.target : edge.source;
                            const connectedNode = graphData.nodes.find(n => n.id === connectedNodeId);
                            
                            if (!connectedNode) return null;
                            
                            return (
                              <div
                                key={`${edge.source}-${edge.target}`}
                                className="flex items-center gap-1 text-xs p-1 bg-muted/30 rounded cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedNode(connectedNode)}
                              >
                                <span className="text-xs text-muted-foreground">
                                  {isOutgoing ? '→' : '←'}
                                </span>
                                <span className="flex-1 truncate">{connectedNode.label}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <div className="text-lg mb-1">🎯</div>
                    <p className="text-xs">{t('knowledgeGraph.selectNode')}</p>
                  </div>
                )}
              </div>

              {/* AI 助手 - 紧凑设计 */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-border">
                  <h4 className="font-medium text-sm">AI 助手</h4>
                </div>
                
                {/* 聊天区域 */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {selectedNode ? (
                    <>
                      {chatMessages.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground">
                          <div className="text-base mb-1">🤖</div>
                          <p>询问关于 &quot;{selectedNode.label}&quot; 的问题</p>
                        </div>
                      )}
                      {chatMessages.map(message => (
                        <div key={message.id} className={`text-xs ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block max-w-[90%] p-2 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {isAiThinking && (
                        <div className="text-left">
                          <div className="inline-block bg-muted text-muted-foreground p-2 rounded-lg text-xs">
                            {t('chat.aiThinking')}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      <div className="text-base mb-1">💭</div>
                      <p>选择一个知识点开始对话</p>
                    </div>
                  )}
                </div>
                
                {/* 输入区域 */}
                {selectedNode && (
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="询问..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                        className="flex-1 px-2 py-1 text-xs border border-input rounded bg-background"
                        disabled={isAiThinking}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleChatSubmit}
                        disabled={!chatInput.trim() || isAiThinking}
                        className="px-2 py-1 h-6 text-xs"
                      >
                        发送
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};