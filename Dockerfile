FROM python:3.13-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies via the package metadata. We copy pyproject.toml first
# (and a minimal README so hatchling's build doesn't fail on missing files),
# then `pip install .` resolves anthropic, fastapi, uvicorn[standard].
COPY pyproject.toml README.md ./
COPY linkedin ./linkedin
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir .

# Drop privileges. Posts live at /app/posts via bind mount at runtime — read-only.
RUN adduser -D -H appuser \
 && mkdir -p /app/posts \
 && chown -R appuser:appuser /app
USER appuser

EXPOSE 8081

CMD ["uvicorn", "linkedin.server:app", "--host", "0.0.0.0", "--port", "8081"]
