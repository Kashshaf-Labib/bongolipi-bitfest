# Hugging Face Space (Docker) that serves the fine-tuned Banglish->Bangla mBART.
FROM python:3.11-slim

# Run as a non-root user (Hugging Face Spaces convention).
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface

WORKDIR /home/user/app

COPY --chown=user requirements.txt .
# CPU torch resolves to the right arch wheel (arm64 CPU on an Oracle A1 VM).
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user . .

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
