import tempfile
import os
from flask import Flask, render_template
import ssl

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('main_html.html')

if __name__ == "__main__":
    # Crear contexto SSL adhoc para desarrollo
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    context.load_default_certs()
    
    # Ejecutar con HTTPS
    app.run(
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        ssl_context='adhoc'  # SSL automático para desarrollo
    )
