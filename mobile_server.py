from flask import Flask, render_template, redirect, request
import threading
import socket

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('main_html.html')

@app.errorhandler(400)
def handle_bad_request(e):
    # Si hay error 400, redirigir a HTTP
    return redirect(f"http://{request.host}", code=302)

def run_http_server():
    """Servidor HTTP en puerto 8080"""
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

if __name__ == "__main__":
    print("🚀 Servidor móvil iniciado")
    print("📱 En tu móvil, prueba estas URLs:")
    print("   Option 1: http://192.168.18.13:8080")
    print("   Option 2: http://192.168.18.13:8080")
    print("🔧 Ctrl+C para cerrar")
    
    # Iniciar servidor HTTP
    run_http_server()
