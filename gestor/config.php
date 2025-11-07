<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'sistema_escolar');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Configuración de la aplicación
define('APP_NAME', 'Sistema Administrativo Escolar');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'America/Argentina/Buenos_Aires');

// Configurar zona horaria
date_default_timezone_set(TIMEZONE);

// Configuración de sesión
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);

// Iniciar sesión solo si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Clase de conexión a base de datos
class Database {
    private static $instance = null;
    private $conn;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            die("Error de conexión a la base de datos. Verifique que MySQL esté corriendo y que la base de datos 'sistema_escolar' exista.");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    private function __clone() {}
    
    public function __wakeup() {
        throw new Exception("No se puede deserializar un singleton");
    }
}

// Función auxiliar para obtener la conexión
function getDB() {
    return Database::getInstance()->getConnection();
}

// Función para verificar si el usuario está logueado
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['user_email']);
}

// Función para requerir login
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit();
    }
}

// Función para verificar rol
function hasRole($roles) {
    if (!isLoggedIn()) {
        return false;
    }
    
    if (is_string($roles)) {
        $roles = [$roles];
    }
    
    return in_array($_SESSION['user_role'], $roles);
}

// Función para requerir rol específico
function requireRole($roles) {
    requireLogin();
    
    if (!hasRole($roles)) {
        header('Location: index.php?error=no_permission');
        exit();
    }
}

// Función para sanitizar input
function sanitize($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Función para redirigir
function redirect($url) {
    header("Location: $url");
    exit();
}

// Manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 1); // Cambiar a 0 en producción
ini_set('log_errors', 1);
?>