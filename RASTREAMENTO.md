# Rastreamento de conversões — A P Silva Construções

Atende os itens 17 e 18 do relatório de otimização.

O site dispara todos os eventos por uma função só, a `medir()` do
`main.js`. Ela alimenta o `dataLayer`, o `gtag` e o `fbq` ao mesmo tempo.
Plugar um canal novo é colar o snippet no `<head>`, e mais nada.

## Estado hoje

Tudo instalado em 2026-09-01.

| Canal | ID | Observação |
|---|---|---|
| Meta Pixel | `1144633880370288` | eventos mapeados na tabela abaixo |
| Google Tag Manager | `GTM-TGSBDZFT` | é quem carrega o GA4 e o Google Ads |
| Google Tag Manager | `GTM-T9BLCJ43` | segundo contêiner, veio do site antigo |
| Google Analytics 4 | `G-DVR6Q246HM` | entra por dentro do GTM, não precisa colar |
| Google Ads | `AW-427532958` | remarketing ativo, entra por dentro do GTM |

**De onde vieram os IDs do Google:** do Tag Assistant rodado no site antigo
(apsilvaconstrucoes.com.br) em 2026-09-01. Já estavam lá, funcionando.

> **Não remover os dois contêineres do GTM.** O site antigo carrega os dois, e
> o `AW-427532958` está alimentando público de remarketing agora. Publicar o
> site novo sem eles derrubaria o remarketing e as conversões da campanha do
> cliente, e a culpa cairia no site novo.

**O que ainda depende de quem cuida da campanha:** os gatilhos que existem hoje
dentro do GTM foram feitos pro site antigo, em WordPress com Elementor. A
visualização de página e o remarketing continuam funcionando sozinhos, porque
são baseados em página. Mas qualquer conversão amarrada a um elemento do site
velho (botão do Elementor, formulário do WordPress) para de disparar. Tem que
remapear pros eventos da tabela mais abaixo, que são os que o site novo manda
pro `dataLayer`.

## Como a Meta recebe os eventos

A Meta só otimiza campanha em cima dos eventos padrão dela. Por isso os que valem
dinheiro são traduzidos, e o resto vai como evento personalizado (aparece no
Gerenciador de Eventos, mas não puxa a campanha).

| Evento do site | Vira, na Meta |
|---|---|
| `envio_formulario` | **Lead** (evento padrão) |
| `clique_whatsapp` | **Contact** (evento padrão) |
| `enviar_projeto` | **Contact** (evento padrão) |
| `clique_telefone` | **Contact** (evento padrão) |
| todos os outros | evento personalizado com o mesmo nome |

Toda chamada leva junto o parâmetro `evento_site`, com o nome original, e o
`origem`. Sem isso, na Meta todo Contact ficaria igual e não daria pra saber
se o clique veio do hero, do vídeo ou do rodapé. O `Lead` leva também
`servico` e `cidade`, que é o que qualifica.

**Na campanha:** otimizar por **Lead**. O **Contact** serve pra público de
remarketing e pra medir interesse, não pra otimização, senão a campanha vai atrás
de quem clica no WhatsApp do rodapé e some.

## Onde os códigos ficam no site

Todos no `<head>` do `index.html`, logo depois do comentário `RASTREAMENTO`:
primeiro o Meta Pixel, depois os dois contêineres do GTM. Os `<noscript>`
correspondentes ficam logo depois do `<body>`.

Pra trocar ou acrescentar um canal, é só mexer nesse bloco. O `main.js` não
precisa mudar: a função `medir()` alimenta `dataLayer`, `gtag` e `fbq` ao
mesmo tempo, então quem chegar depois entra de graça.

## O custo disso na performance

Antes de instalar as tags, a página não tinha nenhum domínio externo, e isso
era proposital (foi por isso que as fontes são servidas do próprio domínio).
Com Meta e Google instalados, medido em 492px de largura:

| | Antes | Depois |
|---|---|---|
| Domínios externos | 0 | 8 |
| Recursos carregados | 28 | 40 |
| DOM pronto | 152 ms | 146 ms |
| Load completo | 474 ms | 1695 ms |

O que importa: **o DOM pronto não mudou**, porque tudo carrega de forma
assíncrona e nada bloqueia a renderização. O que cresce é o load completo, que
acontece depois da página já estar utilizável.

O PageSpeed vai passar a mostrar aviso de código de terceiros. É o preço de
medir, e o site antigo já pagava esse preço com as mesmas tags.

## Eventos disparados

Todo evento carrega o parâmetro `origem`, que diz de qual ponto da página
veio o clique. É isso que mostra qual seção converte.

| Evento | Quando dispara | Valores de `origem` |
|---|---|---|
| `clique_whatsapp` | Qualquer botão ou link que abre o WhatsApp | `header`, `hero`, `video`, `botao_flutuante`, `servicos`, `obras`, `motivos`, `faq`, `orcamento_lateral`, `rodape`, `rodape_social`, `rodape_contato`, `problema_galpao`, `problema_ampliacao`, `problema_cobertura`, `problema_recuperacao`, `problema_vazamento`, `servico_galpao`, `servico_cobertura`, `servico_estrutura`, `servico_reforma`, `servico_mezanino`, `servico_pintura`, `servico_desmontagem`, `servico_projeto` |
| `enviar_projeto` | Botão "Enviar projeto pelo WhatsApp", no hero | `hero` |
| `envio_formulario` | Formulário de orçamento enviado e validado | `orcamento` |
| `clique_telefone` | Link `tel:` | `orcamento_lateral` |
| `clique_email` | Link `mailto:` | `orcamento_lateral`, `rodape` |
| `clique_endereco` | Link do Google Maps | `orcamento_lateral`, `rodape` |
| `clique_instagram` | Link do Instagram | `obras`, `rodape`, `rodape_contato` |
| `clique_facebook` | Link do Facebook | `rodape` |
| `abriu_duvida` | Abertura de uma pergunta do FAQ | traz `pergunta` com o texto |
| `video_iniciou_sozinho` | O vídeo entrou na tela e começou mudo | `secao_video` |
| `play_video_com_som` | Clique em "Ouvir": a pessoa quis o áudio | `secao_video` |
| `video_ate_o_fim` | Vídeo assistido até o final | `secao_video` |

O `envio_formulario` carrega dois parâmetros extras que valem ouro pra
qualificar lead no Google Ads:

- `servico` — o que a pessoa escolheu no formulário
- `cidade` — onde a obra fica

## Conversões sugeridas no Google Ads

**Primária** (é a que otimiza a campanha):
- `envio_formulario`
- `clique_whatsapp` com `origem` em `hero`, `orcamento_lateral` ou `botao_flutuante`

**Secundária** (mede interesse, não otimiza):
- `clique_whatsapp` vindo dos cards de problema e de serviço
- `enviar_projeto`
- `clique_telefone`
- `abriu_duvida`
- `play_video_com_som` e `video_ate_o_fim`

O `video_iniciou_sozinho` dispara para quase todo mundo que rola até a
seção, então não serve como sinal de interesse. Quem clica em "Ouvir" é
que está realmente engajado: é o `play_video_com_som` que vale olhar.

Vale cruzar `video_ate_o_fim` com `envio_formulario` depois de algumas
semanas: se quem assiste o vídeo converte mais, o vídeo merece subir na
página. Se não muda nada, ele fica onde está.

Separar assim evita o erro mais comum: contar como conversão todo clique de
WhatsApp da página, inclusive o do rodapé, e otimizar a campanha pra um
número que não vira venda.

## Como conferir se está funcionando

**Pelo console:**

1. Abra o site no Chrome, aperte F12 e vá na aba Console
2. Digite `dataLayer` e dê Enter
3. Clique em qualquer botão de WhatsApp
4. Digite `dataLayer` de novo: o evento novo tem que estar no fim da lista

**Pela Meta:** instale a extensão *Meta Pixel Helper* no Chrome, abra o site e
clique nos botões. Ela mostra cada Contact e cada Lead saindo em tempo real,
com os parâmetros. Os eventos também aparecem no Gerenciador de Eventos da
Meta, em Testar eventos.

## O que ainda falta (fora do site)

O site entrega o evento. O caminho até a venda depende de configuração fora
daqui, que é responsabilidade de quem cuida da conta:

- Criar as conversões no Google Ads e importar do GA4
- Marcar primária e secundária conforme a tabela acima
- Ligar o remarketing
- Padronizar UTM nos anúncios
- Fazer o passo Lead → Lead qualificado → Proposta → Venda, que exige o CRM
  do cliente e não pode ser resolvido só com tag no site
