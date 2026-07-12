# AWS deployment — full beginner walkthrough

This gets the three backend services (mBART model, RAG server, collab server)
running on a single AWS EC2 instance, from signing in to a working app. No prior
AWS experience needed. Follow it top to bottom.

You'll end up with three HTTPS URLs (no DNS setup — they use `sslip.io`):
`https://model.<IP>.sslip.io`, `https://rag.<IP>.sslip.io`, `wss://collab.<IP>.sslip.io`.

---

## Part 1 — Sign in and pick a region

1. Go to **https://console.aws.amazon.com** and sign in (root user email + password).
2. **Top-right, next to your name, pick a Region** and keep it the same for
   everything. Choose one near you, e.g. **Asia Pacific (Mumbai) `ap-south-1`**
   or **Singapore `ap-southeast-1`**.

> Everything you create (instance, IP) lives in one region — if things seem to
> "disappear," check you're in the right region.

---

## Part 2 — Launch the server (EC2 instance)

1. In the top search bar type **EC2** and open it. Click the orange
   **Launch instance**.
2. **Name:** `bongolipi`
3. **Application and OS Image (AMI):** click **Ubuntu**, choose
   **Ubuntu Server 22.04 LTS** (64-bit x86).
4. **Instance type:** choose **t3.large** (8 GB RAM).
   *(To save credit you can pick **t3.medium** (4 GB) and add swap later — Part 6.)*
5. **Key pair (login):** click **Create new key pair**.
   - Name: `bongolipi-key`, type **RSA**, format **.pem** → **Create**.
   - Your browser downloads `bongolipi-key.pem`. **Keep it** (it's a backup login
     method). We'll mainly connect through the browser, so you may not even need it.
6. **Network settings → click Edit:**
   - **Auto-assign public IP:** Enable.
   - **Firewall (security groups):** *Create security group*, and add these rules
     (click *Add security group rule* for each):
     - Type **SSH**, port 22, Source **Anywhere 0.0.0.0/0**
     - Type **HTTP**, port 80, Source **Anywhere 0.0.0.0/0**
     - Type **HTTPS**, port 443, Source **Anywhere 0.0.0.0/0**
7. **Configure storage:** change **8** to **30** GiB (gp3).
8. Click **Launch instance**. Then **View all instances**.
9. Wait ~1 minute until **Instance state = Running** and **Status check = 2/2 passed**.

---

## Part 3 — Give it a permanent IP (Elastic IP)

The URLs embed the IP, so we pin it so it never changes.

1. Left menu → **Network & Security → Elastic IPs**.
2. **Allocate Elastic IP address → Allocate.**
3. Select the new IP → **Actions → Associate Elastic IP address** → **Instance:**
   pick `bongolipi` → **Associate**.
4. **Write this IP down** — this is your `<IP>` for the rest of the guide
   (e.g. `13.51.20.7`).

---

## Part 4 — Connect to the server (in the browser)

1. **EC2 → Instances**, select `bongolipi`, click **Connect** (top).
2. Choose the **EC2 Instance Connect** tab → username stays `ubuntu` → **Connect**.
3. A black terminal opens **in your browser**, logged into the server. Use this
   for all the commands below.

> **If the browser terminal fails to open**, connect with the key instead:
> open **PowerShell** on your PC and run
> `ssh -i C:\path\to\bongolipi-key.pem ubuntu@<IP>`.
> If it complains the key is "too open," run:
> `icacls C:\path\to\bongolipi-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"`
> then try `ssh` again.

---

## Part 5 — Install Docker (paste into the server terminal)

```bash
sudo apt update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```
The last line should print two versions with no errors.

---

## Part 6 — (only if you chose t3.medium) add swap

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Part 7 — Get the code and configure it

```bash
git clone -b feat/collab https://github.com/Kashshaf-Labib/bongolipi-bitfest.git bongolipi
cd bongolipi/deploy
cp .env.example .env
nano .env
```

> **If `git clone` asks for a username/password**, your repo is private: enter
> your GitHub username, and for the password paste a **Personal Access Token**
> (GitHub → Settings → Developer settings → Tokens). Or make the repo public.

In the `nano` editor, fill these in (arrow keys to move; it's a normal text file):
- `VM_IP=` your Elastic IP (with dots), e.g. `13.51.20.7`
- `GROQ_API_KEY=` your Groq key (from console.groq.com)
- `COLLAB_SECRET=` any random string — **it must be identical** to `COLLAB_SECRET`
  in your app's `client/.env.local`
- `MONGODB_URI=` your Atlas connection string (same one from `client/.env.local`)
- `DBNAME=bongolipi`
- `ALLOWED_ORIGINS=*` (fine for now)

Save and exit nano: **Ctrl+O**, **Enter**, then **Ctrl+X**.

---

## Part 8 — Start everything

```bash
docker compose up -d --build
```
The first build takes a few minutes. Then the model downloads (~2.4 GB) and loads.

Watch it become ready:
```bash
docker compose ps                 # all should say "running"
docker compose logs -f model      # wait for:  [model] ready on cpu
```
Press **Ctrl+C** to stop watching the logs (the services keep running).

---

## Part 9 — Check it works

Open these in your normal browser (the first one may take ~20 s the first time,
while HTTPS certificates are issued):

- `https://model.<IP>.sslip.io/` → should show `{"status":"ok", ...}`
- `https://rag.<IP>.sslip.io/docs` → shows an API page

Quick translate test (in the server terminal):
```bash
curl -X POST https://model.<IP>.sslip.io/banglish \
  -H "Content-Type: application/json" \
  -d '{"text":"ajke amar mon onek bhalo"}'
```
You should get Bangla back.

---

## Part 10 — Point the app at your server

Add/update these in **`client/.env.local`** (and later in Vercel), then restart
the app (`npm run dev`):

```
NEXT_PUBLIC_BANGLISH_API=https://model.<IP>.sslip.io
NEXT_PUBLIC_PDF_QUERY_URL=https://rag.<IP>.sslip.io
NEXT_PUBLIC_COLLAB_URL=wss://collab.<IP>.sslip.io
COLLAB_SECRET=<the same value you put in deploy/.env>
```

Now test in the app:
- **Converter** → type Banglish → Translate → the result comes from **your mBART model**.
- **Chatbot** → upload a PDF, ask a question → answered by the **RAG server**.
- **Collaborate** on a document → connects to the **collab server**.

---

## Managing cost (your $200 credit)

- **t3.large ≈ $60/month**, so ~3 months on the credit.
- **Stop it when you're not using it:** EC2 → Instances → select → **Instance
  state → Stop**. Stopped = only ~$2–3/month for storage. **Start** it again when
  needed; the Elastic IP stays the same, so nothing else changes.
- Check spend anytime: **Billing and Cost Management → Credits / Free Tier**.

## Everyday commands (server terminal, in `bongolipi/deploy`)

```bash
docker compose logs -f          # see logs
docker compose restart model    # restart one service
docker compose down             # stop all
git pull && docker compose up -d --build   # apply updates
```

## Security note
We opened SSH to everyone for simplicity. Once you're set up, you can tighten it:
EC2 → Security Groups → edit the SSH (22) rule's source to **My IP**, and connect
with the `.pem` key from PowerShell instead of the browser.
