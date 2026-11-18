import * as mercadopago from './mercadopago.js';
import * as simulado from './simulado.js';

// Escolhe o módulo de integração pela variável de ambiente
const providers = { mercadopago, simulado };
export default providers[process.env.PAYMENT_PROVIDER] || simulado;
