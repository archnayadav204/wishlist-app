from rest_framework import serializers
from .models import Product, UserProduct


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'price', 'image_url', 'product_url', 'source', 'created_at']


class AddProductSerializer(serializers.Serializer):
    """Used for POST /api/products - creates Product + UserProduct together."""
    title = serializers.CharField(max_length=255)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    image_url = serializers.URLField(required=False, allow_blank=True, default='')
    product_url = serializers.URLField()
    source = serializers.ChoiceField(choices=Product.Source.choices)
    status = serializers.ChoiceField(choices=UserProduct.Status.choices, default='wishlist')

    def create(self, validated_data):
        status = validated_data.pop('status')
        user = self.context['request'].user
        product = Product.objects.create(**validated_data)
        user_product = UserProduct.objects.create(user=user, product=product, status=status)
        return user_product


class UserProductSerializer(serializers.ModelSerializer):
    """Used for GET responses - returns nested product details."""
    product = ProductSerializer(read_only=True)

    class Meta:
        model = UserProduct
        fields = ['id', 'product', 'status', 'added_at']


class UpdateStatusSerializer(serializers.ModelSerializer):
    """Used for PATCH /api/products/{id} - only updates status."""
    class Meta:
        model = UserProduct
        fields = ['status']
