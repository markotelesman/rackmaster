# Koristi službeni, lagani Python image kao bazu
FROM python:3.11-slim

# Postavi radni direktorij unutar kontejnera na /app
WORKDIR /app

# Kopiraj requirements.txt u kontejner
COPY requirements.txt .

# Instaliraj sve potrebne Python pakete
RUN pip install --no-cache-dir -r requirements.txt

# Kopiraj sve ostale datoteke iz tvog projekta u kontejner
COPY . .

# Izloži port 5000, na kojem radi tvoja Flask aplikacija
EXPOSE 5000

# Naredba koja će se pokrenuti kada se kontejner upali
# Flask će biti dostupan s bilo koje IP adrese unutar Docker mreže
CMD ["python", "app.py"]
