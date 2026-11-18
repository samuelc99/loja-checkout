CREATE DATABASE IF NOT EXISTS loja_checkout;
USE loja_checkout;

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  preco_centavos INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pedidos (
  id CHAR(36) PRIMARY KEY,
  comprador VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  total_centavos INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_pedido (
  pedido_id CHAR(36) NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  preco_unitario_centavos INT NOT NULL,
  PRIMARY KEY (pedido_id, produto_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- pedido_id UNIQUE: um pedido nunca gera dois pagamentos (RF07)
CREATE TABLE pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id CHAR(36) NOT NULL UNIQUE,
  provedor VARCHAR(30) NOT NULL,
  id_externo VARCHAR(100) NOT NULL,
  metodo VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  qr_code TEXT,
  qr_code_base64 MEDIUMTEXT,
  checkout_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Cada mudança de status do pedido vira uma linha (pendente -> aprovado, etc.)
CREATE TABLE historico_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

INSERT INTO produtos (nome, descricao, preco_centavos) VALUES
  ('Fone de Ouvido Bluetooth', 'Cancelamento de ruído, 30h de bateria', 29990),
  ('Mouse Sem Fio', 'Sensor óptico 1600 DPI', 8990),
  ('Teclado Mecânico', 'Switch azul, ABNT2', 24990),
  ('Webcam Full HD', '1080p com microfone', 15990);
