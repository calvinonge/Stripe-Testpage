# Calvin Brand Interface

Sign up for a hangout with Calvin using a one-time Stripe test payment of **$1, $5, or $10 USD**. Stripe handles card entry and the app checks the session before displaying the receipt.

## Run locally

Use Node.js 22 and npm.

```sh
cp .env.example .env
npm ci
npm run dev
```

Open [localhost:5000](http://localhost:5000). Put your Stripe sandbox secret in `STRIPE_SECRET_KEY_TEST` in `.env` and restart to enable checkout. The server accepts `sk_test_` and `rk_test_` keys. A restricted key needs permission to create and retrieve Checkout Sessions. [Stripe sandbox API keys](https://dashboard.stripe.com/test/apikeys)

## Deploy on Render

Create a Blueprint from this repository and choose the branch containing `render.yaml`. The Blueprint creates a free Node web service in Singapore with `/healthz` as its health check. Enter `STRIPE_SECRET_KEY_TEST` in Render’s Environment settings. The site can load before a key is configured.

For a manual Render web service, use `npm ci --include=dev && npm run build` as the build command and `npm start` to run it. The server listens on Render’s `PORT`. Checkout uses `RENDER_EXTERNAL_URL` to return to your app. Set `APP_URL` to the HTTPS origin if you use a custom domain.

## Try each checkout outcome

| Outcome | What to do |
| --- | --- |
| Success | Pick each pass in turn and use `4242 4242 4242 4242`. The receipt should show the selected pass and amount. |
| Decline | Use `4000 0000 0000 0002` to trigger a decline in Stripe. |
| Cancel | Use Stripe’s back arrow. The storefront should show the cancellation and restore the selected pass. |

Use a future expiry date, any 3-digit CVC, and test contact details. Payments are simulated. [Stripe test cards](https://docs.stripe.com/testing)
