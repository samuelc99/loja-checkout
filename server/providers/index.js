import * as mercadopago from './mercadopago.js';
import * as simulado from './simulado.js';

const providers = { mercadopago, simulado };
export default providers[process.env.PAYMENT_PROVIDER] || simulado;
