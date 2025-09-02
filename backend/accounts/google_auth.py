import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = None  # 可从 settings.py 读取

def verify_google_token(token, client_id=None):
    """
    验证 Google ID Token 并返回用户信息
    """
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        # idinfo 包含 'email', 'name', 'picture' 等字段
        return idinfo
    except Exception as e:
        return None
