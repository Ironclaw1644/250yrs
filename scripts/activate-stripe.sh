#!/usr/bin/env bash
# One-shot Stripe activation for BOTH sites once the two keys are pasted into
# this worktree's .env.local. Verifies the keys belong to the Trueamericanwear
# account before touching anything; never prints a secret.
#
#   bash scripts/activate-stripe.sh
#
set -euo pipefail

WT="$(cd "$(dirname "$0")/.." && pwd)"                 # marketplace (trueamericanwhere)
CLOTHING="/Users/ironclaw/projects/250yrs"             # clothing store (trueamericanwear)
ENVF="$WT/.env.local"
EXPECTED_ACCT="acct_1TrAWSQaaIqHPCQl"                  # client account — hard guard

get() { grep "^$1=" "$ENVF" | head -1 | cut -d= -f2- | tr -d '"' | tr -d '\r'; }

SK="$(get STRIPE_SECRET_KEY)"
PK="$(get NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
if [ -z "$SK" ] || [ -z "$PK" ]; then
  echo "✗ STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing in $ENVF"
  echo "  Paste them from https://dashboard.stripe.com/${EXPECTED_ACCT}/apikeys first."
  exit 1
fi

echo "→ 1/5 account guard"
ACCT=$(curl -s https://api.stripe.com/v1/account -u "$SK:" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("id",""))')
echo "   key belongs to: ${ACCT:-<none>}"
if [ "$ACCT" != "$EXPECTED_ACCT" ]; then
  echo "✗ WRONG ACCOUNT — expected $EXPECTED_ACCT. Aborting, nothing changed."
  exit 1
fi

# Create (or recreate, to obtain a fresh signing secret) a webhook endpoint.
mk_webhook() { # url, events...
  local url="$1"; shift
  local existing
  existing=$(curl -s "https://api.stripe.com/v1/webhook_endpoints?limit=100" -u "$SK:" \
    | python3 -c 'import json,sys; u=sys.argv[1]; d=json.load(sys.stdin); print(" ".join(e["id"] for e in d.get("data",[]) if e.get("url")==u))' "$url")
  for id in $existing; do
    curl -s -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$id" -u "$SK:" >/dev/null
  done
  local args=(-s https://api.stripe.com/v1/webhook_endpoints -u "$SK:" --data-urlencode "url=$url")
  for ev in "$@"; do args+=(--data-urlencode "enabled_events[]=$ev"); done
  curl "${args[@]}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("secret","")) if "secret" in d else sys.exit("create failed: "+json.dumps(d)[:200])'
}

echo "→ 2/5 webhook endpoints"
WH_MARKET=$(mk_webhook "https://trueamericanwhere.vercel.app/api/webhooks/stripe" \
  checkout.session.completed customer.subscription.created customer.subscription.updated customer.subscription.deleted)
echo "   ✓ marketplace endpoint (4 events)"
WH_CLOTHING=$(mk_webhook "https://www.trueamericanwear.com/api/webhooks/stripe" \
  payment_intent.succeeded payment_intent.payment_failed)
echo "   ✓ clothing endpoint (2 events)"

pushenv() { # cwd, key, value
  vercel env rm "$2" production --yes --cwd "$1" >/dev/null 2>&1 || true
  printf '%s' "$3" | vercel env add "$2" production --cwd "$1" >/dev/null
  echo "   ✓ $2 → $(basename "$1" | sed 's/recursing.*/trueamericanwhere/')"
}

echo "→ 3/5 Vercel env (marketplace)"
pushenv "$WT" STRIPE_SECRET_KEY "$SK"
pushenv "$WT" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$PK"
pushenv "$WT" STRIPE_WEBHOOK_SECRET "$WH_MARKET"

echo "→ 4/5 Vercel env (clothing) + local mirrors"
pushenv "$CLOTHING" STRIPE_SECRET_KEY "$SK"
pushenv "$CLOTHING" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$PK"
pushenv "$CLOTHING" STRIPE_WEBHOOK_SECRET "$WH_CLOTHING"
# Mirror into local env files for dev (0600, no printing).
umask 077
upsert_env() { # file, key, value
  grep -q "^$2=" "$1" 2>/dev/null && sed -i '' "s|^$2=.*|$2=$3|" "$1" || echo "$2=$3" >> "$1"
}
upsert_env "$ENVF" STRIPE_WEBHOOK_SECRET "$WH_MARKET"
upsert_env "$CLOTHING/.env.local" STRIPE_SECRET_KEY "$SK"
upsert_env "$CLOTHING/.env.local" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$PK"
upsert_env "$CLOTHING/.env.local" STRIPE_WEBHOOK_SECRET "$WH_CLOTHING"
echo "   ✓ local .env.local files updated"

echo "→ 5/5 redeploy both sites"
vercel deploy --prod --yes --cwd "$WT" 2>&1 | grep -oE '"message": "[^"]*"' | head -1
vercel deploy --prod --yes --cwd "$CLOTHING" 2>&1 | grep -oE '"message": "[^"]*"' | head -1

echo "→ smoke checks"
echo "   marketplace unsigned webhook (want 400): $(curl -s -o /dev/null -w '%{http_code}' -X POST -d '{}' https://trueamericanwhere.vercel.app/api/webhooks/stripe)"
echo "   clothing unsigned webhook (want 400):    $(curl -s -o /dev/null -w '%{http_code}' -X POST -d '{}' https://www.trueamericanwear.com/api/webhooks/stripe)"
echo "   clothing checkout page:                  $(curl -s -o /dev/null -w '%{http_code}' https://www.trueamericanwear.com/checkout)"
echo ""
echo "DONE — both sites are wired to $EXPECTED_ACCT."
