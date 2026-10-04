# Rifa Fácil — Aplicativo Web

Aplicativo web responsivo e instalável (PWA) para uma rifa de 100 números. Inclui página pública, reservas, QR Code Pix, painel administrativo e persistência SQLite.

## Rodar no Windows
1. Instale Node.js 20 ou superior: https://nodejs.org/
2. Extraia o ZIP.
3. Abra o terminal dentro da pasta `rifa-online`.
4. Execute `npm install`.
5. Defina uma senha de administrador antes de iniciar. No PowerShell:
   ```powershell
   $env:ADMIN_PASSWORD="coloque-uma-senha-forte-aqui"
   npm start
   ```
6. Abra http://localhost:3000. Painel: http://localhost:3000/admin.html

Se fechar o terminal, o servidor local para. `localhost` só funciona no próprio computador.

## Publicar na internet com persistência
1. Crie uma conta em https://render.com/ e coloque este projeto em um repositório GitHub.
2. No Render, escolha **New + → Blueprint** e conecte o repositório que contém `render.yaml`.
3. O arquivo configura um serviço Node, um disco persistente de 1 GB em `/var/data` e gera `ADMIN_PASSWORD` automaticamente. O serviço com disco persistente pode ter cobrança conforme o plano vigente do Render.
4. Aguarde a publicação e use o endereço HTTPS gerado para compartilhar a rifa.
5. No painel administrativo, configure título, prêmio, preço, data e chave Pix; envie a imagem do QR Code.
6. Guarde a senha administrativa gerada nas variáveis de ambiente do serviço. Não use a senha padrão.

## Como funciona o pagamento
O QR Code anexado é uma imagem e não confirma recebimento automaticamente. O comprador reserva um número, faz o Pix e envia o comprovante; o administrador confere o pagamento e marca como “Pago / vendido”. Uma reserva não equivale a pagamento confirmado. Esta versão não integra uma API de pagamentos.

## Notas
- Os números são compartilhados entre visitantes porque as reservas são gravadas no servidor.
- Uma reserva fica bloqueada até o administrador alterar seu status.
- A instalação PWA aparece em navegadores compatíveis quando o site estiver publicado em HTTPS.
- Antes de divulgar, confira as regras legais aplicáveis a rifas/sorteios na sua região.
