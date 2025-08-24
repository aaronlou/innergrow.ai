from django.contrib import admin
from .models import Book, BookImage, BookOrder, ShippingAddress


class BookImageInline(admin.TabularInline):
    """书籍图片内联管理"""
    model = BookImage
    extra = 1
    fields = ['image', 'is_cover', 'order']


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """书籍管理"""
    list_display = ['title', 'author', 'category', 'condition', 'price', 'seller', 'status', 'created_at']
    list_filter = ['category', 'condition', 'status', 'created_at']
    search_fields = ['title', 'author', 'isbn', 'seller__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'author', 'isbn', 'publisher', 'publish_year')
        }),
        ('分类和状态', {
            'fields': ('category', 'condition', 'status')
        }),
        ('价格和描述', {
            'fields': ('price', 'original_price', 'description')
        }),
        ('其他信息', {
            'fields': ('location', 'tags', 'seller')
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [BookImageInline]


class ShippingAddressInline(admin.StackedInline):
    """送货地址内联管理"""
    model = ShippingAddress
    extra = 0


@admin.register(BookOrder)
class BookOrderAdmin(admin.ModelAdmin):
    """书籍订单管理"""
    list_display = ['id', 'book', 'buyer', 'seller', 'amount', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['book__title', 'buyer__email', 'seller__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('订单信息', {
            'fields': ('book', 'buyer', 'seller', 'amount', 'status')
        }),
        ('交易详情', {
            'fields': ('message', 'payment_method', 'buyer_contact')
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ShippingAddressInline]


@admin.register(BookImage)
class BookImageAdmin(admin.ModelAdmin):
    """书籍图片管理"""
    list_display = ['book', 'is_cover', 'order', 'created_at']
    list_filter = ['is_cover', 'created_at']
    search_fields = ['book__title']
    ordering = ['book', 'order']


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    """送货地址管理"""
    list_display = ['order', 'name', 'phone', 'province', 'city']
    search_fields = ['name', 'phone', 'order__book__title']
    ordering = ['-created_at']
