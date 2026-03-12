from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

import json

app = Flask(__name__)
# Permitir solicitudes CORS desde cualquier origen para testing local
CORS(app)

DB_FILE = 'compras.db'

def init_db():
    """Crea las tablas si no existen en la base local SQLite y rellena el catalogo."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Tabla de Ventas/Pedidos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS compras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrumentos TEXT NOT NULL,
            total INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            email TEXT NOT NULL,
            direccion TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de Productos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            precio INTEGER NOT NULL,
            descripcion TEXT NOT NULL,
            icono TEXT NOT NULL,
            detalles TEXT NOT NULL
        )
    ''')
    
    # Rellenar catalogo si esta vacio
    cursor.execute('SELECT COUNT(*) FROM productos')
    if cursor.fetchone()[0] == 0:
        productos_iniciales = [
            ("Guitarra Les Paul Custom", 650000, "La mítica guitarra de Bocchi-chan. Perfecta para esconderse en armarios y tocar solos épicos.", "🎸", "Cuerpo sólido de caoba, pastillas humbucker. Peso: 4.5kg. Color negro acabado brillante."),
            ("Batería Acústica Yamaha", 850000, "El set de batería de Nijika. Ideal para mantener el ritmo y ser el pegamento de la banda.", "🥁", "Bombo de 22'', Toms de 10'', 12'' y 16''. Incluye platillos Zildjian K y herrajes resistentes."),
            ("Bajo Fender Precision", 580000, "El bajo de Roy Yamada. Te hará lucir genial, aunque tengas que comer pasto para pagarlo.", "🎸", "Mástil de arce, diapasón de palisandro. Pastilla split-coil P-Bass. Sonido contundente y redondo."),
            ("Micrófono + Guitarra Junior", 320000, "El kit inicial de Kita-chan. Para cantar con toda la energía 'Ikuyo!' y brillar en el escenario.", "🎤", "Guitarra de escala corta roja. Micro dinámico cardioide Shure con cable XLR y pedestal trípode."),
            ("Set de Púas Kessoku Band", 15000, "Pack de 6 púas exclusivas con los logos y colores de las chicas.", "🔰", "Grosor medio (0.88mm), material tortex antideslizante para evitar que salgan volando en el solo.")
        ]
        cursor.executemany('INSERT INTO productos (nombre, precio, descripcion, icono, detalles) VALUES (?, ?, ?, ?, ?)', productos_iniciales)
        print("Catalogo de productos inicializado.")

    conn.commit()
    conn.close()

@app.route('/api/productos', methods=['GET'])
def get_productos():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Return dicts instead of tuples
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM productos')
    productos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(productos)

@app.route('/api/comprar', methods=['POST'])
def comprar():
    data = request.json
    
    # Validar datos básicos
    if not all(k in data for k in ("cart", "nombre", "email", "direccion", "total")):
        return jsonify({"error": "Faltan datos"}), 400

    try:
        # Convertir la lista del carrito a un string JSON para guardarla facil
        cart_str = json.dumps(data['cart'])
        total = int(data['total'])
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO compras (instrumentos, total, nombre, email, direccion) VALUES (?, ?, ?, ?, ?)',
            (cart_str, total, data['nombre'], data['email'], data['direccion'])
        )
        conn.commit()
        conn.close()
        
        print(f"EXITO: NUEVA COMPRA REGISTRADA!: {data['nombre']} compro un total de ${total}")
        return jsonify({"mensaje": "Compra guardada con éxito"}), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR: Error al guardar: {e}")
        return jsonify({"error": "Error interno"}), 500

if __name__ == '__main__':
    # Initialize database when starting the server
    print("Inicializando base de datos SQLite 'compras.db'...")
    init_db()
    
    print("\n--- EL SERVIDOR DE KESSOKU BAND ESTA EN LINEA ---")
    print("API disponible en: http://localhost:5000/api/comprar\n")
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
