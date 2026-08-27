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

  function medir(evento, extra) {
    var dados = { event: evento };
    if (extra) for (var k in extra) if (extra.hasOwnProperty(k)) dados[k] = extra[k];
    window.dataLayer.push(dados);
    if (typeof window.gtag === 'function') window.gtag('event', evento, extra || {});
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

  function aoRolar() {
    if (hd) hd.classList.toggle('is-stuck', window.scrollY > 8);
    if (flutuante && hero) {
      flutuante.classList.toggle('is-on', window.scrollY > hero.offsetHeight * 0.6);
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
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
