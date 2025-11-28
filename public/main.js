// Confirmación de eliminación
document.addEventListener('submit', function(e){
  const form = e.target;
  if (form.matches('form') && form.innerHTML.includes('Eliminar')) {
    if (!confirm('¿Seguro que querés eliminar?')) {
      e.preventDefault();
    }
  }
});

// Menú lateral desplegable mejorado
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main');
  
  if (hamburger && sidebar) {
    // Función para toggle del menú
    function toggleSidebar() {
      sidebar.classList.toggle('expanded');
      if (main) {
        main.classList.toggle('sidebar-expanded');
      }
      // Guardar estado en localStorage
      localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
    }
    
    // Restaurar estado del menú desde localStorage
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState === 'true' && window.innerWidth > 768) {
      sidebar.classList.add('expanded');
      if (main) {
        main.classList.add('sidebar-expanded');
      }
    }
    
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });
    
    // Cerrar menú al hacer clic fuera en móviles
    if (window.innerWidth <= 768) {
      document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('expanded') && 
            !sidebar.contains(e.target) && 
            !hamburger.contains(e.target)) {
          sidebar.classList.remove('expanded');
          if (main) {
            main.classList.remove('sidebar-expanded');
          }
        }
      });
    }
    
    // Cerrar menú al hacer clic en un enlace del menú en móviles
    const navLinks = sidebar.querySelectorAll('.navbtn');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
          setTimeout(() => {
            sidebar.classList.remove('expanded');
            if (main) {
              main.classList.remove('sidebar-expanded');
            }
          }, 200);
        }
      });
    });
    
    // Ajustar menú en resize
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('expanded');
        if (main) {
          main.classList.remove('sidebar-expanded');
        }
      }
    });
  }
  
  // Manejo del modal de login
  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  const closeModal = document.querySelector('.close');
  
  if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', function() {
      loginModal.style.display = 'block';
    });
  }
  
  if (closeModal && loginModal) {
    closeModal.addEventListener('click', function() {
      loginModal.style.display = 'none';
    });
  }
  
  // Cerrar modal al hacer clic fuera
  if (loginModal) {
    window.addEventListener('click', function(e) {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
      }
    });
  }
  
  // Manejo del formulario de login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const errorMsg = document.getElementById('errorMsg');
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = data.redirect || '/dashboard';
        } else {
          if (errorMsg) {
            errorMsg.textContent = data.error || 'Error al iniciar sesión';
            errorMsg.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Error:', err);
        if (errorMsg) {
          errorMsg.textContent = 'Error de conexión';
          errorMsg.style.display = 'block';
        }
      }
    });
  }
});