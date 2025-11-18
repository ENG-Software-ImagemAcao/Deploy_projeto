// static/js/script.js
let socket;
let canvas, ctx;
let drawing = false;
let last = { x: 0, y: 0 };

function initSocket() {
    socket = io(); // assume mesmo host
    socket.on('connect', () => {
        console.log('socket connected');
        if (window.GAME && window.GAME.room) {
            socket.emit('join', { room: window.GAME.room, username: 'player' });
        }
    });

    socket.on('draw', (data) => {
        // desenha os eventos que vieram do servidor
        if (!ctx) return;
        drawRemote(data);
    });

    socket.on('clear_canvas', () => {
        clearCanvasLocal();
    });
}

function initCanvas() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // ajustar tamanho responsivo mantendo proporção
    function resizeCanvas() {
        const ratio = 16 / 9;
        const maxW = Math.min(1000, window.innerWidth - 40);
        canvas.width = Math.round(maxW);
        canvas.height = Math.round(maxW / ratio);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousedown', (e) => { drawing = true;
        last = getPos(e);
        sendEvent('mousedown', last); });
    canvas.addEventListener('mousemove', (e) => { if (!drawing) return; const p = getPos(e);
        sendEvent('mousemove', p);
        last = p;
        drawLine(last.x, last.y, p.x, p.y); });
    canvas.addEventListener('mouseup', (e) => { drawing = false;
        sendEvent('mouseup', getPos(e)); });
    canvas.addEventListener('mouseleave', () => { drawing = false; });

    // touch events
    canvas.addEventListener('touchstart', (e) => { e.preventDefault();
        drawing = true;
        last = getTouchPos(e);
        sendEvent('mousedown', last); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!drawing) return; const p = getTouchPos(e);
        sendEvent('mousemove', p);
        drawLine(last.x, last.y, p.x, p.y);
        last = p; });
    canvas.addEventListener('touchend', (e) => { drawing = false;
        sendEvent('mouseup', {}); });
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getTouchPos(e) {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function sendEvent(event, pos) {
    if (!socket || !window.GAME) return;
    socket.emit('draw', { room: window.GAME.room, event, x: pos.x, y: pos.y, color: '#000', width: 3 });
}

function drawLine(x1, y1, x2, y2) {
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawRemote(data) {
    // os dados do remote virão com x,y,event
    if (!ctx) return;
    // simples: quando receber mousemove com coords, desenha linha curta
    // em implementação mais avançada você reconstrói path
    if (data.event === 'mousemove') {
        drawLine(data.x - 1, data.y - 1, data.x, data.y);
    }
}

function clearCanvasLocal() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function limparCanvas() {
    clearCanvasLocal();
    if (socket && window.GAME) {
        socket.emit('clear_canvas', { room: window.GAME.room });
    }
}

function initDrawing() {
    initSocket();
    initCanvas();
    // ligar botão limpar se houver
    const btn = document.getElementById('clearBtn');
    if (btn) btn.addEventListener('click', limparCanvas);
}

// se o template chamou initDrawing() já vai inicializar