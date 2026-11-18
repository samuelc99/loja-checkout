// Formulário de cartão do próprio Mercado Pago (Card Payment Brick).
// Os dados do cartão vão direto para o Mercado Pago; nosso sistema recebe só um token.
export default function CartaoMercadoPago(containerId, publicKey, valor, onPagar, onFalha) {
  const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
  return mp.bricks().create('cardPayment', containerId, {
    initialization: { amount: valor },
    customization: { paymentMethods: { maxInstallments: 1 } },
    callbacks: {
      onReady: () => {},
      onSubmit: (dados, extra) =>
        onPagar({ token: dados.token, paymentMethodId: dados.payment_method_id, tipo: extra?.paymentTypeId }),
      onError: (err) => {
        console.error('Formulário de cartão:', err);
        if (err?.type === 'critical') onFalha?.(); // ex.: valor abaixo do mínimo aceito para cartão
      },
    },
  });
}
