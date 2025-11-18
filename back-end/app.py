# app.py
from flask import Flask, render_template, request, redirect, url_for, abort
from flask_socketio import SocketIO, join_room, leave_room, emit
from config import POSTGRES_CONFIG
import psycopg2
import random
import string

app = Flask(__name__)
socketio = SocketIO(app)


# ---------------------------------------------------
#  1 — Conexão com o Supabase Postgres
# ---------------------------------------------------
def get_conn():
    return psycopg2.connect(
        host=POSTGRES_CONFIG['host'],
        port=POSTGRES_CONFIG['port'],
        user=POSTGRES_CONFIG['user'],
        password=POSTGRES_CONFIG['password'],
        database=POSTGRES_CONFIG['database']
    )


# ---------------------------------------------------
#   2 — Criar tabelas se não existirem
# ---------------------------------------------------
def create_tables():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        room VARCHAR(10) UNIQUE NOT NULL,
        word_id INTEGER REFERENCES words(id),
        created_at TIMESTAMP DEFAULT NOW()
    );
    """)

    conn.commit()
    cur.close()
    conn.close()


create_tables()


# ---------------------------------------------------
#  3 — Helpers
# ---------------------------------------------------
def random_room(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))


def get_random_word(category_id=None):
    conn = get_conn()
    cur = conn.cursor()

    if category_id:
        cur.execute("SELECT text FROM words WHERE category_id = %s ORDER BY RANDOM() LIMIT 1",
                    (category_id,))
    else:
        cur.execute("SELECT text FROM words ORDER BY RANDOM() LIMIT 1")

    row = cur.fetchone()
    cur.close()
    conn.close()

    return row[0] if row else "Sem palavras"


# ---------------------------------------------------
#  4 — Rotas
# ---------------------------------------------------

@app.route('/')
def homepage():
    return render_template('homepage.html')


@app.route('/categorias')
def categorias():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM categories ORDER BY name ASC")
    categorias = cur.fetchall()
    cur.close()
    conn.close()

    return render_template('categorias.html', categorias=categorias)


@app.route('/tempo')
def tempo():
    return render_template('tempo.html')


@app.route('/criar_game', methods=['POST'])
def criar_game():
    room = random_room()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO games (room) VALUES (%s) RETURNING id", (room,))
    conn.commit()
    cur.close()
    conn.close()

    return redirect(url_for('desenhar', room=room))


@app.route('/entrar/<room>')
def entrar(room):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT room FROM games WHERE room = %s", (room,))
    game = cur.fetchone()
    cur.close()
    conn.close()

    if not game:
        abort(404)

    palavra = get_random_word()

    return render_template("desenhar.html", room=room, palavra=palavra, tempo=60)


@app.route('/desenhar/<room>')
def desenhar(room):
    palavra = get_random_word()
    return render_template("desenhar.html", room=room, palavra=palavra, tempo=60)


# ---------------------------------------------------
#  5 — Eventos WebSocket (desenho em tempo real)
# ---------------------------------------------------

@socketio.on('join')
def handle_join(data):
    room = data['room']
    join_room(room)
    emit('status', {'msg': f'Um jogador entrou na sala {room}.'}, to=room)


@socketio.on('draw')
def handle_draw(data):
    room = data['room']
    emit('draw', data, to=room, include_self=False)


@socketio.on('clear_canvas')
def handle_clear(data):
    room = data['room']
    emit('clear_canvas', {}, to=room)


# ---------------------------------------------------
#  6 — Run
# ---------------------------------------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
