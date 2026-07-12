import os
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import MBart50TokenizerFast, MBartForConditionalGeneration

MODEL_ID = os.environ.get("MODEL_ID", "kashshaf-labib/banglish-bangla-mbart")
SRC_LANG = "en_XX"
TGT_LANG = "bn_IN"
MAX_LEN = 128

app = FastAPI(title="Banglish -> Bangla mBART")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[model] loading {MODEL_ID} ...")
tokenizer = MBart50TokenizerFast.from_pretrained(MODEL_ID)
model = MBartForConditionalGeneration.from_pretrained(MODEL_ID)
model.eval()
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
forced_bos = tokenizer.lang_code_to_id[TGT_LANG]
print(f"[model] ready on {device}")


class TranslateRequest(BaseModel):
    text: str


@app.get("/")
def health():
    return {"status": "ok", "model": MODEL_ID}


@app.post("/banglish")
def banglish(req: TranslateRequest):
    text = (req.text or "").strip()
    if not text:
        return {"generated_text": ""}

    tokenizer.src_lang = SRC_LANG
    inputs = tokenizer(
        text, return_tensors="pt", truncation=True, max_length=MAX_LEN
    ).to(device)
    with torch.no_grad():
        generated = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos,
            max_length=MAX_LEN,
            num_beams=5,
        )
    output = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
    return {"generated_text": output}
