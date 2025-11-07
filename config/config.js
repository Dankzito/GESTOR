const APP_CONFIG = {
    modules: {
        dashboard: {
            name: 'Dashboard',
            path: '/dashboard',
            icon: '📊'
        },
        panol: {
            name: 'Pañol',
            path: '/modulo_panol',
            icon: '🛠️'
        },
        estudiantes: {
            name: 'Estudiantes',
            path: '/modulo_estudiantes',
            icon: '👥'
        },
        biblioteca: {
            name: 'Biblioteca',
            path: '/modulo_biblioteca',
            icon: '📚'
        },
        tutores: {
            name: 'Tutores',
            path: '/modulo_tutores',
            icon: '👨‍🏫'
        }
    },
    api: {
        base: '/api/v1',
        endpoints: {
            auth: '/auth',
            users: '/users',
            stats: '/stats'
        }
    }
};