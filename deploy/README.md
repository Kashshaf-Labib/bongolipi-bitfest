# Deploying the compute services (model + RAG + collab)

This bundle runs all three backend services on **one host** with automatic
HTTPS. It's designed for an **Oracle Cloud "Always Free" ARM VM**, but works on
any Ubuntu box with Docker.

Caddy serves each service at an `sslip.io` hostname that resolves to your VM's
public IP — so there is **no DNS to configure**:

| Service | URL |
|---|---|
| mBART model | `https://model.<VM_IP>.sslip.io` |
| RAG server | `https://rag.<VM_IP>.sslip.io` |
| Collab (WebSocket) | `wss://collab.<VM_IP>.sslip.io` |

*(`<VM_IP>` written with dots, e.g. `model.140.238.1.2.sslip.io`.)*

---

## 1. Create the VM (Oracle Always Free)

1. Sign up at https://www.oracle.com/cloud/free/ (a card is used for identity;
   Always-Free resources are never charged).
2. **Compute → Instances → Create instance.**
   - **Image:** Ubuntu 22.04.
   - **Shape:** *Ampere* → **VM.Standard.A1.Flex**, e.g. **2 OCPU / 12 GB**
     (4 OCPU / 24 GB is fine too — all Always Free).
   - Add your **SSH public key**.
   - Create, and note the **public IP**.

> If A1 capacity is unavailable in your region, try another Availability Domain
> or region, or retry later — ARM capacity comes and goes.

3. SSH in: `ssh ubuntu@<VM_IP>`

---

## 2. Open the firewall (two layers)

**a) Oracle Security List / NSG** (in the console): open ingress **TCP 80** and
**443** from `0.0.0.0/0` on the VM's subnet (Networking → VCN → Security Lists →
Add Ingress Rules).

**b) The VM's own iptables** (Oracle Ubuntu images block everything but SSH):
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # or log out and back in
```

---

## 4. Get the code and configure

```bash
git clone <your-repo-url> bongolipi
cd bongolipi/deploy
cp .env.example .env
nano .env
```
Fill in `.env`:
- `VM_IP` — the VM's public IP (with dots).
- `GROQ_API_KEY` — your Groq key.
- `COLLAB_SECRET` — **must match** the app's `COLLAB_SECRET`.
- `MONGODB_URI`, `DBNAME` — your Atlas connection.
- `ALLOWED_ORIGINS` — your app origins, e.g.
  `https://your-app.vercel.app,http://localhost:3000` (or leave `*` while testing).

---

## 5. Run it

```bash
docker compose up -d --build
```
The first build compiles PyTorch for ARM and can take **10–20 minutes**. The
model then downloads (~2.4 GB) and loads on first boot (~1–2 min).

Watch it come up:
```bash
docker compose ps
docker compose logs -f model      # wait for "[model] ready on cpu"
```

---

## 6. Verify

```bash
curl https://model.$VM_IP.sslip.io/        # {"status":"ok", ...}
curl -X POST https://model.$VM_IP.sslip.io/banglish \
  -H "Content-Type: application/json" \
  -d '{"text":"ajke amar mon onek bhalo"}'  # -> Bangla
curl https://rag.$VM_IP.sslip.io/docs       # FastAPI docs
```
The first HTTPS request triggers Caddy to fetch certificates (~10–30 s).

---

## 7. Point the app at these services

Set these in the Next.js app (Vercel **Environment Variables**, or
`client/.env.local` for local dev), then redeploy / restart:

```
NEXT_PUBLIC_BANGLISH_API=https://model.<VM_IP>.sslip.io
NEXT_PUBLIC_PDF_QUERY_URL=https://rag.<VM_IP>.sslip.io
NEXT_PUBLIC_COLLAB_URL=wss://collab.<VM_IP>.sslip.io
COLLAB_SECRET=<same value as deploy/.env>
```

Now the converter + editors use your **mBART** model, the chatbot's PDF Q&A uses
the **RAG** server, and collaboration connects to the **collab** server — all
from one free VM.

---

## Operations

```bash
docker compose logs -f            # all logs
docker compose restart <svc>      # restart one service
docker compose up -d --build      # apply code/.env changes (git pull first)
docker compose down               # stop everything
```

Tighten CORS once live: set `ALLOWED_ORIGINS` in `.env` to just your Vercel
domain and re-run `docker compose up -d`.
