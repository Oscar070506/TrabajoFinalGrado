from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.save()
            token = RefreshToken.for_user(user)
            return Response({
                'token': str(token.access_token),
                'user':  UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        email    = request.data.get('email')
        password = request.data.get('password')
        user     = authenticate(request, username=email, password=password)
        if user:
            token = RefreshToken.for_user(user)
            return Response({
                'token': str(token.access_token),
                'user':  UserSerializer(user).data
            })
        return Response({'error': 'Credenciales incorrectas.'}, status=status.HTTP_401_UNAUTHORIZED)