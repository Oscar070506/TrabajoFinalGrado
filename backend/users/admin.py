from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ('username', 'email', 'is_active', 'is_staff')
    search_fields = ('username', 'email')
    ordering      = ('email',)
    fieldsets = (
        (None,           {'fields': ('username', 'email', 'password')}),
        ('Permisos',     {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('username', 'email', 'password1', 'password2'),
        }),
    )