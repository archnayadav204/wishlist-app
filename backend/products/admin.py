from django.contrib import admin
from .models import Product, UserProduct


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'price', 'source', 'created_at']
    list_filter = ['source']
    search_fields = ['title']
    ordering = ['-created_at']


@admin.register(UserProduct)
class UserProductAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'status', 'added_at']
    list_filter = ['status']
    search_fields = ['user__username', 'product__title']
    ordering = ['-added_at']
