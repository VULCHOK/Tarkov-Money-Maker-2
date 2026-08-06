FROM python:3.12-slim

WORKDIR /app

# ── Dépendances en premier – cette couche est mise en cache tant que requirements.txt ne change pas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Code source en dernier – invalidation du cache uniquement si le code change
COPY . .

EXPOSE 3000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3000"]
