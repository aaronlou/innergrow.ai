from django.urls import path
from . import views

app_name = 'books'

urlpatterns = [
    # 书籍管理
    path('', views.BookListCreateView.as_view(), name='book_list_create'),
    path('<int:pk>/', views.BookDetailView.as_view(), name='book_detail'),
    path('my-books/', views.my_books_view, name='my_books'),
    
    # 订单管理
    path('orders/', views.BookOrderListCreateView.as_view(), name='order_list_create'),
    path('orders/<int:pk>/', views.BookOrderDetailView.as_view(), name='order_detail'),
    
    # 辅助信息
    path('categories/', views.book_categories_view, name='book_categories'),
    path('conditions/', views.book_conditions_view, name='book_conditions'),
]