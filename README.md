
# Gestor de Módulos (Node.js + MySQL)

Proyecto básico de gestión escolar con roles (admin, maestro, alumno) usando MySQL (pensado para XAMPP) y Express/EJS.

## Requisitos
- Node.js >= 16
- XAMPP (MySQL/MariaDB) o servidor MySQL
- `npm install`

## Configuración (XAMPP)
1. Crear la base de datos y tablas ejecutando el script `sql/create_db.sql` en phpMyAdmin o desde la consola MySQL.
2. Copiar `.env.example` a `.env` y ajustar los datos de conexión (HOST, USER, PASSWORD, DATABASE).
3. `npm install`
4. `npm run dev` o `npm start`
5. Abrir `http://localhost:3000`

Cuenta admin por defecto que se crea al iniciar (si no existe):
- Email: admin@local
- Password: admin123

(El servidor hashgea la contraseña en el primer inicio si no existe aún).

