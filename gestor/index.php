<?php
require_once 'config.php';
requireLogin(); // Requiere que el usuario esté logueado

$userName = $_SESSION['user_name'] ?? 'Usuario';
$userRole = $_SESSION['user_role'] ?? 'usuario';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inicio - Panel Administrativo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <aside class="sidebar">
        <div class="menu-icon">☰</div>
        
        <nav class="nav-items">
            <div class="nav-item" data-page="panol" title="Pañol">P</div>
            <div class="nav-item" data-page="estudiantes" title="Estudiantes">E</div>
            <div class="nav-item" data-page="tutores" title="Tutores">T</div>
            <div class="nav-item" data-page="biblioteca" title="Biblioteca">B</div>
        </nav>

        <div class="settings-icons">
            <div class="settings-icon user-icon" title="Perfil">👤</div>
            <div class="settings-icon config-icon" title="Configuración">⚙</div>
        </div>
    </aside>

   <main class="main-content">
        <header class="header">
            <h1>Inicio</h1>
        </header>

        <div class="welcome">
            <p>¡Bienvenido, <?php echo htmlspecialchars($userName); ?>!</p>
            <span class="user-role"><?php echo ucfirst($userRole); ?></span>
        </div>

        <section class="modules-section">
            <h2 class="section-title">Módulos</h2>
            
            <div class="modules-grid">
                <div class="module-card" data-module="panol">
                    <span class="module-label">Módulo del pañol</span>
                    <div class="module-content">
                        <h3>Pañol</h3>
                        <p class="module-description">Gestión de inventario y préstamos</p>
                    </div>
                    <div class="module-status">👁</div>
                </div>

                <div class="module-card" data-module="alumnos">
                    <span class="module-label">Módulo de alumnos</span>
                    <div class="module-content">
                        <h3>Gestión de alumnos</h3>
                        <p class="module-description">Administrar estudiantes e información académica</p>
                    </div>
                    <div class="module-status">👁</div>
                </div>

                <div class="module-card" data-module="biblioteca">
                    <span class="module-label">Módulo de biblioteca</span>
                    <div class="module-content">
                        <h3>Biblioteca</h3>
                        <p class="module-description">Control de libros y préstamos</p>
                    </div>
                    <div class="module-status">👁</div>
                </div>

                <div class="module-card" data-module="directivos">
                    <span class="module-label">Módulo de directivos</span>
                    <div class="module-content">
                        <h3>Directivos</h3>
                        <p class="module-description">Gestión administrativa y reportes</p>
                    </div>
                    <div class="module-status">👁</div>
                </div>
            </div>
        </section>
    </main>

    <script src="script.js"></script>
</body>
</html>