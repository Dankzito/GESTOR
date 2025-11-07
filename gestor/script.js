// Configuración global
const CONFIG = {
    modules: {
        panol: 'modulo_panol.php',
        alumnos: 'modulo_alumnos.php',
        biblioteca: 'modulo_biblioteca.php',
        directivos: 'modulo_directivos.php'
    },
    pages: {
        panol: 'modulo_panol.php',
        estudiantes: 'modulo_alumnos.php',
        tutores: 'tutores.php',
        biblioteca: 'modulo_biblioteca.php'
    },
    urls: {
        config: 'configuracion.php',
        perfil: 'perfil.php',
        logout: 'logout.php'
    }
};

// Clase para manejar la navegación
class NavigationManager {
    constructor() {
        this.currentModule = null;
        this.init();
    }

    init() {
        this.setupModuleCards();
        this.setupSidebarNavigation();
        this.setupUserControls();
        this.setupMenuToggle();
    }

    // Navegación de módulos principales
    setupModuleCards() {
        const moduleCards = document.querySelectorAll('.module-card');
        
        moduleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const module = card.getAttribute('data-module');
                this.navigateToModule(module);
            });

            card.addEventListener('mouseenter', () => {
                this.animateModuleCard(card, true);
            });

            card.addEventListener('mouseleave', () => {
                this.animateModuleCard(card, false);
            });
        });
    }

    // Navegar a un módulo específico
    navigateToModule(module) {
        if (!CONFIG.modules[module]) {
            console.error(`Módulo ${module} no encontrado`);
            this.showNotification('error', 'Módulo no disponible');
            return;
        }

        this.currentModule = module;
        console.log(`Navegando al módulo: ${module}`);
        
        this.showLoading();
        
        setTimeout(() => {
            window.location.href = CONFIG.modules[module];
        }, 300);
    }

    // Navegación del sidebar
    setupSidebarNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                this.navigateToPage(page);
            });

            item.addEventListener('mouseenter', () => {
                this.highlightNavItem(item);
            });
        });
    }

    // Navegar a una página del sidebar
    navigateToPage(page) {
        if (!CONFIG.pages[page]) {
            console.error(`Página ${page} no encontrada`);
            return;
        }

        console.log(`Navegando a: ${page}`);
        this.showLoading();
        
        setTimeout(() => {
            window.location.href = CONFIG.pages[page];
        }, 300);
    }

    // Controles de usuario
    setupUserControls() {
        const configIcon = document.querySelector('.config-icon');
        const userIcon = document.querySelector('.user-icon');

        if (configIcon) {
            configIcon.addEventListener('click', () => {
                this.openConfiguration();
            });
        }

        if (userIcon) {
            userIcon.addEventListener('click', () => {
                this.openUserProfile();
            });
        }
    }

    // Abrir configuración
    openConfiguration() {
        console.log('Abriendo configuración del sistema');
        alert('Módulo de configuración en desarrollo');
    }

    // Abrir perfil de usuario
    openUserProfile() {
        console.log('Abriendo perfil de usuario');
        this.showModal('userProfile');
    }

    // Toggle del menú hamburguesa
    setupMenuToggle() {
        const menuIcon = document.querySelector('.menu-icon');
        const sidebar = document.querySelector('.sidebar');

        if (menuIcon && sidebar) {
            menuIcon.addEventListener('click', () => {
                sidebar.classList.toggle('expanded');
                this.toggleSidebar(sidebar);
            });
        }
    }

    // Expandir/contraer sidebar
    toggleSidebar(sidebar) {
        const isExpanded = sidebar.classList.contains('expanded');
        
        if (isExpanded) {
            sidebar.style.width = '250px';
            console.log('Sidebar expandido');
        } else {
            sidebar.style.width = '100px';
            console.log('Sidebar contraído');
        }
    }

    // Animación de tarjetas de módulos
    animateModuleCard(card, isEntering) {
        const status = card.querySelector('.module-status');
        
        if (isEntering) {
            status.style.transform = 'scale(1.2) rotate(10deg)';
            card.style.borderWidth = '4px';
        } else {
            status.style.transform = 'scale(1) rotate(0deg)';
            card.style.borderWidth = '3px';
        }
    }

    // Resaltar item de navegación
    highlightNavItem(item) {
        const allItems = document.querySelectorAll('.nav-item');
        allItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    }

    // Mostrar loading overlay
    showLoading() {
        let loader = document.querySelector('.loader-overlay');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="loader-spinner">
                    <div class="spinner"></div>
                    <p>Cargando...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    }

    // Mostrar notificaciones
    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Mostrar modal
    showModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        let content = '';
        
        switch(type) {
            case 'userProfile':
                content = this.getUserProfileModal();
                break;
            default:
                content = '<p>Contenido del modal</p>';
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getUserProfileModal() {
        return `
            <h2>Perfil de Usuario</h2>
            <div class="profile-info">
                <p><strong>Sesión activa</strong></p>
                <button class="btn-logout" onclick="navigationManager.logout()">Cerrar Sesión</button>
            </div>
        `;
    }

    // Cerrar sesión
    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            console.log('Cerrando sesión...');
            this.showLoading();
            
            setTimeout(() => {
                window.location.href = CONFIG.urls.logout;
            }, 500);
        }
    }
}

// Inicializar cuando el DOM esté listo
let navigationManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema administrativo iniciado');
    
    navigationManager = new NavigationManager();
    addDynamicStyles();
    
    console.log('Todos los sistemas operativos');
});

// Agregar estilos para componentes dinámicos
function addDynamicStyles() {
    const styles = `
        <style>
            .loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(3, 28, 48, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            
            .loader-spinner {
                text-align: center;
                color: white;
            }
            
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s;
                z-index: 9998;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification-error {
                border-left: 4px solid #e74c3c;
            }
            
            .notification-success {
                border-left: 4px solid #2ecc71;
            }
            
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9997;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                position: relative;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            
            .modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 28px;
                cursor: pointer;
                color: #666;
            }
            
            .modal-close:hover {
                color: #031C30;
            }
            
            .profile-info {
                margin-top: 20px;
            }
            
            .profile-info p {
                margin: 10px 0;
                color: #031C30;
            }
            
            .btn-logout {
                margin-top: 20px;
                padding: 10px 20px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
            }
            
            .btn-logout:hover {
                background: #c0392b;
                transform: translateY(-2px);
            }
            
            .nav-item.active {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
            }
            
            .sidebar.expanded {
                transition: width 0.3s ease;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

window.addEventListener('error', function(e) {
    console.error('Error capturado:', e.message);
});