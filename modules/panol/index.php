<?php
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit();
}

// Obtener herramientas
$stmt = $conn->query("SELECT * FROM herramientas");
$herramientas = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Pañol</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <?php include '../../includes/sidebar.php'; ?>
    
    <main class="main-content">
        <header class="module-header">
            <h1><i class="fas fa-tools"></i> Gestión de Pañol</h1>
            <button class="btn-primary" id="nuevaHerramienta">
                <i class="fas fa-plus"></i> Nueva Herramienta
            </button>
        </header>

        <div class="tools-container">
            <div class="tools-filters">
                <input type="text" placeholder="Buscar herramienta..." id="searchTool">
                <select id="filterStatus">
                    <option value="">Todos los estados</option>
                    <option value="disponible">Disponible</option>
                    <option value="prestado">Prestado</option>
                    <option value="mantenimiento">En mantenimiento</option>
                </select>
            </div>

            <div class="tools-grid">
                <?php foreach ($herramientas as $herramienta): ?>
                <div class="tool-card">
                    <div class="tool-header">
                        <h3><?= htmlspecialchars($herramienta['nombre']) ?></h3>
                        <span class="tool-status <?= $herramienta['estado'] ?>">
                            <?= ucfirst($herramienta['estado']) ?>
                        </span>
                    </div>
                    <div class="tool-info">
                        <p><strong>Código:</strong> <?= htmlspecialchars($herramienta['codigo']) ?></p>
                        <p><strong>Disponibles:</strong> <?= $herramienta['cantidad_disponible'] ?>/<?= $herramienta['cantidad_total'] ?></p>
                    </div>
                    <div class="tool-actions">
                        <button class="btn-prestamo" data-id="<?= $herramienta['id'] ?>">
                            <i class="fas fa-hand-holding"></i> Prestar
                        </button>
                        <button class="btn-edit" data-id="<?= $herramienta['id'] ?>">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-history" data-id="<?= $herramienta['id'] ?>">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </main>

    <!-- Modal de préstamo -->
    <div id="prestamoModal" class="modal">
        <!-- Contenido del modal -->
    </div>

    <script src="/assets/js/utils.js"></script>
    <script src="script.js"></script>
</body>
</html>