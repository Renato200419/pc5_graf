const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Servir archivos estáticos
app.use(express.static('.'));
app.use('/static', express.static('static'));

// Headers para AR
app.use((req, res, next) => {
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Función para generar certificados SSL autofirmados
function generateSSLCertificates() {
    try {
        console.log('Generando certificados SSL...');
        
        // Crear certificado autofirmado
        const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
        
        try {
            execSync(opensslCmd, { stdio: 'inherit' });
            console.log('Certificados SSL generados exitosamente');
            return true;
        } catch (error) {
            console.log('OpenSSL no encontrado, creando certificados con Node.js...');
            
            // Alternativa usando Node.js crypto
            const crypto = require('crypto');
            const forge = require('node-forge');
            
            const keys = forge.pki.rsa.generateKeyPair(2048);
            const cert = forge.pki.createCertificate();
            
            cert.publicKey = keys.publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
            
            const attrs = [{
                name: 'commonName',
                value: 'localhost'
            }, {
                name: 'countryName',
                value: 'US'
            }, {
                name: 'organizationName',
                value: 'WebXR Demo'
            }];
            
            cert.setSubject(attrs);
            cert.setIssuer(attrs);
            
            // Agregar Subject Alternative Names
            cert.setExtensions([{
                name: 'subjectAltName',
                altNames: [{
                    type: 2, // DNS
                    value: 'localhost'
                }, {
                    type: 7, // IP
                    ip: '127.0.0.1'
                }]
            }]);
            
            cert.sign(keys.privateKey);
            
            const pemCert = forge.pki.certificateToPem(cert);
            const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
            
            fs.writeFileSync('cert.pem', pemCert);
            fs.writeFileSync('key.pem', pemKey);
            
            console.log('Certificados SSL generados con Node.js');
            return true;
        }
    } catch (error) {
        console.error('Error generando certificados SSL:', error);
        return false;
    }
}

// Función para obtener la IP local
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    // Buscar específicamente la interfaz WiFi o Ethernet activa
    const interfaces = ['Wi-Fi', 'WiFi', 'Wireless', 'Ethernet', 'en0', 'wlan0', 'eth0'];
    
    for (const interfaceName of interfaces) {
        if (nets[interfaceName]) {
            for (const net of nets[interfaceName]) {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`📡 IP encontrada en ${interfaceName}: ${net.address}`);
                    return net.address;
                }
            }
        }
    }
    
    // Fallback: buscar cualquier IPv4 no interna
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('172.')) {
                console.log(`📡 IP encontrada en ${name}: ${net.address}`);
                return net.address;
            }
        }
    }
    
    console.log('⚠️  No se pudo detectar la IP local');
    return 'localhost';
}

// Iniciar servidor
function startServer() {
    const localIP = getLocalIP();
    
    // Verificar si existen los certificados SSL
    if (!fs.existsSync('cert.pem') || !fs.existsSync('key.pem')) {
        if (!generateSSLCertificates()) {
            console.error('No se pudieron generar los certificados SSL');
            process.exit(1);
        }
    }
    
    // Configurar HTTPS
    const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
    
    const server = https.createServer(options, app);
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 Servidor WebXR iniciado exitosamente!');
        console.log('==========================================');
        console.log(`📱 Acceso desde tu laptop: https://localhost:${PORT}`);
        console.log(`📱 Acceso desde tu celular: https://${localIP}:${PORT}`);
        console.log('==========================================');
        console.log('⚠️  IMPORTANTE para el celular:');
        console.log('   1. Asegúrate de que tu celular esté en la misma red WiFi');
        console.log('   2. Acepta el certificado SSL cuando te lo solicite');
        console.log('   3. Habilita los permisos de cámara en tu navegador');
        console.log('==========================================\n');
    });
}

startServer();
