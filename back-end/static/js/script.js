document.getElementById("formCadastro").addEventListener("submit", function(e) {
    const email = this.email.value;
    const confirmEmail = this.confirmEmail.value;
    const senha = this.senha.value;
    const confirmSenha = this.confirmSenha.value;

    if (email !== confirmEmail) {
        e.preventDefault();
        alert("Os emails não coincidem!");
    }

    if (senha !== confirmSenha) {
        e.preventDefault();
        alert("As senhas não coincidem!");
    }
});

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

let desenhando = false;

// Começar a desenhar
canvas.addEventListener("mousedown", () => {
    desenhando = true;
});

canvas.addEventListener("mouseup", () => {
    desenhando = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", desenhar);

function desenhar(event) {
    if (!desenhando) return;

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}

//FUNÇÃO LIMPAR TELA
function limparTela() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}