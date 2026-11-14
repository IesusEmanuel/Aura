# AURA Arquitetura: site institucional

Site estático (HTML, CSS e JavaScript puro) da AURA Arquitetura, escritório de arquitetura e design de interiores. Paleta laranja (`#FFA600`) e preto, com hero 3D interativo, faixa de texto em movimento, cursor personalizado e animações de entrada ao rolar a página.

Não há backend, build ou instalação. Basta abrir o `index.html` no navegador.

---

## Sumário

1. [Estrutura de arquivos](#1-estrutura-de-arquivos)
2. [Tecnologias e dependências](#2-tecnologias-e-dependências)
3. [Como rodar](#3-como-rodar)
4. [Mapa das seções (IDs principais)](#4-mapa-das-seções-ids-principais)
5. [Design tokens e hover "move"](#5-design-tokens-e-hover-move)
6. [Hero 3D interativo (explicação detalhada)](#6-hero-3d-interativo-explicação-detalhada)
7. [Seção Feedback: carrossel (explicação detalhada)](#7-seção-feedback-carrossel-explicação-detalhada)
8. [Outros recursos de JavaScript](#8-outros-recursos-de-javascript)
9. [Outros recursos de CSS](#9-outros-recursos-de-css)
10. [Como personalizar](#10-como-personalizar)
11. [Problemas comuns](#11-problemas-comuns)
12. [Acessibilidade e desempenho](#12-acessibilidade-e-desempenho)

---

## 1. Estrutura de arquivos

```
/
├── index.html   → marcação semântica, todas as seções, IDs e classes
├── style.css    → tokens, layout, componentes, animações, responsivo
├── script.js    → cursor, reveal, hero 3D, carrossel, formulário
└── README.md    → este arquivo
```

Os três arquivos precisam ficar na **mesma pasta**, pois o HTML referencia `style.css` e `script.js` por caminho relativo.

---

## 2. Tecnologias e dependências

Todas carregadas por CDN, sem instalar nada:

| Recurso | Uso | Origem |
|---|---|---|
| Font Awesome 6.5 | Ícones | cdnjs |
| Three.js r128 | Cena 3D do hero | cdnjs |
| Space Grotesk + Inter | Tipografia (títulos e texto) | Google Fonts |
| Unsplash | Imagens reais dos projetos, da seção Sobre e dos avatares | links diretos |

> **Importante:** como tudo vem de CDN, o site precisa de internet para exibir ícones, fontes, imagens e o 3D. Sem o Three.js, o hero continua funcionando, só sem a cena (veja a seção 6.9).

---

## 3. Como rodar

1. Coloque `index.html`, `style.css` e `script.js` na mesma pasta.
2. Abra o `index.html` com duplo clique, ou use um servidor local (opcional, recomendado):

```bash
# Python
python3 -m http.server 5500

# ou Node
npx serve .
```

3. Acesse `http://localhost:5500`.

---

## 4. Mapa das seções (IDs principais)

| Seção | ID | Observação |
|---|---|---|
| Header | `#header` | fixo, ganha `.is-scrolled` após 20px de rolagem |
| Hero (Main Section) | `#inicio` | contém `#heroCanvas` (3D) e `#heroContent` |
| Faixa em movimento | `#marquee` | `#marqueeTrack` com dois grupos idênticos |
| Projetos | `#projetos` | cards `#projeto-horizonte`, `#projeto-alameda`, `#projeto-vertice` |
| Sobre | `#sobre` | `#aboutMedia`, `#aboutBadge`, `#pillars` |
| Processo | `#processo` | `#steps` com `#etapa-01` a `#etapa-04` |
| Feedback | `#feedback` | `#carousel`, `#carouselStage`, `#depoimento-N` |
| Contato | `#contato` | `#contactForm` e campos `#field-*` / `#erro-*` |
| Footer | `#footer` | colunas `#footerNav`, `#footerSpecs`, `#footerSocial` |

Convenção de classes: **BEM simplificado** (`bloco__elemento`, `bloco--modificador`), como `project-card__title` e `btn--outline`. Classes de estado usam o prefixo `is-` (`is-visible`, `is-active`, `is-open`, `is-hover`, `is-scrolled`).

---

## 5. Design tokens e hover "move"

Tudo fica em variáveis CSS no `:root` do `style.css`:

```css
:root {
  --orange: #FFA600;
  --black:  #0B0B0B;
  --move:   translate(4px, -4px);            /* hover: sobe e vai para a direita */
  --ease:   cubic-bezier(.22, .8, .24, 1);   /* curva usada em quase toda transição */
}
```

O efeito de hover pedido ("mover muito pouco para cima e para a direita") é aplicado em **cards, botões, links, ícones, campos do formulário e itens do rodapé** com a mesma variável:

```css
.card:hover { transform: var(--move); }
```

Para deixar o movimento mais forte ou mais fraco em **todo o site**, altere só o `--move` (por exemplo `translate(6px, -6px)`).

> Elementos que também usam `.reveal` (animação de entrada) precisam de uma regra extra, como `.card.reveal.is-visible:hover`, para o hover não ser sobrescrito pelo `transform` da entrada. Já está tratado no código.

---

## 6. Hero 3D interativo (explicação detalhada)

Fica na função `initHero3D()` do `script.js`, com a animação de rolagem do texto em `onHeroScroll()`. A cena é **procedural**: criada por código a partir de caixas (`BoxGeometry`), sem nenhum arquivo `.glb` ou imagem externa.

### 6.1 Visão geral do fluxo

```
mousemove ──► tx, ty (alvo)  ──┐
                               ├─► cx, cy (suavizados) ─► rotação + afastamento dos volumes
scroll ─────► scrollProgress ──┘                          └─► renderer.render() a cada frame
```

Há duas fontes de entrada (cursor e rolagem) e uma única saída (a cena redesenhada em cada frame).

### 6.2 Renderer, cena e câmera

```js
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 1.2, 9);
```

- `alpha: true` deixa o fundo do canvas transparente, então o degradê do `.hero` aparece atrás da cena.
- `setPixelRatio(Math.min(..., 2))` limita a resolução a 2x. Em telas 3x ou 4x isso evita gastar GPU sem ganho visível.
- O campo de visão de `38` dá uma perspectiva mais "arquitetônica" (menos distorção que o padrão de 75).
- O aspecto `1` é provisório. A função `resize()` corrige com o tamanho real do hero.

### 6.3 Os volumes arquitetônicos

```js
// [x, y, z, largura, altura, profundidade, tipo]
const volumes = [
  [0, -0.9, 0, 4.2, 0.18, 3.2, 'slab'],      // laje de base
  [-1.2, 0.1, -0.4, 1.4, 2.0, 1.6, 'solid'], // bloco maciço claro
  [0.6, -0.1, 0.3, 2.2, 1.6, 1.8, 'glass'],  // volume envidraçado (translúcido)
  [1.5, 0.95, -0.2, 1.8, 0.14, 1.9, 'slab'], // laje de cobertura
  [-0.2, 1.4, -0.5, 1.2, 0.8, 1.0, 'accent'],// volume laranja (destaque da marca)
  [1.9, 0.2, 0.9, 0.12, 2.2, 0.12, 'pillar'],// pilar
  [-1.9, 0.2, 0.9, 0.12, 2.2, 0.12, 'pillar']// pilar
];
```

Cada linha vira uma `Mesh`. O campo `tipo` escolhe o material:

| Tipo | Material | Função visual |
|---|---|---|
| `slab` | cinza escuro `#1A1A1A` | lajes e coberturas |
| `solid` | cinza claro `#EDEDED` | massa construída |
| `glass` | laranja claro com `opacity: .22` | fachada de vidro |
| `accent` | laranja `#FFA600` | destaque da marca |
| `pillar` | preto `#111111` | estrutura |

Para cada volume, o código também guarda dados para a animação:

```js
mesh.userData.base  = mesh.position.clone();   // posição original (referência)
mesh.userData.depth = 0.4 + Math.random() * 0.9; // "peso" de cada peça no afastamento
```

Como o `depth` é sorteado, **cada peça se afasta numa intensidade diferente**, o que cria a sensação de uma maquete se abrindo, em vez de um bloco rígido se movendo.

### 6.4 Arestas (aspecto de desenho técnico)

```js
const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(geo),
  new THREE.LineBasicMaterial({ color: ..., transparent: true, opacity: .55 })
);
mesh.add(edges);
```

`EdgesGeometry` extrai só as arestas externas da caixa. Anexadas à própria mesh, elas acompanham todas as transformações. O resultado lembra um desenho de projeto sobre o volume sólido.

### 6.5 Piso com grade

```js
const grid = new THREE.GridHelper(14, 28, ORANGE, 0xCCCCCC);
grid.position.y = -1.0;
```

A grade dá referência de escala e profundidade. No loop, ela desliza em `z` (`grid.position.z = (t * 0.15) % 0.5`). O `% 0.5` é igual ao espaçamento entre as linhas (14 / 28), então ao voltar a 0 o salto é imperceptível, e a grade parece andar para sempre.

### 6.6 Suavização do cursor (lerp)

```js
let tx = 0, ty = 0, cx = 0, cy = 0;

window.addEventListener('mousemove', (e) => {
  tx = (e.clientX / window.innerWidth  - 0.5) * 2;   // -1 a +1
  ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

// dentro do loop:
cx += (tx - cx) * 0.06;
cy += (ty - cy) * 0.06;
```

- `tx`/`ty` são o **alvo**: posição do mouse normalizada de -1 (esquerda/topo) a +1 (direita/base).
- `cx`/`cy` são o **valor atual**, que corre atrás do alvo, 6% da distância por frame (interpolação linear, ou *lerp*).
- Sem isso, o modelo "tremeria" seguindo cada pixel do mouse. Com o lerp, o movimento é macio e tem inércia.
- Valor maior que `0.06` deixa a resposta mais rápida. Menor, mais pesada.

### 6.7 Rotação e afastamento (o núcleo da interação)

```js
// rotação do grupo inteiro
group.rotation.y = -0.55 + cx * 0.45 + scrollProgress * 1.4
                 + (reduceMotion ? 0 : Math.sin(t * 0.3) * 0.06);
group.rotation.x =  0.18 + cy * 0.18 - scrollProgress * 0.25;

// afastamento individual de cada volume
meshes.forEach((m) => {
  const spread = (Math.abs(cx) + Math.abs(cy)) * 0.18 + scrollProgress * 0.9;
  m.position.y = m.userData.base.y
               + spread * m.userData.depth * (m.userData.base.y >= 0 ? 1 : -0.4);
});
```

Decompondo a rotação em `y`:

| Termo | Efeito |
|---|---|
| `-0.55` | ângulo inicial (modelo levemente girado, vista em 3/4) |
| `cx * 0.45` | mouse para os lados gira o modelo (até ±0,45 rad) |
| `scrollProgress * 1.4` | ao rolar, gira cerca de 80° ao total |
| `Math.sin(t * 0.3) * 0.06` | respiração lenta e sutil, desligada com `prefers-reduced-motion` |

No afastamento:

- `spread` cresce com o quanto o cursor está longe do centro e, principalmente, com a rolagem (`scrollProgress * 0.9`).
- Peças acima do piso (`base.y >= 0`) sobem; as de baixo descem pouco (`-0.4`). Isso "abre" a maquete como uma vista explodida.
- Cada peça multiplica por seu `depth` aleatório, então os deslocamentos são diferentes.

### 6.8 `scrollProgress` e a animação do texto ao rolar

```js
function onHeroScroll() {
  const h = hero.offsetHeight;
  scrollProgress = Math.min(Math.max(window.scrollY / h, 0), 1); // 0 → 1
  heroContent.style.transform = `translateY(${scrollProgress * 60}px)`;
  heroContent.style.opacity   = String(1 - scrollProgress * 1.1);
}
```

`scrollProgress` vai de 0 (topo) a 1 (hero totalmente rolado) e é **compartilhado**: o texto usa para subir e sumir, e a cena 3D usa para girar e se abrir. Por isso as duas animações andam juntas. O `Math.min/Math.max` impede valores fora do intervalo 0–1.

### 6.9 Posicionamento responsivo e desempenho

```js
group.position.x = w > 900 ? 2.6 : 0;   // desktop: modelo à direita; mobile: centralizado
group.position.y = w > 900 ? 0 : 1.6;
```

O `.hero__overlay` (degradê branco no CSS) fica entre a cena e o texto para garantir leitura.

```js
let visible = true;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);
// no loop:  if (!visible) return;
```

Quando o hero sai da tela, o loop continua, mas **pula o render**, economizando GPU e bateria nas outras seções.

```js
try { initHero3D(); } catch (err) { console.warn('Hero 3D indisponível:', err); }
```

Se o Three.js falhar (CDN fora do ar, WebGL desativado), o `try/catch` evita que o resto do `script.js` quebre. O hero continua com o degradê, o texto e as animações de rolagem.

### 6.10 Ajustes rápidos

| Quero... | Altere |
|---|---|
| Girar mais com o mouse | `cx * 0.45` → valor maior |
| Resposta mais rápida do mouse | `0.06` → `0.1` |
| Modelo maior/menor | `camera.position.set(0, 1.2, 9)` (último valor: menor = mais perto) |
| Mais ou menos "explosão" ao rolar | `scrollProgress * 0.9` |
| Nova peça na maquete | adicionar uma linha em `volumes` |
| Trocar a cor de destaque | `const ORANGE = 0xFFA600` |

---

## 7. Seção Feedback: carrossel (explicação detalhada)

Carrossel de depoimentos **sem biblioteca**: troca automática a cada 7 segundos, barra de progresso, contador e setas.

### 7.1 Estrutura HTML

```html
<div class="carousel" id="carousel">
  <div class="carousel__stage" id="carouselStage">
    <figure class="testimonial is-active" id="depoimento-1">...</figure>
    <figure class="testimonial"           id="depoimento-2">...</figure>
    <figure class="testimonial"           id="depoimento-3">...</figure>
  </div>
  <div class="carousel__bar">
    <span id="carouselCount">01 / 03</span>
    <div class="carousel__progress"><span id="carouselProgressFill"></span></div>
    <button id="carouselPrev">...</button>
    <button id="carouselNext">...</button>
  </div>
</div>
```

Só **um** `<figure>` pode ter `is-active` por vez.

### 7.2 Empilhamento dos slides (CSS)

```css
.carousel__stage { display: grid; }
.testimonial {
  grid-area: 1 / 1;            /* todos na mesma célula do grid */
  opacity: 0; visibility: hidden; transform: translateX(24px);
  transition: opacity .6s var(--ease), transform .6s var(--ease), visibility .6s;
}
.testimonial.is-active { opacity: 1; visibility: visible; transform: none; }
```

O truque está em `grid-area: 1 / 1`: todos os depoimentos ocupam a **mesma célula**, um sobre o outro. Assim o container assume automaticamente a **altura do maior depoimento**, e a página não "pula" quando o slide troca. Quem aparece é decidido por `opacity`/`visibility`, e o `translateX` dá o leve deslize lateral. O `visibility: hidden` impede cliques e leitores de tela nos slides escondidos.

### 7.3 Lógica em JavaScript

```js
const slides = document.querySelectorAll('.testimonial');
const DURATION = 7000;                     // 7 s por depoimento
let current = 0, startTime = performance.now(), rafId;

function updateCount() {
  count.textContent =
    `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
}

function goTo(i) {
  slides[current].classList.remove('is-active');
  current = (i + slides.length) % slides.length;   // dá a volta nas duas pontas
  slides[current].classList.add('is-active');
  updateCount();
  startTime = performance.now();                    // reinicia a contagem dos 7 s
}

function tick(now) {
  const p = Math.min((now - startTime) / DURATION, 1);   // progresso de 0 a 1
  fill.style.width = (p * 100) + '%';
  if (p >= 1) goTo(current + 1);
  rafId = requestAnimationFrame(tick);
}

updateCount();                       // contador correto já na carga da página
rafId = requestAnimationFrame(tick);
```

Pontos que merecem atenção:

- **`(i + slides.length) % slides.length`**: o módulo faz o carrossel ser circular. Com `i = -1` (seta "anterior" no primeiro slide), o resultado é o último slide. Somar `slides.length` antes evita o resultado negativo que o `%` do JavaScript produziria.
- **Barra de progresso com `requestAnimationFrame`** em vez de `setInterval`: a barra e a troca usam o mesmo relógio (`startTime`), então **nunca dessincronizam**. Ao clicar numa seta, `goTo()` zera o `startTime` e a barra recomeça do zero junto com o novo slide.
- **`updateCount()` numa função só**: o contador sempre sai de `current` e de `slides.length`, então vale para qualquer número de depoimentos.
- O `requestAnimationFrame` pausa sozinho quando a aba está em segundo plano, então o carrossel não "avança escondido".

### 7.4 Como adicionar um novo depoimento

1. Copie um `<figure class="testimonial">` inteiro dentro de `#carouselStage`.
2. **Remova** o `is-active` da cópia (só o primeiro deve tê-lo).
3. Troque o `id` (`depoimento-4`), o texto, o nome, o cargo e a foto.

Nada mais é necessário: o total no contador e a rotação se ajustam sozinhos.

### 7.5 Ajustes rápidos

| Quero... | Altere |
|---|---|
| Tempo por depoimento | `DURATION = 7000` (em ms) e o texto "CICLO AUTOMÁTICO DE 7S" no HTML |
| Parar o ciclo automático | remover a chamada `rafId = requestAnimationFrame(tick)` (as setas continuam funcionando, mas sem barra) |
| Velocidade da transição | `.6s` em `.testimonial` no CSS |

---

## 8. Outros recursos de JavaScript

### Cursor double dot
Dois elementos fixos: `#cursorDot` (bolinha sólida, segue o mouse sem atraso) e `#cursorRing` (bola translúcida maior, segue com *lerp* de 0,16, o que cria o efeito de "rastro"). Sobre links, botões, campos e cards ganha a classe `is-hover` e a bola maior cresce. Só é ativado em dispositivos com mouse (`(hover: hover) and (pointer: fine)`); em touch, o cursor padrão é mantido.

### Reveal on scroll
Todo elemento com a classe `.reveal` começa invisível e deslocado 40px para baixo. Um `IntersectionObserver` adiciona `is-visible` quando o elemento entra na tela, e o atributo `data-delay` (em ms) escalona a entrada entre irmãos (`data-delay="150"`, `"300"`...). Depois de revelado, o elemento deixa de ser observado.

### Link ativo no menu
Outro `IntersectionObserver`, com `rootMargin: '-45% 0px -50% 0px'`, marca a seção que cruza o **meio da tela** e aplica `is-active` ao link correspondente (via `data-section`).

### Formulário
Validação própria (sem envio real):
- nome com pelo menos duas palavras;
- e-mail por expressão regular;
- selects obrigatórios;
- prazo com 3+ caracteres e mensagem com 15+ caracteres.

Valida no `blur`, revalida em tempo real depois de um erro e mostra a mensagem de sucesso ao enviar. Para enviar de verdade, troque o trecho após o `ok` por um `fetch()` para seu backend ou serviço (Formspree, por exemplo).

### Imagens com fallback
Se uma imagem do Unsplash falhar, o evento `error` troca o `src` por uma imagem do Picsum (uma única vez, para não entrar em loop).

---

## 9. Outros recursos de CSS

### Faixa em movimento (marquee)
```css
.marquee__track { display: flex; width: max-content; animation: marqueeLeft 32s linear infinite; }
@keyframes marqueeLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```
No HTML, o grupo de palavras aparece **duas vezes** seguidas (o segundo com `aria-hidden`). Ao deslocar exatamente `-50%` (a largura de um grupo), a animação reinicia no ponto em que o segundo grupo ocupa o lugar do primeiro, então o laço é contínuo, sem emenda visível. Pausa ao passar o mouse.

### Botões com preenchimento fluido
O `::before` do `.btn` é uma camada laranja posicionada abaixo do botão (`translateY(101%)`). No hover ela sobe (`translateY(0)`) enquanto o `border-radius` curvo se desfaz, simulando um líquido preenchendo o botão.

### Menu mobile
Abaixo de 820px, o `.nav` vira um painel que abre por `max-height` com a classe `is-open`, controlada pelo botão `#burger`.

---

## 10. Como personalizar

| O que | Onde |
|---|---|
| Cor da marca | `--orange` no `:root` (e `ORANGE` no `script.js` para o 3D) |
| Textos e contatos | direto no `index.html` |
| Imagens | atributos `src` das tags `<img>` (use as fotos reais dos projetos) |
| Palavras da faixa | `#marqueeGroupA` e o espelho `#marqueeGroupB` (alterar os dois) |
| Fontes | link do Google Fonts no `<head>` e `--font-title` / `--font-body` |

---

## 11. Problemas comuns

**O contador do carrossel não anda ou fica em `01 / N`.**
Confira se a chamada `updateCount()` está **fora** da função `tick`, uma única vez, antes do `requestAnimationFrame(tick)` inicial. Se ela estiver dentro de `tick`, o contador é resetado a cada frame.

**O novo depoimento não aparece / dois aparecem juntos.**
Verifique se ele está dentro de `#carouselStage`, se tem a classe `testimonial` e se só um slide possui `is-active`.

**O 3D não aparece.**
Abra o console (F12). Se houver "Hero 3D indisponível", o Three.js não carregou (sem internet ou CDN bloqueado) ou o WebGL está desativado. O restante do site continua funcionando.

**O cursor padrão ainda aparece.**
O cursor personalizado só ativa em dispositivos com mouse. Em telas touch, o comportamento é intencional.

**O scrollbar laranja não tem gradiente no Firefox.**
O Firefox não aceita gradiente no scrollbar. Ele usa laranja sólido via `scrollbar-color`.

---

## 12. Acessibilidade e desempenho

- Movimento reduzido: com `prefers-reduced-motion`, as transições são quase instantâneas, a faixa em movimento para, as seções aparecem sem animar e a oscilação automática do 3D é desligada.
- Semântica: `header`, `nav`, `main`, `section`, `figure`/`blockquote` e `footer`; botões com `aria-label`; elementos decorativos com `aria-hidden`.
- Formulário: cada campo tem `label` associado e mensagens de erro por campo; a mensagem de sucesso usa `role="status"`.
- Imagens com `alt` descritivo e `loading="lazy"` (exceto o conteúdo acima da dobra).
- Desempenho: o 3D pausa fora da tela, o `pixelRatio` é limitado a 2 e os observers desligam depois de usados quando possível.

---

© AURA Arquitetura. Projeto de demonstração front-end.