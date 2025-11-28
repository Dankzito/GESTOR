-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-11-2025 a las 14:54:09
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestor_modulos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencias`
--

CREATE TABLE `asistencias` (
  `id` varchar(50) NOT NULL,
  `alumnoId` varchar(50) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asistencias`
--

INSERT INTO `asistencias` (`id`, `alumnoId`, `estado`, `fecha`) VALUES
('9Gp4rIdYiGFIgxKbeUqCJ', 'JG30w4Myk1Kk49LvCDBLH', 'ausente', '2025-11-27 18:10:03'),
('N7I0gNXahjdiQUG5d_mdj', 'gaFaZUe1jpGOUB8J8PTry', 'presente', '2025-11-27 18:11:00'),
('TigD0K_P0cx5Q8mygs20c', 'gaFaZUe1jpGOUB8J8PTry', 'tardanza', '2025-11-27 18:10:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones`
--

CREATE TABLE `calificaciones` (
  `id` varchar(50) NOT NULL,
  `alumnoId` varchar(50) DEFAULT NULL,
  `nota` int(11) DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `profesorId` varchar(50) DEFAULT NULL,
  `materia` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calificaciones`
--

INSERT INTO `calificaciones` (`id`, `alumnoId`, `nota`, `comentario`, `fecha`, `profesorId`, `materia`) VALUES
('e2tXUpjb-K1Dus514L-xg', 'JG30w4Myk1Kk49LvCDBLH', 10, 'Aprobado', '2025-11-27 18:35:44', 'ngOB5P69aYxnMyPRo30zL', 'Modelos y Sistemas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `dni` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `nombre`, `dni`) VALUES
('gaFaZUe1jpGOUB8J8PTry', 'Gabriel Beneitez', '47983913'),
('JG30w4Myk1Kk49LvCDBLH', 'Insaurralde Carlos', '45430071');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modules`
--

CREATE TABLE `modules` (
  `id` varchar(50) NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `slug` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modules`
--

INSERT INTO `modules` (`id`, `name`, `slug`) VALUES
('m-alum', 'Gestor de Estudiantes', 'estudiantes'),
('m-asist', 'Gestor de Asistencias', 'asistencias'),
('m-calif', 'Gestor de Calificaciones', 'calificaciones'),
('m-prof', 'Gestor de Profesores', 'profesores');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesores`
--

CREATE TABLE `profesores` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `materia` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `profesores`
--

INSERT INTO `profesores` (`id`, `nombre`, `materia`) VALUES
('ngOB5P69aYxnMyPRo30zL', 'Eduardo Piris', 'Modelos y Sistemas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password` varchar(300) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `nombre`, `email`, `password`, `role`, `created_at`) VALUES
('admin-1', 'Administrador', 'admin@local', '$2b$10$smfBAGMgVDArhjLfcW9U/uIzPyXfuaK68YzQdmrfv7VIFd1y017Hi', 'admin', '2025-11-27 20:12:20');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alumnoId` (`alumnoId`);

--
-- Indices de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alumnoId` (`alumnoId`),
  ADD KEY `fk_calif_prof` (`profesorId`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`alumnoId`) REFERENCES `estudiantes` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`alumnoId`) REFERENCES `estudiantes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_calif_prof` FOREIGN KEY (`profesorId`) REFERENCES `profesores` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
