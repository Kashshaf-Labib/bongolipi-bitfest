# Deploying the compute services (model + RAG + collab)

This bundle runs all three backend services on **one Ubuntu VM** with automatic
HTTPS. These steps use **AWS EC2** (works great with $200 of credit), but the
bundle is host-agnostic — any Ubuntu box with Docker works.

Caddy serves each service at an `sslip.io` hostname that resolves to your VM's
public IP, so there is **no DNS to configure**:

| Service | URL |
|---|---|
| mBART model | `https://model.<IP>.sslip.io` |
| RAG server | `https://rag.<IP>.sslip.io` |
| Collab (WebSocket) | `wss://collab.<IP>.sslip.io` |

*(`<IP>` written with dots, e.g. `model.13.51.20.7.sslip.io`.)*

---

## 1. Launch an EC2 instance

AWS Console → **EC2 → Launch instance**:
- **Name:** bongolipi
- **AMI:** Ubuntu Server 22.04 LTS
- **Instance type:** **t3.large** (8 GB RAM) — recommended.
  *To stretch credit you can use **t3.medium** (4 GB) and add swap (see below).*
- **Key pair:** create one and download the `.pem` (for SSH).
- **Network settings → Edit → Security group**, allow inbound:
  - **SSH (22)** from *My IP*
  - **HTTP (80)** from *Anywhere* (0.0.0.0/0)
  - **HTTPS (443)** from *Anywhere* (0.0.0.0/0)
- **Storage:** change the root volume to **30 GiB** (gp3).
- **Launch instance.**

**Give it a stable IP** (important — the URLs embed the IP): EC2 → *Elastic IPs*
→ **Allocate**, then **Associate** it with this instance. Use that Elastic IP as
`<IP>` everywhere below.

> AWS's security group is the firewall — no iptables setup needed (unlike Oracle).

**Cost with credit:** t3.large ≈ $60/mo, so ~3 months on $200. **Stop** the
instance when you're not using it (EC2 → Instance state → Stop) to pay only for
storage (~$2–3/mo); the Elastic IP keeps the address stable.

---

## 2. Connect

```bash
chmod 400 your-key.pem                 # mac/linux
ssh -i your-key.pem ubuntu@<IP>
```
*(Windows: use the `.pem` with `ssh -i` in PowerShell, or PuTTY.)*

**(Optional) add swap** — recommended if you chose t3.medium (4 GB):
```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
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
- `VM_IP` — the Elastic IP (with dots).
- `GROQ_API_KEY` — your Groq key.
- `COLLAB_SECRET` — **must match** the app's `COLLAB_SECRET`.
- `MONGODB_URI`, `DBNAME` — your Atlas connection.
- `ALLOWED_ORIGINS` — your app origins, e.g.
  `https://your-app.vercel.app,http://localhost:3000` (or `*` while testing).

---

## 5. Run it

```bash
docker compose up -d --build
```
First build takes a few minutes. The model then downloads (~2.4 GB) and loads on
first boot (~1–2 min). Watch it:
```bash
docker compose ps
docker compose logs -f model      # wait for "[model] ready on cpu"
```

---

## 6. Verify

```bash
curl https://model.$(grep VM_IP .env | cut -d= -f2).sslip.io/
curl -X POST https://model.<IP>.sslip.io/banglish \
  -H "Content-Type: application/json" \
  -d '{"text":"ajke amar mon onek bhalo"}'      # -> Bangla
curl https://rag.<IP>.sslip.io/docs             # FastAPI docs
```
The first HTTPS request triggers Caddy to fetch certificates (~10–30 s).

---

## 7. Point the app at these services

Set these in the Next.js app (Vercel **Environment Variables**, or
`client/.env.local` for local dev), then redeploy / restart:

```
NEXT_PUBLIC_BANGLISH_API=https://model.<IP>.sslip.io
NEXT_PUBLIC_PDF_QUERY_URL=https://rag.<IP>.sslip.io
NEXT_PUBLIC_COLLAB_URL=wss://collab.<IP>.sslip.io
COLLAB_SECRET=<same value as deploy/.env>
```

Now the converter + editors use your **mBART** model, the chatbot's PDF Q&A uses
the **RAG** server, and collaboration connects to the **collab** server — all on
one AWS instance.

---

## Operations

```bash
docker compose logs -f            # all logs
docker compose restart <svc>      # restart one service
git pull && docker compose up -d --build   # apply updates
docker compose down               # stop everything
```

Tighten CORS once live: set `ALLOWED_ORIGINS` in `.env` to just your Vercel
domain and re-run `docker compose up -d`.
