from django.urls import path
from .views import UserProductListCreateView, UserProductDetailView

urlpatterns = [
    path('', UserProductListCreateView.as_view(), name='product-list-create'),
    path('<int:pk>/', UserProductDetailView.as_view(), name='product-detail'),
]
