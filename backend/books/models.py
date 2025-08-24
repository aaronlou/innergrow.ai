from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Book(models.Model):
    """书籍模型"""
    
    CATEGORY_CHOICES = [
        ('literature', '文学'),
        ('science', '科学'),
        ('technology', '技术'),
        ('history', '历史'),
        ('philosophy', '哲学'),
        ('art', '艺术'),
        ('education', '教育'),
        ('children', '儿童'),
        ('other', '其他'),
    ]
    
    CONDITION_CHOICES = [
        ('new', '全新'),
        ('like-new', '几乎全新'),
        ('good', '良好'),
        ('fair', '一般'),
        ('poor', '较差'),
    ]
    
    STATUS_CHOICES = [
        ('available', '可售'),
        ('sold', '已售出'),
        ('reserved', '已预订'),
        ('removed', '已下架'),
    ]
    
    # 基本信息
    title = models.CharField(max_length=200, help_text='书名')
    author = models.CharField(max_length=100, help_text='作者')
    isbn = models.CharField(max_length=20, blank=True, help_text='ISBN编号')
    publisher = models.CharField(max_length=100, blank=True, help_text='出版社')
    publish_year = models.PositiveIntegerField(
        blank=True, 
        null=True,
        validators=[MinValueValidator(1900), MaxValueValidator(2030)],
        help_text='出版年份'
    )
    
    # 分类和状态
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='other',
        help_text='书籍分类'
    )
    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        default='good',
        help_text='书籍品相'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        help_text='书籍状态'
    )
    
    # 描述和价格
    description = models.TextField(help_text='书籍描述')
    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='售价'
    )
    original_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='原价'
    )
    
    # 地理位置和标签
    location = models.CharField(max_length=100, blank=True, help_text='所在地区')
    tags = models.JSONField(default=list, blank=True, help_text='标签列表')
    
    # 关联用户
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='books_for_sale',
        help_text='卖家'
    )
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'books_book'
        verbose_name = '书籍'
        verbose_name_plural = '书籍'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} - {self.author}'
    
    @property
    def seller_name(self):
        return self.seller.name
    
    @property 
    def seller_avatar(self):
        return self.seller.avatar.url if self.seller.avatar else None


class BookImage(models.Model):
    """书籍图片模型"""
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to='books/',
        help_text='书籍图片'
    )
    is_cover = models.BooleanField(default=False, help_text='是否为封面图')
    order = models.PositiveIntegerField(default=0, help_text='显示顺序')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'books_book_image'
        verbose_name = '书籍图片'
        verbose_name_plural = '书籍图片'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f'{self.book.title} - 图片{self.order}'


class BookOrder(models.Model):
    """书籍订单模型"""
    
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('confirmed', '已确认'),
        ('paid', '已付款'),
        ('shipped', '已发货'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('wechat', '微信支付'),
        ('alipay', '支付宝'),
        ('cash', '现金交易'),
        ('bank-transfer', '银行转账'),
    ]
    
    # 基本信息
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='book_orders',
        help_text='买家'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='book_sales',
        help_text='卖家'
    )
    
    # 订单信息
    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='交易金额'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='订单状态'
    )
    message = models.TextField(
        blank=True,
        help_text='买家留言'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        help_text='支付方式'
    )
    
    # 联系信息
    buyer_contact = models.CharField(
        max_length=100,
        help_text='买家联系方式'
    )
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'books_book_order'
        verbose_name = '书籍订单'
        verbose_name_plural = '书籍订单'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'订单 {self.id} - {self.book.title}'
    
    @property
    def buyer_name(self):
        return self.buyer.name
    
    def save(self, *args, **kwargs):
        # 设置卖家
        if not self.seller_id:
            self.seller = self.book.seller
        super().save(*args, **kwargs)


class ShippingAddress(models.Model):
    """送货地址模型"""
    order = models.OneToOneField(
        BookOrder,
        on_delete=models.CASCADE,
        related_name='shipping_address'
    )
    name = models.CharField(max_length=50, help_text='收件人姓名')
    phone = models.CharField(max_length=20, help_text='手机号码')
    province = models.CharField(max_length=20, help_text='省份')
    city = models.CharField(max_length=20, help_text='城市')
    district = models.CharField(max_length=20, help_text='区县')
    address = models.CharField(max_length=200, help_text='详细地址')
    zip_code = models.CharField(
        max_length=10,
        blank=True,
        help_text='邮政编码'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'books_shipping_address'
        verbose_name = '送货地址'
        verbose_name_plural = '送货地址'
    
    def __str__(self):
        return f'{self.name} - {self.province}{self.city}{self.district}'
