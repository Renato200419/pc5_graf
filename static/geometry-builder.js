// Geometry Builder AR - Juego Educativo con THREE.JS y MindAR
// Cumple ODS 4 - Educación de Calidad

class GeometryBuilderAR {
    constructor() {
        this.mindarThree = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.anchor = null;
        
        // Estado del juego
        this.currentShape = 'cube';
        this.totalVolume = 0;
        this.blocksPlaced = [];
        this.currentMission = 0;
        this.isGameStarted = false;
        
        // Grid system
        this.gridSize = 0.5; // 0.5 unidades por celda
        this.gridHelper = null;
        
        // Misiones educativas
        this.missions = [
            {
                id: 1,
                title: "Coloca tu primer bloque",
                description: "Toca la pantalla para colocar un cubo",
                target: { blocks: 1, type: 'any' },
                reward: "¡Excelente! Has colocado tu primer bloque geométrico."
            },
            {
                id: 2,
                title: "Construye una torre de 3 cubos",
                description: "Apila 3 cubos uno encima del otro",
                target: { blocks: 3, type: 'cube', pattern: 'tower' },
                reward: "¡Perfecto! Una torre tiene altura y volumen total de 3 cm³."
            },
            {
                id: 3,
                title: "Experimenta con formas",
                description: "Coloca al menos una esfera y un cilindro",
                target: { sphere: 1, cylinder: 1 },
                reward: "¡Genial! Has experimentado con diferentes formas geométricas."
            },
            {
                id: 4,
                title: "Volumen de 10 cm³",
                description: "Construye estructuras que sumen 10 cm³",
                target: { totalVolume: 10 },
                reward: "¡Increíble! Has calculado volúmenes correctamente."
            },
            {
                id: 5,
                title: "Arquitecto Master",
                description: "Construye una estructura con al menos 8 bloques",
                target: { blocks: 8, type: 'any' },
                reward: "¡Eres un arquitecto master! Has dominado la construcción AR."
            }
        ];
        
        // Configuración de formas
        this.shapes = {
            cube: {
                volume: 1,
                name: 'Cubo',
                size: '1×1×1',
                color: 0x4CAF50,
                createGeometry: () => new THREE.BoxGeometry(0.5, 0.5, 0.5)
            },
            sphere: {
                volume: 0.524, // (4/3) * π * r³ aproximado para r=0.25
                name: 'Esfera',
                size: 'r=0.25',
                color: 0x2196F3,
                createGeometry: () => new THREE.SphereGeometry(0.25, 16, 12)
            },
            cylinder: {
                volume: 0.393, // π * r² * h aproximado
                name: 'Cilindro',
                size: 'r=0.25, h=0.5',
                color: 0xFF9800,
                createGeometry: () => new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16)
            },
            pyramid: {
                volume: 0.167, // 1/3 * base * altura aproximado
                name: 'Pirámide',
                size: 'base=0.5×0.5',
                color: 0x9C27B0,
                createGeometry: () => new THREE.ConeGeometry(0.25, 0.5, 4)
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Inicializando Geometry Builder AR...');
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Configurar UI inicial
        this.updateUI();
        
        console.log('✅ Juego inicializado, esperando que el usuario presione Start');
    }
    
    async startAR() {
        console.log('🚀 Iniciando experiencia AR con MindAR...');
        
        try {
            // Verificar si hay un target compilado
            const targetData = localStorage.getItem('geometryBuilderTarget');
            
            if (!targetData) {
                this.showError('No hay target compilado. Ve a "Crear Target" primero.');
                return;
            }
            
            // Usar MindAR con el target compilado
            await this.startMindAR(targetData);
            
        } catch (error) {
            console.error('❌ Error iniciando AR:', error);
            this.showError('No se pudo inicializar MindAR. Verifica los permisos de cámara.');
        }
    }
    
    async startMindAR(targetData) {
        console.log('🎯 Inicializando experiencia AR simplificada...');
        
        try {
            // Target personalizado del carnet
            const targetPath = './static/assets/targets/card.mind';
            
            console.log('🎯 Cargando target personalizado:', targetPath);
            
            // Usar configuración básica de MindAR con target personalizado
            this.mindarThree = new window.MindARThree({
                container: document.body,
                imageTargetSrc: targetPath,
                maxTrack: 1,
                uiLoading: 'no',
                uiScanning: 'no',
                uiError: 'no'
            });
        } catch (error) {
            console.warn('MindAR no disponible, usando modo de demostración:', error);
            
            // Fallback: crear experiencia AR simulada
            await this.createSimpleAR();
            return;
        }
        
        const { renderer, scene, camera } = this.mindarThree;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // Configurar iluminación
        this.setupLighting();
        
        // Crear anchor para el target
        this.anchor = this.mindarThree.addAnchor(0);
        
        // Configurar eventos de detección
        this.anchor.onTargetFound = () => {
            console.log('🎯 Target detectado!');
            this.onTargetFound();
        };
        
        this.anchor.onTargetLost = () => {
            console.log('🕵️ Target perdido');
            this.onTargetLost();
        };
        
        // Crear grid de construcción
        this.createGrid();
        
        // Configurar eventos de interacción
        this.setupARInteraction();
        
        // Iniciar MindAR
        await this.mindarThree.start();
        
        this.isGameStarted = true;
        console.log('✅ MindAR iniciado correctamente');
        
        // Ocultar overlay de inicio
        document.getElementById('start-overlay').style.display = 'none';
        
        // Mostrar instrucciones
        this.showInstructions();
    }
    
    onTargetFound() {
        // Mostrar mensaje cuando se detecte el target
        this.showMessage('🎯 ¡Target detectado! Toca para colocar bloques');
    }
    
    onTargetLost() {
        // Mostrar mensaje cuando se pierda el target
        this.showMessage('🕵️ Apunta la cámara al carnet para continuar');
    }
    
    async createSimpleAR() {
        console.log('🎮 Creando experiencia AR simplificada...');
        
        // Crear scene, camera, renderer básicos
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        
        // Configurar cámara
        this.camera.position.set(0, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Configurar iluminación
        this.setupLighting();
        
        // Crear grupo anchor simulado
        this.anchor = { group: new THREE.Group() };
        this.scene.add(this.anchor.group);
        
        // Crear grid
        this.createSimpleGrid();
        
        // Configurar interacción simplificada
        this.setupSimpleInteraction();
        
        // Iniciar loop de renderizado
        this.startRenderLoop();
        
        this.isGameStarted = true;
        
        // Ocultar overlay
        document.getElementById('start-overlay').style.display = 'none';
        
        this.showInstructions();
    }
    
    createSimpleGrid() {
        const gridHelper = new THREE.GridHelper(4, 8, 0x888888, 0x444444);
        this.anchor.group.add(gridHelper);
        
        // Crear plano para raycast
        const planeGeometry = new THREE.PlaneGeometry(4, 4);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide 
        });
        this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.anchor.group.add(this.groundPlane);
    }
    
    setupSimpleInteraction() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.handleSimplePlacement(event);
        });
        
        canvas.addEventListener('click', (event) => {
            this.handleSimplePlacement(event);
        });
    }
    
    handleSimplePlacement(event) {
        if (!this.isGameStarted) return;
        
        // Colocación simplificada en posición aleatoria
        const randomX = (Math.random() - 0.5) * 3;
        const randomZ = (Math.random() - 0.5) * 3;
        const height = this.blocksPlaced.length * 0.3;
        
        const position = new THREE.Vector3(randomX, 0.25 + height, randomZ);
        this.placeBlock(position);
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Rotar ligeramente el grupo para dar sensación de 3D
            if (this.anchor && this.anchor.group) {
                this.anchor.group.rotation.y += 0.01;
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    showInstructions() {
        setTimeout(() => {
            alert('🎮 ¡Geometry Builder AR iniciado!\n\n🎯 Modo Demo Activo\n📱 Toca la pantalla para colocar bloques\n🔄 Usa el menú inferior para cambiar formas\n🏆 Completa las misiones educativas');
        }, 1000);
    }
    
    showMessage(text) {
        // Crear mensaje temporal
        let messageEl = document.getElementById('ar-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'ar-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-size: 16px;
                z-index: 1200;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = text;
        messageEl.style.opacity = '1';
        
        // Ocultar después de 3 segundos
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 3000);
    }
    
    createTargetImage() {
        // Crear una imagen target simple de marcador
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 512, 512);
        
        // Marco negro
        ctx.fillStyle = 'black';
        ctx.fillRect(50, 50, 412, 412);
        
        // Cuadrado blanco interior
        ctx.fillStyle = 'white';
        ctx.fillRect(100, 100, 312, 312);
        
        // Símbolo central
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AR', 256, 276);
        
        return canvas.toDataURL();
    }
    
    setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Luz direccional
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    createGrid() {
        // Crear grid visual
        const gridHelper = new THREE.GridHelper(4, 8, 0x888888, 0x444444);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.set(0, 0, 0);
        this.gridHelper = gridHelper;
        
        this.anchor.group.add(gridHelper);
        
        // Crear plano invisible para raycast
        const planeGeometry = new THREE.PlaneGeometry(4, 4);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide 
        });
        this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.anchor.group.add(this.groundPlane);
    }
    
    setupARInteraction() {
        // Raycaster para detectar toques
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event listeners para touch/click
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (this.currentShape === 'eraser') {
                this.handleEraser(event);
            } else {
                this.handlePlacement(event);
            }
        });
        
        canvas.addEventListener('click', (event) => {
            if (this.currentShape === 'eraser') {
                this.handleEraser(event);
            } else {
                this.handlePlacement(event);
            }
        });
    }
    
    handlePlacement(event) {
        if (!this.isGameStarted) return;
        
        // Obtener coordenadas del toque/click
        const rect = this.renderer.domElement.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.touches && event.touches[0]) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        // Simplificar: colocar bloque en posición aleatoria cerca del centro
        const randomX = (Math.random() - 0.5) * 2; // -1 a 1
        const randomZ = (Math.random() - 0.5) * 2; // -1 a 1
        const height = this.blocksPlaced.length * 0.3; // Apilar progresivamente
        
        const position = new THREE.Vector3(
            Math.round(randomX / this.gridSize) * this.gridSize,
            0.25 + height,
            Math.round(randomZ / this.gridSize) * this.gridSize
        );
        
        this.placeBlock(position);
        
        console.log('🎮 Bloque colocado en posición:', position);
    }
    
    handleEraser(event) {
        if (!this.isGameStarted || !this.anchor.group.visible) return;
        
        // Similar al placement pero para borrar
        const rect = this.renderer.domElement.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.touches && event.touches[0]) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.blocksPlaced);
        
        if (intersects.length > 0) {
            this.removeBlock(intersects[0].object);
        }
    }
    
    placeBlock(position) {
        const shapeConfig = this.shapes[this.currentShape];
        if (!shapeConfig) return;
        
        // Crear geometría
        const geometry = shapeConfig.createGeometry();
        const material = new THREE.MeshLambertMaterial({ 
            color: shapeConfig.color,
            transparent: true,
            opacity: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Agregar propiedades del bloque
        mesh.userData = {
            shape: this.currentShape,
            volume: shapeConfig.volume,
            id: Date.now()
        };
        
        // Agregar al anchor y lista
        this.anchor.group.add(mesh);
        this.blocksPlaced.push(mesh);
        
        // Actualizar estadísticas
        this.totalVolume += shapeConfig.volume;
        
        // Actualizar UI
        this.updateUI();
        
        // Verificar misiones
        this.checkMissions();
        
        console.log(`✅ Bloque colocado: ${this.currentShape} en`, position);
    }
    
    removeBlock(block) {
        const index = this.blocksPlaced.indexOf(block);
        if (index > -1) {
            // Restar volumen
            this.totalVolume -= block.userData.volume;
            
            // Remover de la escena y lista
            this.anchor.group.remove(block);
            this.blocksPlaced.splice(index, 1);
            
            // Actualizar UI
            this.updateUI();
            
            console.log(`🗑️ Bloque removido: ${block.userData.shape}`);
        }
    }
    
    clearAllBlocks() {
        this.blocksPlaced.forEach(block => {
            this.anchor.group.remove(block);
        });
        
        this.blocksPlaced = [];
        this.totalVolume = 0;
        
        this.updateUI();
        console.log('🧹 Todos los bloques removidos');
    }
    
    checkMissions() {
        const mission = this.missions[this.currentMission];
        if (!mission) return;
        
        let completed = false;
        
        // Verificar diferentes tipos de misión
        if (mission.target.blocks) {
            if (mission.target.type === 'any') {
                completed = this.blocksPlaced.length >= mission.target.blocks;
            } else if (mission.target.type === 'cube') {
                const cubes = this.blocksPlaced.filter(b => b.userData.shape === 'cube');
                completed = cubes.length >= mission.target.blocks;
            }
        }
        
        if (mission.target.totalVolume) {
            completed = this.totalVolume >= mission.target.totalVolume;
        }
        
        if (mission.target.sphere && mission.target.cylinder) {
            const spheres = this.blocksPlaced.filter(b => b.userData.shape === 'sphere');
            const cylinders = this.blocksPlaced.filter(b => b.userData.shape === 'cylinder');
            completed = spheres.length >= mission.target.sphere && cylinders.length >= mission.target.cylinder;
        }
        
        if (completed) {
            this.completeMission();
        }
    }
    
    completeMission() {
        const mission = this.missions[this.currentMission];
        
        // Mostrar overlay de misión completada
        document.getElementById('completion-message').textContent = mission.reward;
        document.getElementById('mission-complete').style.display = 'block';
        
        console.log(`🎉 Misión ${mission.id} completada: ${mission.title}`);
    }
    
    nextMission() {
        // Ocultar overlay
        document.getElementById('mission-complete').style.display = 'none';
        
        // Avanzar a siguiente misión
        this.currentMission++;
        
        if (this.currentMission >= this.missions.length) {
            // Juego completado
            this.showGameComplete();
        } else {
            this.updateUI();
        }
    }
    
    showGameComplete() {
        alert('🎉 ¡Felicidades! Has completado todas las misiones del Geometry Builder AR. Has aprendido sobre geometría espacial, volúmenes y construcción 3D.');\r\n        \r\n        // Reiniciar juego\r\n        this.currentMission = 0;\r\n        this.updateUI();\r\n    }\r\n    \r\n    updateUI() {\r\n        // Actualizar puntuación\r\n        document.getElementById('score').textContent = `Volumen Total: ${this.totalVolume.toFixed(2)} cm³`;\r\n        \r\n        // Actualizar misión actual\r\n        const mission = this.missions[this.currentMission];\r\n        if (mission) {\r\n            document.getElementById('mission').textContent = `Misión: ${mission.title}`;\r\n        }\r\n        \r\n        // Actualizar panel de información\r\n        const shapeConfig = this.shapes[this.currentShape];\r\n        if (shapeConfig) {\r\n            document.getElementById('shape-info').textContent = `${shapeConfig.name} (${shapeConfig.size})`;\r\n            document.getElementById('volume-info').textContent = `Volumen: ${shapeConfig.volume.toFixed(3)} cm³`;\r\n        }\r\n        \r\n        document.getElementById('blocks-count').textContent = `Bloques: ${this.blocksPlaced.length}`;\r\n        \r\n        // Calcular progreso de misión\r\n        const progress = this.calculateMissionProgress();\r\n        document.getElementById('mission-progress').textContent = `Progreso: ${progress}%`;\r\n    }\r\n    \r\n    calculateMissionProgress() {\r\n        const mission = this.missions[this.currentMission];\r\n        if (!mission) return 100;\r\n        \r\n        if (mission.target.blocks) {\r\n            const current = mission.target.type === 'cube' \r\n                ? this.blocksPlaced.filter(b => b.userData.shape === 'cube').length\r\n                : this.blocksPlaced.length;\r\n            return Math.min(100, Math.round((current / mission.target.blocks) * 100));\r\n        }\r\n        \r\n        if (mission.target.totalVolume) {\r\n            return Math.min(100, Math.round((this.totalVolume / mission.target.totalVolume) * 100));\r\n        }\r\n        \r\n        return 0;\r\n    }\r\n    \r\n    setupEventListeners() {\r\n        // Botón de inicio\r\n        document.getElementById('start-btn').addEventListener('click', () => {\r\n            this.startAR();\r\n        });\r\n        \r\n        // Toolbar de herramientas\r\n        document.querySelectorAll('.tool-btn').forEach(btn => {\r\n            btn.addEventListener('click', () => {\r\n                // Remover active de todos\r\n                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));\r\n                \r\n                // Agregar active al seleccionado\r\n                btn.classList.add('active');\r\n                \r\n                // Actualizar forma actual\r\n                this.currentShape = btn.dataset.shape;\r\n                this.updateUI();\r\n            });\r\n        });\r\n        \r\n        // Botones de acción\r\n        document.getElementById('clear-all').addEventListener('click', () => {\r\n            if (confirm('¿Estás seguro de que quieres limpiar toda la construcción?')) {\r\n                this.clearAllBlocks();\r\n            }\r\n        });\r\n        \r\n        document.getElementById('next-mission').addEventListener('click', () => {\r\n            this.nextMission();\r\n        });\r\n        \r\n        document.getElementById('help-btn').addEventListener('click', () => {\r\n            this.showHelp();\r\n        });\r\n    }\r\n    \r\n    showHelp() {\r\n        const helpText = `\r\n🎯 GEOMETRY BUILDER AR - AYUDA\r\n\r\n📱 CONTROLES:\r\n• Toca la pantalla para colocar el bloque seleccionado\r\n• Selecciona diferentes formas desde el menú inferior\r\n• Usa el borrador (🗑️) para eliminar bloques\r\n\r\n🎮 OBJETIVO:\r\n• Completa las misiones educativas\r\n• Aprende sobre volúmenes y geometría\r\n• Construye estructuras creativas\r\n\r\n📚 EDUCATIVO (ODS 4):\r\n• Cada forma tiene un volumen específico\r\n• Observa cómo se suman los volúmenes\r\n• Desarrolla pensamiento espacial\r\n\r\n🔢 VOLÚMENES:\r\n• Cubo: 1 cm³\r\n• Esfera: ~0.524 cm³\r\n• Cilindro: ~0.393 cm³\r\n• Pirámide: ~0.167 cm³\r\n        `;\r\n        \r\n        alert(helpText);\r\n    }\r\n    \r\n    showError(message) {\r\n        alert(`❌ Error: ${message}`);\r\n    }\r\n}\r\n\r\n// Función global para nextMission (llamada desde HTML)\r\nwindow.nextMission = function() {\r\n    if (window.gameInstance) {\r\n        window.gameInstance.nextMission();\r\n    }\r\n};\r\n\r\n// Inicializar juego cuando se carga la página\r\ndocument.addEventListener('DOMContentLoaded', () => {\r\n    console.log('🎮 Cargando Geometry Builder AR...');\r\n    window.gameInstance = new GeometryBuilderAR();\r\n});
