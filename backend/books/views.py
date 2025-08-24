from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Book, BookOrder, BookImage
from .serializers import (
    BookListSerializer,
    BookDetailSerializer,
    BookCreateSerializer,
    BookUpdateSerializer,
    BookOrderSerializer,
    BookOrderCreateSerializer,
    BookSearchSerializer
)


class BookListCreateView(generics.ListCreateAPIView):
    """
    书籍列表和创建 API
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookCreateSerializer
        return BookListSerializer
    
    def get_queryset(self):
        queryset = Book.objects.filter(status='available').select_related('seller')
        
        # 搜索功能
        search_serializer = BookSearchSerializer(data=self.request.query_params)
        if search_serializer.is_valid():
            search_data = search_serializer.validated_data
            
            # 关键词搜索
            keyword = search_data.get('keyword')
            if keyword:
                queryset = queryset.filter(
                    Q(title__icontains=keyword) |
                    Q(author__icontains=keyword) |
                    Q(description__icontains=keyword)
                )
            
            # 分类筛选
            category = search_data.get('category')
            if category:
                queryset = queryset.filter(category=category)
            
            # 品相筛选
            condition = search_data.get('condition')
            if condition:
                queryset = queryset.filter(condition=condition)
            
            # 价格范围
            min_price = search_data.get('min_price')
            if min_price is not None:
                queryset = queryset.filter(price__gte=min_price)
            
            max_price = search_data.get('max_price')
            if max_price is not None:
                queryset = queryset.filter(price__lte=max_price)
            
            # 地区筛选
            location = search_data.get('location')
            if location:
                queryset = queryset.filter(location__icontains=location)
            
            # 排序
            sort_by = search_data.get('sort_by', 'newest')
            if sort_by == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort_by == 'price-low':
                queryset = queryset.order_by('price')
            elif sort_by == 'price-high':
                queryset = queryset.order_by('-price')
            elif sort_by == 'condition':
                # 按品相排序（全新到较差）
                condition_order = {
                    'new': 0, 'like-new': 1, 'good': 2, 'fair': 3, 'poor': 4
                }
                queryset = sorted(queryset, key=lambda x: condition_order.get(x.condition, 5))
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """创建书籍"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            book = serializer.save(seller=request.user)
            
            # 返回详情
            detail_serializer = BookDetailSerializer(book)
            
            return Response({
                'success': True,
                'data': detail_serializer.data,
                'message': '书籍发布成功'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': '发布失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        """书籍列表"""
        queryset = self.get_queryset()
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'success': True,
                'data': serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    书籍详情API
    """
    queryset = Book.objects.all().select_related('seller')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BookUpdateSerializer
        return BookDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """获取书籍详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        """更新书籍信息"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 检查权限
        if instance.seller != request.user:
            return Response({
                'success': False,
                'error': '您只能编辑自己发布的书籍'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            book = serializer.save()
            detail_serializer = BookDetailSerializer(book)
            
            return Response({
                'success': True,
                'data': detail_serializer.data,
                'message': '书籍信息更新成功'
            })
        
        return Response({
            'success': False,
            'error': '更新失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """删除书籍"""
        instance = self.get_object()
        
        # 检查权限
        if instance.seller != request.user:
            return Response({
                'success': False,
                'error': '您只能删除自己发布的书籍'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 检查是否有未完成的订单
        pending_orders = instance.orders.filter(
            status__in=['pending', 'confirmed', 'paid', 'shipped']
        ).exists()
        
        if pending_orders:
            return Response({
                'success': False,
                'error': '该书籍有未完成的订单，无法删除'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        instance.delete()
        
        return Response({
            'success': True,
            'message': '书籍已删除'
        }, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def my_books_view(request):
    """
    获取当前用户发布的书籍
    """
    books = Book.objects.filter(seller=request.user).order_by('-created_at')
    serializer = BookListSerializer(books, many=True)
    
    return Response({
        'success': True,
        'data': serializer.data
    })


class BookOrderListCreateView(generics.ListCreateAPIView):
    """
    书籍订单列表和创建 API
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookOrderCreateSerializer
        return BookOrderSerializer
    
    def get_queryset(self):
        """获取当前用户相关的订单"""
        user = self.request.user
        order_type = self.request.query_params.get('type', 'all')
        
        if order_type == 'purchases':
            # 买家订单
            return BookOrder.objects.filter(buyer=user).select_related('book', 'book__seller')
        elif order_type == 'sales':
            # 卖家订单
            return BookOrder.objects.filter(seller=user).select_related('book', 'buyer')
        else:
            # 所有订单
            return BookOrder.objects.filter(
                Q(buyer=user) | Q(seller=user)
            ).select_related('book', 'buyer', 'seller')
    
    def create(self, request, *args, **kwargs):
        """创建订单"""
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            order = serializer.save()
            order_serializer = BookOrderSerializer(order)
            
            return Response({
                'success': True,
                'data': order_serializer.data,
                'message': '订单创建成功'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': '订单创建失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        """订单列表"""
        queryset = self.get_queryset().order_by('-created_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'success': True,
                'data': serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class BookOrderDetailView(generics.RetrieveUpdateAPIView):
    """
    订单详情API
    """
    queryset = BookOrder.objects.all().select_related('book', 'buyer', 'seller')
    serializer_class = BookOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """只能查看自己相关的订单"""
        obj = super().get_object()
        user = self.request.user
        
        if obj.buyer != user and obj.seller != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("您无权查看此订单")
        
        return obj
    
    def update(self, request, *args, **kwargs):
        """更新订单状态"""
        instance = self.get_object()
        user = request.user
        status_update = request.data.get('status')
        
        # 只有卖家可以更新订单状态
        if instance.seller != user:
            return Response({
                'success': False,
                'error': '只有卖家可以更新订单状态'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 更新订单状态
        if status_update:
            instance.status = status_update
            
            # 如果订单完成，更新书籍状态
            if status_update == 'completed':
                instance.book.status = 'sold'
                instance.book.save()
                from django.utils import timezone
                instance.completed_at = timezone.now()
            elif status_update == 'cancelled':
                instance.book.status = 'available'
                instance.book.save()
            
            instance.save()
        
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '订单更新成功'
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def book_categories_view(request):
    """
    获取书籍分类列表
    """
    categories = [
        {'value': value, 'label': label}
        for value, label in Book.CATEGORY_CHOICES
    ]
    
    return Response({
        'success': True,
        'data': categories
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def book_conditions_view(request):
    """
    获取书籍品相列表
    """
    conditions = [
        {'value': value, 'label': label}
        for value, label in Book.CONDITION_CHOICES
    ]
    
    return Response({
        'success': True,
        'data': conditions
    })
