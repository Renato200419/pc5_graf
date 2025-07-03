from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('main_html.html')

if __name__ == "__main__":
    print("🚀 Servidor iniciado para desarrollo móvil")
    print("📱 Desde tu móvil (misma red WiFi), ve a:")
    print("   http://192.168.18.13:3000")
    print("🔧 Para cerrar: Ctrl+C")
    
    app.run(
        host='0.0.0.0', 
        port=3000, 
        debug=False,  # Sin debug para evitar problemas
        threaded=True
    )
