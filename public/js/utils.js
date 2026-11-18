export const formatarPreco = (centavos) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Evita XSS ao montar HTML com dados do usuário
export const esc = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
