const header = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  // Verifica se o usuário rolou para baixo e se não está no topo absoluto da página
  if (window.scrollY > lastScrollY && window.scrollY > 100) {
    header.classList.add('header-hidden'); // Some com o cabeçalho
  } else {
    header.classList.remove('header-hidden'); // Volta com o cabeçalho
  }
  
  lastScrollY = window.scrollY;
});
