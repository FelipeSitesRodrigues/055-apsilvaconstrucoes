/* A P Silva Construções · comportamento da página
   As classes de animação são aplicadas por aqui: sem JS, tudo
   continua visível e navegável. */
(function () {
  'use strict';

  var doc = document;
  var ZAP = '5585991182848';
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, ctx) { return (ctx || doc).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(s)); };

  /* ============================================================
     RASTREAMENTO DE CONVERSÕES
     Todo elemento com data-ev empurra um evento pro dataLayer.
     Os nomes usados estão documentados em RASTREAMENTO.md.
     ============================================================ */
  window.dataLayer = window.dataLayer || [];

  // A Meta só otimiza direito em cima dos eventos padrão dela. Os dois que
  // valem dinheiro aqui viram Lead e Contact; o resto vai como evento
  // personalizado, que aparece no Gerenciador mas não puxa a campanha.
  var META_PADRAO = {
    envio_formulario: 'Lead',
    clique_whatsapp: 'Contact',
    enviar_projeto: 'Contact',
    clique_telefone: 'Contact'
  };

  function medir(evento, extra) {
    var dados = { event: evento };
    if (extra) for (var k in extra) if (extra.hasOwnProperty(k)) dados[k] = extra[k];
    window.dataLayer.push(dados);
    if (typeof window.gtag === 'function') window.gtag('event', evento, extra || {});
    if (typeof window.fbq === 'function') {
      var padrao = META_PADRAO[evento];
      // o nome original vai junto, senão na Meta todo Contact fica igual e
      // não dá pra saber se veio do hero ou do rodapé
      var carga = { evento_site: evento };
      if (extra) for (var p in extra) if (extra.hasOwnProperty(p)) carga[p] = extra[p];
      if (padrao) window.fbq('track', padrao, carga);
      else window.fbq('trackCustom', evento, carga);
    }
  }

  doc.addEventListener('click', function (e) {
    var alvo = e.target.closest ? e.target.closest('[data-ev]') : null;
    if (!alvo) return;
    // o submit do formulário mede sozinho, com os campos preenchidos
    if (alvo.type === 'submit') return;
    medir(alvo.getAttribute('data-ev'), { origem: alvo.getAttribute('data-loc') || 'nao_informado' });
  });

  /* ---------- ano do rodapé ---------- */
  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- header: sombra ao descolar do topo ---------- */
  var hd = $('.hd');
  var flutuante = $('.float');
  var hero = $('.hero');

  // no celular o botão flutuante aparece cedo: ali o CTA do hero sai da
  // tela rápido e a pessoa fica sem nenhum caminho de conversão à mão.
  // A altura do hero fica guardada: lê-la a cada scroll obrigava o
  // navegador a recalcular o layout inteiro, 112 ms de trabalho à toa.
  var gatilho = 400;

  function medirGatilho() {
    if (!hero) return;
    gatilho = hero.offsetHeight * (window.innerWidth <= 820 ? 0.28 : 0.6);
  }

  function aoRolar() {
    var y = window.scrollY;
    if (hd) hd.classList.toggle('is-stuck', y > 8);
    if (flutuante) flutuante.classList.toggle('is-on', y > gatilho);
  }

  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', function () { medirGatilho(); aoRolar(); });
  medirGatilho();
  aoRolar();

  /* ---------- menu mobile ---------- */
  var burger = $('.hd__burger');
  var nav = $('#menu');

  function fecharMenu() {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    nav.classList.remove('is-open');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var aberto = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!aberto));
      burger.setAttribute('aria-label', aberto ? 'Abrir menu' : 'Fechar menu');
      nav.classList.toggle('is-open', !aberto);
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', fecharMenu); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { fecharMenu(); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) fecharMenu();
    });
  }

  /* ---------- marca a seção atual no menu ---------- */
  var secoes = $$('main section[id]');
  var links = $$('.hd__nav a[href^="#"]');

  if (secoes.length && links.length && 'IntersectionObserver' in window) {
    var espia = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (!i.isIntersecting) return;
        var alvo = '#' + i.target.id;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === alvo); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(function (s) { espia.observe(s); });
  }

  /* ============================================================
     FORMULÁRIO DE ORÇAMENTO
     Não há backend: o envio monta a mensagem e abre o WhatsApp
     com tudo escrito, para a pessoa conferir antes de mandar.
     ============================================================ */
  var form = $('#form-orcamento');

  if (form) {
    var erro = $('.form__err', form);

    var rotulos = {
      nome: 'seu nome',
      zap: 'seu WhatsApp',
      servico: 'o tipo de serviço',
      cidade: 'sua cidade'
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var faltando = [];
      ['nome', 'zap', 'servico', 'cidade'].forEach(function (campo) {
        var el = form.elements[campo];
        var vazio = !el.value.trim();
        el.closest('.field').classList.toggle('is-bad', vazio);
        if (vazio) faltando.push(rotulos[campo]);
      });

      // WhatsApp precisa de pelo menos 10 dígitos para ser um número real
      var zap = form.elements.zap;
      var digitos = zap.value.replace(/\D/g, '');
      if (zap.value.trim() && digitos.length < 10) {
        zap.closest('.field').classList.add('is-bad');
        faltando.push('um WhatsApp com DDD');
      }

      if (faltando.length) {
        erro.hidden = false;
        erro.textContent = 'Falta preencher: ' + faltando.join(', ') + '.';
        var ruim = $('.field.is-bad input, .field.is-bad select', form);
        if (ruim) ruim.focus();
        return;
      }

      erro.hidden = true;

      var v = function (n) { return form.elements[n].value.trim(); };
      var linhas = [
        'Olá! Vim pelo site e quero um orçamento.',
        '',
        'Nome: ' + v('nome'),
        'WhatsApp: ' + v('zap'),
        'Serviço: ' + v('servico'),
        'Cidade: ' + v('cidade')
      ];
      if (v('msg')) linhas.push('Preciso de: ' + v('msg'));

      medir('envio_formulario', {
        origem: 'orcamento',
        servico: v('servico'),
        cidade: v('cidade')
      });

      window.open('https://wa.me/' + ZAP + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });

    // some com o aviso de erro assim que a pessoa corrige o campo
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () {
        el.closest('.field').classList.remove('is-bad');
        if (!$('.field.is-bad', form)) erro.hidden = true;
      });
    });
  }

  /* ============================================================
     PLAYER DO VÍDEO
     Até o clique existe só a imagem de capa. O arquivo de vídeo é
     baixado sob demanda, então não pesa no carregamento da página
     nem na nota de experiência que o Google Ads mede.
     ============================================================ */
  var player = $('.player');

  if (player) {
    var video = null;

    // sozinho: mudo e em laço, como o cliente pediu. Com som: quem clicou
    // no play quer ouvir, então começa do zero, com áudio e controles.
    var abrirVideo = function (comSom) {
      if (video) {
        if (comSom) { video.muted = false; video.controls = true; video.loop = false; video.currentTime = 0; video.play(); }
        return;
      }
      video = doc.createElement('video');
      video.src = player.getAttribute('data-src');
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      video.poster = $('.player__capa', player).currentSrc || $('.player__capa', player).src;
      video.muted = !comSom;
      video.loop = !comSom;
      video.controls = !!comSom;
      video.addEventListener('ended', function () { medir('video_ate_o_fim', { origem: 'secao_video' }); });

      player.appendChild(video);
      player.classList.add('is-live', comSom ? 'is-som' : 'is-mudo');

      var p = video.play();
      // se o navegador barrar o autoplay, a capa e o play voltam
      if (p && p.catch) p.catch(function () {
        player.classList.remove('is-live', 'is-mudo');
        player.removeChild(video);
        video = null;
      });
    };

    $('.player__go', player).addEventListener('click', function () {
      medir('play_video_com_som', { origem: 'secao_video' });
      player.classList.remove('is-mudo');
      player.classList.add('is-som');
      abrirVideo(true);
    });

    // O vídeo só começa a baixar quando a seção chega perto da tela.
    // É o que permite ele abrir sozinho sem atrasar o carregamento da
    // página nem estragar a nota de velocidade das campanhas.
    if ('IntersectionObserver' in window && !calmo) {
      new IntersectionObserver(function (itens, obs) {
        itens.forEach(function (i) {
          if (!i.isIntersecting) return;
          obs.disconnect();
          medir('video_iniciou_sozinho', { origem: 'secao_video' });
          abrirVideo(false);
        });
      }, { rootMargin: '220px 0px' }).observe(player);
    }
  }

  /* ---------- só uma pergunta do FAQ aberta por vez ---------- */
  var perguntas = $$('.faq details');
  perguntas.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      perguntas.forEach(function (o) { if (o !== d) o.open = false; });
      medir('abriu_duvida', { pergunta: $('summary', d).textContent.trim() });
    });
  });

  /* ============================================================
     ENTRADA DOS BLOCOS
     Um movimento por bloco, curto. Nada de efeito espalhado.
     ============================================================ */
  if (calmo || !('IntersectionObserver' in window)) return;

  $$('.svc, .why__list, .works, .cards, .steps, .seals__row, .prob, .warranty__list, .faq__list').forEach(function (el) {
    el.classList.add('stg');
  });

  $$('.sec__head, .about__txt, .about__pic, .reviews__head, .why__head, .warranty__head, .faq__head, .quote__txt, .form, .works__cta').forEach(function (el) {
    el.classList.add('rv');
  });

  var entrada = new IntersectionObserver(function (itens, obs) {
    itens.forEach(function (i) {
      if (!i.isIntersecting) return;
      i.target.classList.add('is-in');
      obs.unobserve(i.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  $$('.rv, .stg').forEach(function (el) { entrada.observe(el); });

  /* ---------- a treliça se monta ---------- */
  var trelicas = new IntersectionObserver(function (itens, obs) {
    itens.forEach(function (i) {
      if (!i.isIntersecting) return;
      i.target.classList.add('is-built');
      obs.unobserve(i.target);
    });
  }, { threshold: 0.5 });

  $$('.truss').forEach(function (el) { trelicas.observe(el); });
})();
