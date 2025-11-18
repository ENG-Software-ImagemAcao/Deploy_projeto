CREATE DATABASE JOGO-IMACAO;

-- Usuários
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- Salas
CREATE TABLE sala (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    codigo_sala VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'esperando',
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- Participação de usuários nas salas
CREATE TABLE participacao (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
    sala_id INTEGER REFERENCES sala(id) ON DELETE CASCADE,
    pontuacao INTEGER DEFAULT 0,
    papel VARCHAR(20) DEFAULT 'jogador'
);

-- Palavras do jogo
CREATE TABLE palavra (
    id SERIAL PRIMARY KEY,
    texto VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50)
);

-- Rodadas
CREATE TABLE rodada (
    id SERIAL PRIMARY KEY,
    sala_id INTEGER REFERENCES sala(id) ON DELETE CASCADE,
    palavra_id INTEGER REFERENCES palavra(id),
    desenhista_id INTEGER REFERENCES usuario(id),
    tempo_inicio TIMESTAMP,
    tempo_fim TIMESTAMP,
    status VARCHAR(30) DEFAULT 'em_andamento'
);

-- Tentativas (mensagens/palpites)
CREATE TABLE tentativa (
    id SERIAL PRIMARY KEY,
    rodada_id INTEGER REFERENCES rodada(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuario(id),
    texto TEXT NOT NULL,
    acertou BOOLEAN DEFAULT FALSE,
    horario TIMESTAMP DEFAULT NOW()
);
