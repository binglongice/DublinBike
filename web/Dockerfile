FROM python:3.9-slim

WORKDIR /python-docker

ENV FLASK_RUN_HOST=0.0.0.0

RUN apt-get update
RUN apt-get install python3-dev default-libmysqlclient-dev gcc  -y

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python3", "app.py"]
