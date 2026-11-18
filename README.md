# Minha Loja — Checkout com Pix

Checkout web de uma loja fictícia: o cliente escolhe produtos, informa seus dados e paga com **Pix**.
Integração com **Mercado Pago (Checkout Transparente / Orders API)** e um modo **simulado** para demonstração sem conta.

**Stack:** Node.js + Express, MySQL, HTML/CSS/JavaScript puro (sem framework).

## Como executar

Pré-requisitos: Node.js 20+ e MySQL.

```bash
# 1. Criar o banco e os produtos de exemplo
mysql -u root -p < database/schema.sql

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env      # depois edite o .env com a senha do MySQL

# 4. Rodar
npm start                 # http://localhost:3000
```

### Provedor de pagamento

| `PAYMENT_PROVIDER` | Comportamento |
|---|---|
| `simulado` (padrão) | Gera um Pix fictício que é aprovado automaticamente 15 s depois. Não precisa de conta. |
| `mercadopago` | Cria um Pix real no ambiente de testes. Preencha `MP_ACCESS_TOKEN` com o **Access Token de teste** do painel Mercado Pago Developers. |

## Estrutura

```
database/schema.sql          # script SQL de criação + produtos de exemplo
server/
  index.js                   # servidor Express + tratamento de erros
  db.js                      # conexão MySQL
  routes/                    # endpoints REST (produtos, pedidos)
  services/pedidos.js        # regra de negócio (cálculo do total, status, idempotência)
  providers/                 # camada de integração (um módulo por provedor)
    index.js                 # escolhe o provedor pelo .env
    mercadopago.js
    simulado.js
public/
  index.html, css/style.css
  js/main.js                 # roteador (#/, #/checkout, #/pedido/:id)
  js/api.js                  # chamadas à API própria
  js/carrinho.js, utils.js
  js/pages/                  # catalogo, checkout, resultado
  js/components/             # produtoCard, resumoPedido, statusBadge
```

## Arquitetura e fluxo de pagamento

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API própria (Node)
    participant DB as MySQL
    participant P as Provedor (Mercado Pago / Simulado)

    F->>A: GET /api/produtos
    A->>DB: SELECT produtos ativos
    F->>A: POST /api/pedidos {nome, email, itens[id, qtd]}
    A->>DB: busca preços, calcula total, grava pedido + itens
    F->>A: POST /api/pedidos/:id/checkout
    A->>P: cria cobrança Pix (X-Idempotency-Key = id do pedido)
    P-->>A: id externo + QR Code
    A->>DB: grava pagamento
    F->>A: GET /api/pedidos/:id ("Verificar pagamento")
    A->>P: consulta status
    A->>DB: atualiza status
    A-->>F: pedido + status
```

## Modelo do banco

- **produtos**: id, nome, descricao, preco_centavos, ativo
- **pedidos**: id (UUID), comprador, email, total_centavos, status, criado_em
- **itens_pedido**: pedido_id, produto_id, quantidade, preco_unitario_centavos
- **pagamentos**: pedido_id (único), provedor, id_externo, metodo, status, qr_code, qr_code_base64, checkout_url, criado_em

Valores em **centavos (INT)** — sem ponto flutuante para dinheiro.

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/produtos` | Lista produtos ativos |
| POST | `/api/pedidos` | Cria pedido. Body: `{ "nome", "email", "itens": [{ "produtoId", "quantidade" }] }`. Retorna `{ id, total_centavos, status }` |
| POST | `/api/pedidos/:id/checkout` | Cria a cobrança Pix no provedor e retorna o pedido com `pagamento` (QR Code, copia e cola, link) |
| GET | `/api/pedidos/:id` | Retorna o pedido; se estiver pendente, consulta o provedor e atualiza o status |

Status possíveis: `pendente`, `aprovado`, `recusado`, `expirado`, `cancelado`.
Erros retornam `{ "erro": "mensagem" }` com status 400, 404, 502 ou 503.

## Decisões de projeto

- **Total calculado no backend**: o navegador envia só IDs e quantidades; os preços vêm do banco.
- **Status vem do provedor**: a tela de resultado consulta a API, que pergunta ao provedor. Nada é marcado como pago pelo navegador.
- **Sem duplicar pagamento (RF07)**: `pagamentos.pedido_id` é `UNIQUE`, o checkout devolve o pagamento existente se for chamado de novo, e o Mercado Pago recebe `X-Idempotency-Key` com o ID do pedido.
- **Camada de integração separada**: cada provedor é um módulo com `criarPix()` e `consultar()`; trocar de provedor é só mudar o `.env`.
- **Segurança**: Access Token só no backend e no `.env` (ignorado pelo Git); nenhum dado de cartão é armazenado; entradas validadas; logs sem token nem dados pessoais; HTML escapado no frontend.
- **Falhas do provedor**: timeout de 10 s, erro 429 (limite de requisições) e respostas inválidas viram mensagens claras para o usuário (502/503).

## Limitações

- Apenas **Pix** (cartão e boleto ficaram de fora para manter o escopo simples).
- **Sem webhook**: o status é atualizado por consulta quando o usuário clica em "Verificar pagamento" (item opcional do desafio).
- O carrinho fica em memória no navegador (recarregar a página o esvazia).
- O provedor simulado guarda os pagamentos em memória; ao reiniciar o servidor, pagamentos pendentes antigos aparecem como `expirado`.
- No ambiente de teste do Mercado Pago o Pix não é pago de verdade; o pedido fica `pendente` até expirar.

## Roteiro de testes

- [ ] Fluxo completo no modo simulado: catálogo → checkout → QR Code → "Verificar pagamento" → `aprovado` após 15 s.
- [ ] Validações: nome vazio, e-mail inválido, quantidade fora de 1–99 e produto inexistente retornam 400.
- [ ] Chamar `POST /api/pedidos/:id/checkout` duas vezes retorna o mesmo pagamento (sem duplicar).
- [ ] `GET /api/pedidos/id-que-nao-existe` retorna 404.
- [ ] Com o MySQL desligado, a API responde `{"erro":"Erro interno"}` (500) sem expor detalhes.
- [ ] Com `PAYMENT_PROVIDER=mercadopago` e token de teste, o QR Code real do Mercado Pago aparece.
