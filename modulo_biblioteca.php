<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$stmt = $conn->query("SELECT * FROM libros");
$libros = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteca - Gestión</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <?php include 'includes/sidebar.php'; ?>
    <main class="main-content">
        <h1>Gestión de Biblioteca</h1>
        <div class="books-grid">
            <?php foreach($libros as $libro): ?>
            <div class="book-card">
                <h3><?= htmlspecialchars($libro['titulo']) ?></h3>
                <p>Autor: <?= htmlspecialchars($libro['autor']) ?></p>
                <p>Disponibles: <?= $libro['cantidad_disponible'] ?></p>
                <button class="btn-prestamo" data-id="<?= $libro['id'] ?>">Prestar</button>
            </div>
            <?php endforeach; ?>
        </div>
    </main>
    <script src="script.js"></script>
</body>
</html>