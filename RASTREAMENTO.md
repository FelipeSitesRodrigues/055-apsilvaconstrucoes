# Rastreamento de conversões — A P Silva Construções

Atende os itens 17 e 18 do relatório de otimização.

O site **já dispara todos os eventos**. Falta só plugar a tag. Enquanto o
GTM não for instalado, os eventos são empurrados pro `dataLayer` e ficam
disponíveis no console, sem quebrar nada.

## Como ativar

Abra `index.html` e procure o comentário `RASTREAMENTO` dentro do `<head>`.
Cole ali o snippet do Google Tag Manager ou do GA4. Nada mais precisa mudar.

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

Se preferir GA4 direto, sem GTM, o site também chama `gtag()` quando ele
existe. Basta colar o snippet do GA4 no mesmo lugar.

## Eventos disparados

Todo evento carrega o parâmetro `origem`, que diz de qual ponto da página
veio o clique. É isso que mostra qual seção converte.

| Evento | Quando dispara | Valores de `origem` |
|---|---|---|
| `clique_whatsapp` | Qualquer botão ou link que abre o WhatsApp | `header`, `hero`, `botao_flutuante`, `obras`, `motivos`, `faq`, `orcamento_lateral`, `rodape`, `rodape_social`, `rodape_contato`, `problema_galpao`, `problema_vazamento`, `problema_corrosao`, `problema_reforco`, `problema_ampliacao`, `problema_cobertura`, `servico_galpao`, `servico_fabricacao`, `servico_cobertura`, `servico_telhado`, `servico_reforco`, `servico_mezanino`, `servico_projeto`, `servico_pintura`, `servico_desmontagem` |
| `agendar_visita` | Botão "Agendar visita técnica" | `hero` |
| `envio_formulario` | Formulário de orçamento enviado e validado | `orcamento` |
| `clique_telefone` | Link `tel:` | `orcamento_lateral` |
| `clique_email` | Link `mailto:` | `orcamento_lateral`, `rodape` |
| `clique_endereco` | Link do Google Maps | `orcamento_lateral`, `rodape` |
| `clique_instagram` | Link do Instagram | `obras`, `rodape`, `rodape_contato` |
| `clique_facebook` | Link do Facebook | `rodape` |
| `abriu_duvida` | Abertura de uma pergunta do FAQ | traz `pergunta` com o texto |

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
- `agendar_visita`
- `clique_telefone`
- `abriu_duvida`

Separar assim evita o erro mais comum: contar como conversão todo clique de
WhatsApp da página, inclusive o do rodapé, e otimizar a campanha pra um
número que não vira venda.

## Como conferir se está funcionando

1. Abra o site no Chrome, aperte F12 e vá na aba Console
2. Digite `dataLayer` e dê Enter
3. Clique em qualquer botão de WhatsApp
4. Digite `dataLayer` de novo: o evento novo tem que estar no fim da lista

## O que ainda falta (fora do site)

O site entrega o evento. O caminho até a venda depende de configuração fora
daqui, que é responsabilidade de quem cuida da conta:

- Criar as conversões no Google Ads e importar do GA4
- Marcar primária e secundária conforme a tabela acima
- Ligar o remarketing
- Padronizar UTM nos anúncios
- Fazer o passo Lead → Lead qualificado → Proposta → Venda, que exige o CRM
  do cliente e não pode ser resolvido só com tag no site
