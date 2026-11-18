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
        if (err?.type === 'critical') onFalha?.();
      },
    },
  });
}
