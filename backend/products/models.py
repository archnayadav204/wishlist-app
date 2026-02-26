from django.db import models
from django.contrib.auth.models import User


class Product(models.Model):
    class Source(models.TextChoices):
        AMAZON = 'amazon', 'Amazon'
        FLIPKART = 'flipkart', 'Flipkart'

    title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True)
    product_url = models.URLField(null=True)
    source = models.CharField(max_length=20, choices=Source.choices,null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.get_source_display()})"


class UserProduct(models.Model):
    class Status(models.TextChoices):
        WISHLIST = 'wishlist', 'Wishlist'
        CART = 'cart', 'Cart'
        PURCHASED = 'purchased', 'Purchased'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='user_products')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WISHLIST)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')  # prevent duplicate entries per user

    def __str__(self):
        return f"{self.user.username} → {self.product.title} [{self.status}]"
