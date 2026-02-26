from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import UserProduct
from .serializers import AddProductSerializer, UserProductSerializer, UpdateStatusSerializer


class UserProductListCreateView(APIView):
    """
    GET  /api/products/  → List all products for logged-in user
    POST /api/products/  → Add a new product to user's list
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_products = UserProduct.objects.filter(user=request.user).select_related('product')
        serializer = UserProductSerializer(user_products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AddProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user_product = serializer.save()
            response_serializer = UserProductSerializer(user_product)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProductDetailView(APIView):
    """
    PATCH  /api/products/{id}/  → Update status of a product
    DELETE /api/products/{id}/  → Remove product from user's list
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return UserProduct.objects.get(pk=pk, user=user)
        except UserProduct.DoesNotExist:
            return None

    def patch(self, request, pk):
        user_product = self.get_object(pk, request.user)
        if not user_product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateStatusSerializer(user_product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = UserProductSerializer(user_product)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user_product = self.get_object(pk, request.user)
        if not user_product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_product.delete()
        return Response({'message': 'Product removed successfully.'}, status=status.HTTP_204_NO_CONTENT)
