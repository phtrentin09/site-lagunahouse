(function(){
  "use strict";

  /* ---------- menu ---------- */
  var btn = document.querySelector('.menu-btn'), nav = document.querySelector('.nav');
  if(btn && nav){
    btn.addEventListener('click', function(){
      var on = nav.classList.toggle('aberto');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    nav.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){ nav.classList.remove('aberto'); btn.setAttribute('aria-expanded','false'); }
    });
  }

  /* ---------- modo revisão ---------- */
  function revAtivo(){
    try{
      if(/[?&]revisao=1/.test(location.search)) return true;
      if(location.hash.indexOf('revisao=1') > -1) return true;
      return localStorage.getItem('lh_revisao') === '1';
    }catch(e){ return /[?&]revisao=1/.test(location.search); }
  }
  if(revAtivo()){
    document.body.classList.add('revisao');
    try{ localStorage.setItem('lh_revisao','1'); }catch(e){}
  }
  var rb = document.getElementById('revBotao');
  if(rb){
    rb.addEventListener('click', function(){
      document.body.classList.remove('revisao');
      try{ localStorage.removeItem('lh_revisao'); }catch(e){}
    });
  }

  /* ---------- navegação entre páginas no arquivo único ---------- */
  var SPA = !!window.__LH_SPA__;
  function paginaAtual(){
    var h = location.hash.replace(/^#\/?/, '').split('?')[0];
    return h || 'index';
  }
  function mostrar(nome, rolar){
    var achou = false;
    document.querySelectorAll('[data-pagina]').forEach(function(s){
      var eu = s.getAttribute('data-pagina') === nome;
      s.hidden = !eu;
      if(eu) achou = true;
    });
    if(!achou){
      document.querySelectorAll('[data-pagina]').forEach(function(s){
        s.hidden = s.getAttribute('data-pagina') !== 'index';
      });
      nome = 'index';
    }
    document.querySelectorAll('.nav a[data-rota]').forEach(function(a){
      a.classList.toggle('ativo', a.getAttribute('data-rota') === nome);
    });
    var t = document.querySelector('[data-pagina]:not([hidden])');
    if(t && t.dataset.titulo) document.title = t.dataset.titulo;
    if(rolar) window.scrollTo(0,0);
    montarGaleria();
  }
  if(SPA){
    window.addEventListener('hashchange', function(){ mostrar(paginaAtual(), true); });
    mostrar(paginaAtual(), false);
  }

  /* ---------- galeria com visor ---------- */
  var visor, visorImg, visorTxt, fotos = [], indice = 0;
  function montarGaleria(){
    fotos = [];
    var esc = document.querySelectorAll('[data-pagina]:not([hidden]) .galeria figure, body:not(.spa) .galeria figure');
    var alvo = SPA ? document.querySelectorAll('[data-pagina]:not([hidden]) .galeria figure') : document.querySelectorAll('.galeria figure');
    alvo.forEach(function(f, i){
      var img = f.querySelector('img'), cap = f.querySelector('figcaption');
      fotos.push({ src: img.getAttribute('src'), txt: cap ? cap.textContent : (img.alt || '') });
      if(!f.dataset.pronto){
        f.dataset.pronto = '1';
        f.setAttribute('tabindex','0');
        f.setAttribute('role','button');
        f.addEventListener('click', function(){ abrir(Array.prototype.indexOf.call(alvo, f)); });
        f.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); abrir(Array.prototype.indexOf.call(alvo, f)); }
        });
      }
    });
    void esc;
  }
  function criarVisor(){
    if(visor) return;
    visor = document.createElement('div');
    visor.className = 'lb';
    visor.innerHTML = '<button class="fechar" aria-label="Fechar">&times;</button>' +
      '<button class="ant" aria-label="Anterior">&#8249;</button>' +
      '<img alt=""><button class="prox" aria-label="Próxima">&#8250;</button>' +
      '<div class="lb-txt"></div>';
    document.body.appendChild(visor);
    visorImg = visor.querySelector('img');
    visorTxt = visor.querySelector('.lb-txt');
    visor.querySelector('.fechar').addEventListener('click', fechar);
    visor.querySelector('.ant').addEventListener('click', function(e){ e.stopPropagation(); passo(-1); });
    visor.querySelector('.prox').addEventListener('click', function(e){ e.stopPropagation(); passo(1); });
    visor.addEventListener('click', function(e){ if(e.target === visor) fechar(); });
    document.addEventListener('keydown', function(e){
      if(!visor.classList.contains('on')) return;
      if(e.key === 'Escape') fechar();
      if(e.key === 'ArrowRight') passo(1);
      if(e.key === 'ArrowLeft') passo(-1);
    });
  }
  function abrir(i){
    criarVisor(); indice = i; pintar();
    visor.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  function fechar(){ visor.classList.remove('on'); document.body.style.overflow = ''; }
  function passo(d){ indice = (indice + d + fotos.length) % fotos.length; pintar(); }
  function pintar(){
    var f = fotos[indice]; if(!f) return;
    visorImg.src = f.src; visorImg.alt = f.txt; visorTxt.textContent = f.txt;
  }
  montarGaleria();

  /* ---------- formulários que abrem o WhatsApp ---------- */
  document.querySelectorAll('form[data-zap]').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var num = f.getAttribute('data-zap');
      var linhas = [];
      var titulo = f.getAttribute('data-titulo');
      if(titulo) linhas.push(titulo, '');
      f.querySelectorAll('input,select,textarea').forEach(function(c){
        if(!c.name || !c.value) return;
        var lb = f.querySelector('label[for="' + c.id + '"]');
        linhas.push((lb ? lb.textContent.replace('*','').trim() : c.name) + ': ' + c.value.trim());
      });
      window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });
  });

  /* ---------- revelar ao rolar ---------- */
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    var obs = new IntersectionObserver(function(ents){
      ents.forEach(function(en){
        if(en.isIntersecting){ en.target.style.opacity = 1; en.target.style.transform = 'none'; obs.unobserve(en.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px' });
    document.querySelectorAll('.sec .cartao, .sec .cartao-foto, .sec .citacao, .sec .moldura').forEach(function(el){
      el.style.opacity = 0;
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });
  }
})();
