---
title: Bongolipi Banglish Bangla mBART
emoji: 🔤
colorFrom: orange
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# Banglish → Bangla mBART inference

Serves the fine-tuned `mbart-large-50` model for the Bongolipi app.

```
POST /banglish
{ "text": "ajke amar mon onek bhalo" }
-> { "generated_text": "আজকে আমার মন অনেক ভালো" }
```

Config via env: `MODEL_ID` (default `kashshaf-labib/banglish-bangla-mbart`),
`ALLOWED_ORIGINS` (comma-separated, defaults to `*`).
