# URL Shortener

Encurtador de URLs simples: Node.js + Express + SQLite (better-sqlite3), com uma interface web para criar e gerenciar os links.

## Rodando

```
cd url-shortener
npm install
npm start
```

A aplicação sobe em `http://localhost:3000`.

## Endpoints

- `POST /api/shorten` — body `{ "url": "https://...", "customCode": "opcional" }` → cria um link curto.
- `GET /api/links` — lista todos os links criados.
- `DELETE /api/links/:code` — remove um link.
- `GET /:code` — redireciona para a URL original e conta o clique.

## Configuração

- `PORT` — porta do servidor (padrão `3000`).
- `BASE_URL` — URL base usada para montar os links curtos (padrão `http://localhost:<PORT>`).

## Uso de IA

Este projeto foi desenvolvido com apoio do Claude Code (Anthropic) como ferramenta de programação assistida por IA: geração do código do backend (Express + SQLite), da interface web e da documentação. As decisões de arquitetura, revisão e testes foram conduzidas pelo autor do repositório.
