FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ /app/backend/
COPY news_bias_filter.py /app/
WORKDIR /app/backend
ENV DATABASE_URL=""
ENV SECRET_KEY=""
ENV GCS_BUCKET=""
ENV OPENAI_API_KEY=""
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
