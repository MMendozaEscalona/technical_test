FROM python:3.8.10

ENV TZ=Europe/Madrid

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt


COPY app.py /app
EXPOSE 5000
