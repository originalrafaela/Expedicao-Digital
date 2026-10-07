# Expedição Digital

Site multipagina para um guia aberto de internet básica para todas as idades, com pagina inicial, cards de cursos, foto, texto e sumario por curso.

## Stack escolhida

- HTML, CSS e JavaScript puro para carregar rapido e nao depender de build.
- Conteúdo local em `courses-data.js`, sem banco de dados e sem cadastro.
- Cada card abre uma pagina propria em `cursos/`.
- Cada curso tem sumario lateral recolhivel.
- Cada titulo do texto vira um topico clicavel no sumario.

## Como abrir

Com servidor local:

```powershell
npm start
```

Depois abra `http://localhost:4173`.

Tambem e possivel abrir `index.html` diretamente no navegador.

## Como editar conteudo

Edite o array `courses` em `courses-data.js`. Cada curso tem `slug`, `label`, textos principais e uma lista `topics` com os topicos do artigo.

## Deploy estático

Execute `npm run build` e publique o conteúdo da pasta `dist/`. O projeto não precisa de dependências nem de servidor Node em uma hospedagem estática.

- Comando de build: `npm run build`.
- Diretório de publicação: `dist`.
- Configure a hospedagem para usar `404.html` como página de erro com status HTTP 404.
- Não configure redirecionamento de todas as rotas para `index.html`: os cursos são páginas HTML independentes.
- Habilite HTTPS no provedor. A página 404 pressupõe publicação na raiz do domínio.
- Publique somente `dist/`, para não expor arquivos internos.

## Deploy com Node

Use Node 22 ou superior e o comando `npm start`. O servidor respeita a variável `PORT` da hospedagem, serve somente arquivos públicos e trata URLs inválidas sem encerrar o processo. Configure HTTPS no provedor ou proxy.

## Verificação

Execute `npm test` para conferir arquivos públicos, URLs inválidas, bloqueio de arquivos internos, página 404 e métodos HTTP.

Execute `node tests/browser-check.js` para testar os 20 cursos, imagens, títulos, filtros e rolagem em larguras de computador e celular. Esse teste requer Chrome instalado; para outro caminho de Chrome ou Edge, defina `CHROME_PATH`. Usa um perfil temporário separado e não acessa o perfil pessoal. A opção `--no-sandbox` aplica-se apenas ao navegador de teste em páginas locais.

A imagem original está preservada em `assets/hero-expedicao.png`. A página e o pacote de deploy usam a versão JPEG otimizada.

## Licença

Código disponibilizado sob a licença [MIT](LICENSE).
Autoria: Rafaela Amaral, Guilherme Nunes e Luan Rocha.

