from rest_framework import serializers
from .models import Book, BookImage, BookOrder, ShippingAddress
from accounts.serializers import UserSerializer


class BookImageSerializer(serializers.ModelSerializer):
    """书籍图片序列化器"""
    
    class Meta:
        model = BookImage
        fields = ['id', 'image', 'is_cover', 'order']


class BookListSerializer(serializers.ModelSerializer):
    """书籍列表序列化器（用于列表显示）"""
    seller_name = serializers.CharField(read_only=True)
    seller_avatar = serializers.CharField(read_only=True)
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'category', 'condition', 
            'description', 'price', 'original_price', 'location',
            'seller_name', 'seller_avatar', 'status', 'tags',
            'created_at', 'updated_at', 'images'
        ]
    
    def get_images(self, obj):
        """获取书籍图片列表"""
        images = obj.images.all()
        return [img.image.url for img in images]
    
    def to_representation(self, instance):
        """自定义输出格式以匹配前端类型"""
        data = super().to_representation(instance)
        # 添加前端需要的字段映射
        data['sellerId'] = str(instance.seller.id)
        data['sellerName'] = instance.seller_name
        data['sellerAvatar'] = instance.seller_avatar
        data['createdAt'] = instance.created_at
        data['updatedAt'] = instance.updated_at
        data['publishYear'] = instance.publish_year
        return data


class BookDetailSerializer(serializers.ModelSerializer):
    """书籍详情序列化器"""
    seller = UserSerializer(read_only=True)
    images = BookImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'isbn', 'publisher', 'publish_year',
            'category', 'condition', 'description', 'price', 'original_price',
            'location', 'tags', 'seller', 'status', 'images',
            'created_at', 'updated_at'
        ]
    
    def to_representation(self, instance):
        """自定义输出格式以匹配前端类型"""
        data = super().to_representation(instance)
        # 添加前端需要的字段映射
        data['sellerId'] = str(instance.seller.id)
        data['sellerName'] = instance.seller.name
        data['sellerAvatar'] = instance.seller_avatar
        data['createdAt'] = instance.created_at
        data['updatedAt'] = instance.updated_at
        data['publishYear'] = instance.publish_year
        # 转换图片格式
        data['images'] = [img['image'] for img in data['images']]
        return data


class BookCreateSerializer(serializers.ModelSerializer):
    """书籍创建序列化器"""
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    publish_year = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Book
        fields = [
            'title', 'author', 'isbn', 'publisher', 'publish_year',
            'category', 'condition', 'description', 'price', 
            'original_price', 'location', 'tags', 'images'
        ]
    
    def create(self, validated_data):
        """创建书籍及其图片"""
        images_data = validated_data.pop('images', [])
        book = Book.objects.create(**validated_data)
        
        # 创建图片
        for i, image in enumerate(images_data):
            BookImage.objects.create(
                book=book,
                image=image,
                is_cover=(i == 0),  # 第一张图片设为封面
                order=i
            )
        
        return book


class BookUpdateSerializer(serializers.ModelSerializer):
    """书籍更新序列化器"""
    publish_year = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Book
        fields = [
            'title', 'author', 'isbn', 'publisher', 'publish_year',
            'category', 'condition', 'description', 'price', 
            'original_price', 'location', 'tags', 'status'
        ]
    
    def update(self, instance, validated_data):
        """更新书籍信息"""
        # 只允许卖家更新自己的书籍
        user = self.context['request'].user
        if instance.seller != user:
            raise serializers.ValidationError("您只能编辑自己发布的书籍")
        
        return super().update(instance, validated_data)


class ShippingAddressSerializer(serializers.ModelSerializer):
    """收货地址序列化器"""
    
    class Meta:
        model = ShippingAddress
        fields = [
            'name', 'phone', 'province', 'city', 
            'district', 'address', 'zip_code'
        ]


class BookOrderSerializer(serializers.ModelSerializer):
    """书籍订单序列化器"""
    book = BookListSerializer(read_only=True)
    buyer_name = serializers.CharField(read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    
    class Meta:
        model = BookOrder
        fields = [
            'id', 'book', 'buyer_name', 'amount', 'status',
            'message', 'payment_method', 'buyer_contact',
            'shipping_address', 'created_at', 'updated_at', 'completed_at'
        ]
    
    def to_representation(self, instance):
        """自定义输出格式以匹配前端类型"""
        data = super().to_representation(instance)
        # 添加前端需要的字段映射
        data['bookId'] = str(instance.book.id)
        data['buyerId'] = str(instance.buyer.id)
        data['buyerName'] = instance.buyer_name
        data['buyerContact'] = instance.buyer_contact
        data['sellerId'] = str(instance.seller.id)
        data['createdAt'] = instance.created_at
        data['updatedAt'] = instance.updated_at
        data['completedAt'] = instance.completed_at
        return data


class BookOrderCreateSerializer(serializers.ModelSerializer):
    """创建书籍订单序列化器"""
    book_id = serializers.CharField(write_only=True)
    shipping_address = ShippingAddressSerializer(write_only=True, required=False)
    
    class Meta:
        model = BookOrder
        fields = [
            'book_id', 'message', 'payment_method', 
            'buyer_contact', 'shipping_address'
        ]
    
    def validate_book_id(self, value):
        """验证书籍是否存在且可购买"""
        try:
            book = Book.objects.get(id=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError("书籍不存在")
        
        if book.status != 'available':
            raise serializers.ValidationError("该书籍不可购买")
        
        # 不能购买自己的书籍
        user = self.context['request'].user
        if book.seller == user:
            raise serializers.ValidationError("不能购买自己的书籍")
        
        return value
    
    def create(self, validated_data):
        """创建订单"""
        book_id = validated_data.pop('book_id')
        shipping_data = validated_data.pop('shipping_address', None)
        
        book = Book.objects.get(id=book_id)
        user = self.context['request'].user
        
        # 创建订单
        order = BookOrder.objects.create(
            book=book,
            buyer=user,
            amount=book.price,
            **validated_data
        )
        
        # 创建收货地址（如果提供）
        if shipping_data:
            ShippingAddress.objects.create(
                order=order,
                **shipping_data
            )
        
        # 更新书籍状态为已预订
        book.status = 'reserved'
        book.save()
        
        return order


class BookSearchSerializer(serializers.Serializer):
    """书籍搜索序列化器"""
    keyword = serializers.CharField(required=False, allow_blank=True)
    category = serializers.ChoiceField(
        choices=Book.CATEGORY_CHOICES,
        required=False,
        allow_blank=True
    )
    condition = serializers.ChoiceField(
        choices=Book.CONDITION_CHOICES,
        required=False,
        allow_blank=True
    )
    min_price = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        min_value=0
    )
    max_price = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        min_value=0
    )
    location = serializers.CharField(required=False, allow_blank=True)
    sort_by = serializers.ChoiceField(
        choices=[
            ('newest', '最新发布'),
            ('price-low', '价格从低到高'),
            ('price-high', '价格从高到低'),
            ('condition', '按品相排序')
        ],
        required=False,
        default='newest'
    )