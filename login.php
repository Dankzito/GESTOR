<?php
session_start();
require_once 'config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $rol = 'profesor'; // Default role

    try {
        $stmt = $conn->prepare("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)");
        $stmt->execute([$username, $password, $rol]);
        header('Location: login.php?registro=exitoso');
        exit();
    } catch(PDOException $e) {
        $error = "Error al registrar usuario";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - Panel Administrativo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <h2>Registro</h2>
        <?php if (isset($error)) echo "<p class='error'>$error</p>"; ?>
        <form method="POST" action="">
            <div class="form-group">
                <label for="username">Usuario:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Registrarse</button>
        </form>
        <p>¿Ya tienes cuenta? <a href="login.php">Inicia sesión</a></p>
    </div>
</body>
</html>