import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useI18n } from '@/contexts';

// 知识图谱节点类型
interface GraphNode {
  id: string;
  label: string;
  category: string;
  level: number; // 知识层级：1-基础，2-中级，3-高级
  description?: string;
  examId?: string;
}

// 知识图谱边类型
interface GraphEdge {
  source: string;
  target: string;
  relationship: 'prerequisite' | 'related' | 'builds_on' | 'complement';
  strength: number; // 关联强度 0-1
}

// 图谱数据类型
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface KnowledgeGraphProps {
  examIds?: string[];
  selectedTopics?: string[];
  onNodeSelect?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  examIds = [],
  selectedTopics = [],
  onNodeSelect,
  onNodeDoubleClick
}) => {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');

  // 模拟知识图谱数据生成
  const generateMockGraphData = useCallback((): GraphData => {
    // 模拟节点数据
    const mockNodes: GraphNode[] = [
      { id: '1', label: 'Basic Grammar', category: 'Language', level: 1, description: 'Fundamental grammar concepts' },
      { id: '2', label: 'Vocabulary Building', category: 'Language', level: 1, description: 'Core vocabulary development' },
      { id: '3', label: 'Reading Comprehension', category: 'Language', level: 2, description: 'Understanding written texts' },
      { id: '4', label: 'Writing Skills', category: 'Language', level: 2, description: 'Effective writing techniques' },
      { id: '5', label: 'Advanced Grammar', category: 'Language', level: 3, description: 'Complex grammatical structures' },
      { id: '6', label: 'Programming Basics', category: 'Technical', level: 1, description: 'Introduction to programming' },
      { id: '7', label: 'Data Structures', category: 'Technical', level: 2, description: 'Organizing and storing data' },
      { id: '8', label: 'Algorithms', category: 'Technical', level: 3, description: 'Problem-solving methods' },
      { id: '9', label: 'Web Development', category: 'Technical', level: 2, description: 'Building web applications' },
      { id: '10', label: 'Database Design', category: 'Technical', level: 2, description: 'Designing efficient databases' },
      { id: '11', label: 'Business Strategy', category: 'Business', level: 2, description: 'Strategic business planning' },
      { id: '12', label: 'Marketing Fundamentals', category: 'Business', level: 1, description: 'Basic marketing concepts' },
      { id: '13', label: 'Financial Analysis', category: 'Business', level: 3, description: 'Analyzing financial data' },
    ];

    // 模拟边数据
    const mockEdges: GraphEdge[] = [
      { source: '1', target: '3', relationship: 'prerequisite', strength: 0.9 },
      { source: '2', target: '3', relationship: 'prerequisite', strength: 0.8 },
      { source: '1', target: '4', relationship: 'prerequisite', strength: 0.7 },
      { source: '3', target: '5', relationship: 'builds_on', strength: 0.8 },
      { source: '4', target: '5', relationship: 'builds_on', strength: 0.6 },
      { source: '6', target: '7', relationship: 'prerequisite', strength: 0.9 },
      { source: '7', target: '8', relationship: 'builds_on', strength: 0.8 },
      { source: '6', target: '9', relationship: 'prerequisite', strength: 0.7 },
      { source: '7', target: '10', relationship: 'related', strength: 0.6 },
      { source: '12', target: '11', relationship: 'prerequisite', strength: 0.8 },
      { source: '11', target: '13', relationship: 'builds_on', strength: 0.7 },
      { source: '9', target: '10', relationship: 'complement', strength: 0.5 },
    ];

    return { nodes: mockNodes, edges: mockEdges };
  }, []);

  // 过滤图谱数据
  const filteredGraphData = React.useMemo(() => {
    let filteredNodes = graphData.nodes;

    // 按搜索词过滤
    if (searchTerm) {
      filteredNodes = filteredNodes.filter(node =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按知识层级过滤
    if (filterLevel !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.level === filterLevel);
    }

    // 按类别过滤
    if (filterCategory !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.category === filterCategory);
    }

    // 只保留与过滤后节点相关的边
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredEdges = graphData.edges.filter(edge =>
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, searchTerm, filterLevel, filterCategory]);

  // 获取节点颜色
  const getNodeColor = (node: GraphNode, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#3b82f6'; // blue-500
    if (isHovered) return '#60a5fa'; // blue-400
    
    switch (node.category) {
      case 'Language': return '#10b981'; // emerald-500
      case 'Technical': return '#f59e0b'; // amber-500
      case 'Business': return '#8b5cf6'; // violet-500
      default: return '#6b7280'; // gray-500
    }
  };

  // 获取节点大小
  const getNodeSize = (node: GraphNode) => {
    return 8 + node.level * 4; // 基础大小 + 层级大小
  };

  // 简单的力导向布局算法
  const calculateLayout = (data: GraphData, width: number, height: number) => {
    const nodes = data.nodes.map(node => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    // 简化版力导向算法
    for (let i = 0; i < 100; i++) {
      // 斥力
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const dx = nodes[k].x - nodes[j].x;
          const dy = nodes[k].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodes[j].vx -= fx;
          nodes[j].vy -= fy;
          nodes[k].vx += fx;
          nodes[k].vy += fy;
        }
      }

      // 引力（边）
      data.edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * 0.01 * edge.strength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // 更新位置
      nodes.forEach(node => {
        node.vx *= 0.9; // 阻尼
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
        
        // 边界约束
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      });
    }

    return nodes;
  };

  // 渲染图谱
  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // 计算布局
    const layoutNodes = calculateLayout(filteredGraphData, width, height);

    // 清空SVG
    svg.innerHTML = '';

    // 创建defs for arrowheads
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#6b7280');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 渲染边
    filteredGraphData.edges.forEach(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', (edge.strength * 2).toString());
        line.setAttribute('opacity', '0.6');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        svg.appendChild(line);
      }
    });

    // 渲染节点
    layoutNodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      
      // 节点圆圈
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', getNodeSize(node).toString());
      circle.setAttribute('fill', getNodeColor(node, isSelected, isHovered));
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';
      
      // 事件处理
      circle.addEventListener('click', () => {
        setSelectedNode(node);
        onNodeSelect?.(node);
      });
      
      circle.addEventListener('dblclick', () => {
        onNodeDoubleClick?.(node);
      });
      
      circle.addEventListener('mouseenter', () => {
        setHoveredNode(node);
      });
      
      circle.addEventListener('mouseleave', () => {
        setHoveredNode(null);
      });
      
      svg.appendChild(circle);
      
      // 节点标签
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', (node.y + getNodeSize(node) + 15).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#374151');
      text.textContent = node.label;
      text.style.pointerEvents = 'none';
      
      svg.appendChild(text);
    });
  }, [filteredGraphData, selectedNode, hoveredNode, onNodeSelect, onNodeDoubleClick]);

  // 初始化数据
  useEffect(() => {
    setGraphData(generateMockGraphData());
  }, [generateMockGraphData]);

  // 重新渲染图谱
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // 获取唯一的类别列表
  const categories = React.useMemo(() => {
    return Array.from(new Set(graphData.nodes.map(node => node.category)));
  }, [graphData]);

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索 */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('knowledgeGraph.search')}</label>
            <input
              type="text"
              placeholder={t('knowledgeGraph.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
            />
          </div>
          
          {/* 知识层级过滤 */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('knowledgeGraph.level')}</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('knowledgeGraph.allLevels')}</option>
              <option value={1}>{t('knowledgeGraph.basic')}</option>
              <option value={2}>{t('knowledgeGraph.intermediate')}</option>
              <option value={3}>{t('knowledgeGraph.advanced')}</option>
            </select>
          </div>
          
          {/* 类别过滤 */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('knowledgeGraph.category')}</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('knowledgeGraph.allCategories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* 图谱统计 */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('knowledgeGraph.statistics')}</label>
            <div className="text-sm text-muted-foreground">
              {filteredGraphData.nodes.length} {t('knowledgeGraph.nodes')} • {filteredGraphData.edges.length} {t('knowledgeGraph.connections')}
            </div>
          </div>
        </div>
      </div>

      {/* 主图谱区域 */}
      <div className="flex gap-6">
        {/* 图谱可视化 */}
        <div className="flex-1">
          <div className="border border-border rounded-lg p-4 bg-background">
            <svg
              ref={svgRef}
              width="100%"
              height="500"
              className="border border-border/50 rounded"
            />
          </div>
        </div>

        {/* 侧边栏详情 */}
        <div className="w-80">
          <div className="border border-border rounded-lg p-4 bg-background">
            <h3 className="font-semibold mb-4">{t('knowledgeGraph.nodeDetails')}</h3>
            
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedNode.label}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedNode.category === 'Language' ? 'bg-emerald-100 text-emerald-700' :
                      selectedNode.category === 'Technical' ? 'bg-amber-100 text-amber-700' :
                      selectedNode.category === 'Business' ? 'bg-violet-100 text-violet-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedNode.category}
                    </span>
                    <span className="flex items-center gap-1">
                      {'★'.repeat(selectedNode.level)}{'☆'.repeat(3 - selectedNode.level)}
                      <span className="text-xs">
                        {selectedNode.level === 1 ? t('knowledgeGraph.basic') :
                         selectedNode.level === 2 ? t('knowledgeGraph.intermediate') :
                         t('knowledgeGraph.advanced')}
                      </span>
                    </span>
                  </div>
                </div>
                
                {selectedNode.description && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">{t('knowledgeGraph.description')}</h5>
                    <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                  </div>
                )}
                
                {/* 相关连接 */}
                <div>
                  <h5 className="font-medium text-sm mb-2">{t('knowledgeGraph.connections')}</h5>
                  <div className="space-y-2">
                    {filteredGraphData.edges
                      .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                      .map(edge => {
                        const isOutgoing = edge.source === selectedNode.id;
                        const connectedNodeId = isOutgoing ? edge.target : edge.source;
                        const connectedNode = graphData.nodes.find(n => n.id === connectedNodeId);
                        
                        if (!connectedNode) return null;
                        
                        return (
                          <div
                            key={`${edge.source}-${edge.target}`}
                            className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
                            onClick={() => setSelectedNode(connectedNode)}
                          >
                            <span className={`px-1 py-0.5 rounded text-[10px] ${
                              edge.relationship === 'prerequisite' ? 'bg-red-100 text-red-700' :
                              edge.relationship === 'builds_on' ? 'bg-blue-100 text-blue-700' :
                              edge.relationship === 'related' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {edge.relationship}
                            </span>
                            <span className="flex-1">{connectedNode.label}</span>
                            <span className="text-muted-foreground">
                              {isOutgoing ? '→' : '←'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm">{t('knowledgeGraph.selectNode')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h4 className="font-medium mb-3">{t('knowledgeGraph.legend')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 节点类型 */}
          <div>
            <h5 className="text-sm font-medium mb-2">{t('knowledgeGraph.nodeTypes')}</h5>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Language</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Technical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span>Business</span>
              </div>
            </div>
          </div>
          
          {/* 关系类型 */}
          <div>
            <h5 className="text-sm font-medium mb-2">{t('knowledgeGraph.relationshipTypes')}</h5>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span>prerequisite - {t('knowledgeGraph.prerequisite')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span>builds_on - {t('knowledgeGraph.buildsOn')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span>related - {t('knowledgeGraph.related')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span>complement - {t('knowledgeGraph.complement')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
