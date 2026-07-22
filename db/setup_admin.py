#!/usr/bin/env python3
"""
Crea el primer usuario Administrador en rossmille_db.
Requiere: pip3 install bcrypt
"""

import subprocess
import sys

def instalar_bcrypt():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "bcrypt"], stdout=subprocess.DEVNULL)

try:
    import bcrypt
except ImportError:
    print("Instalando bcrypt...")
    instalar_bcrypt()
    import bcrypt

print("=== ROSS MILLE - Crear primer Administrador ===\n")

id_usuario = input("ID del administrador (7 a 10 digitos numericos): ").strip()
if not id_usuario.isdigit() or not (7 <= len(id_usuario) <= 10):
    print("Error: el ID debe ser numerico y tener entre 7 y 10 digitos.")
    sys.exit(1)

nombre = input("Nombre del administrador: ").strip()
if not nombre:
    print("Error: el nombre no puede estar vacio.")
    sys.exit(1)

password = input("Contrasena (minimo 6 caracteres): ").strip()
if len(password) < 6:
    print("Error: la contrasena debe tener al menos 6 caracteres.")
    sys.exit(1)

hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")

sql = (
    "INSERT INTO usuarios (id_usuario, nombre_usuario, rol_usuarios, contrasena) "
    f"VALUES ('{id_usuario}', '{nombre}', 'Administrador', '{hashed}');"
)

print("\n--- Ejecuta este comando para insertar el admin ---\n")
print(
    f"docker exec -i rossmille_mysql "
    f"mysql -uRossMille -pRossMillB01 rossmille_db "
    f'-e "{sql}"'
)
print("\nO copia el SQL y ejecutalo manualmente dentro del contenedor.")
print(f"\nSQL:\n{sql}")
