class AuthSchema:
    @staticmethod
    def validate_login(data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        if not email or not password:
            return False, "Email and password are required."
        return True, None

    @staticmethod
    def validate_register(data):
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        if not name or not email or not password:
            return False, "Name, email, and password are required."
        return True, None
