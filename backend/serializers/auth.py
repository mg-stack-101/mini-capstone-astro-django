from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(
        max_length=1024, trim_whitespace=False, write_only=True
    )
    remember_me = serializers.BooleanField(default=False)


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    def get_name(self, user):
        return user.get_full_name() or user.username

    def get_role(self, user):
        return "admin" if user.is_staff else "resident"
