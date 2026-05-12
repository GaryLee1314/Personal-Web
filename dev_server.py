import http.server
import socketserver
import os

PORT = 8000

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 尝试将 URL 映射到本地文件
        path = self.translate_path(self.path)
        
        # 如果文件或目录不存在
        if not os.path.exists(path):
            # 并且这是 personal-blog 的子路由（例如 /projects/personal-blog/about）
            if self.path.startswith('/projects/personal-blog/'):
                #  fallback 到该子项目的 index.html
                self.path = '/projects/personal-blog/index.html'
            else:
                # 若是其它未定义路由，可以 fallback 到整站主页，也可以不管
                pass
                
        return super().do_GET()

# 防止因前一个进程刚退出导致的端口占用报错
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
    print(f"SPA-enabled server running on http://localhost:{PORT}")
    httpd.serve_forever()
