import tempfile
import os
from flask import Flask, render_template, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Habilitar CORS para desarrollo

@app.after_request
def after_request(response):
    # Headers para permitir cámara en desarrollo
    response.headers['Permissions-Policy'] = 'camera=*, microphone=*'
    response.headers['Feature-Policy'] = 'camera *; microphone *'
    return response

@app.route("/")
def main():
    return render_template('main_html.html')

if __name__ == "__main__":
    # Servidor HTTP básico - más compatible
    app.run(host='0.0.0.0', port=8080, debug=True)
