# app.py
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from pony.orm import db_session, select, commit, count
from datetime import datetime

# Uvozimo bazu podataka i modele
from baza import db, Ormar, Hardver

# Inicijalizacija Flask aplikacije
app = Flask(__name__)
CORS(app)

# Povezivanje s bazom podataka i mapiranje modela.
db.bind(provider='sqlite', filename='database.sqlite', create_db=True)
db.generate_mapping(create_tables=True)

# Pomoćna funkcija za kreiranje testnih podataka
@db_session
def create_test_data():
    """Kreira testne ormare i hardver u bazi podataka ako ne postoje."""
    if not Ormar.exists():
        print("Kreiranje testnih ormara...")
        ormar1 = Ormar(ime_ormara="ORMAR-A1", pozicija_red=1, pozicija_stupac=1, broj_rack_unita=42, lokacija="Podatkovni Centar 1")
        ormar2 = Ormar(ime_ormara="ORMAR-B2", pozicija_red=1, pozicija_stupac=2, broj_rack_unita=42, lokacija="Podatkovni Centar 1")
        
        print("Kreiranje testnog hardvera...")
        Hardver(tip_opreme="Server", proizvodac="HP", model="ProLiant DL380 Gen10", serijski_broj=1001, datum_instalacije=datetime(2023, 1, 15), status="Aktivan", datum_servisa=datetime(2024, 1, 15), pozicija_u_kabinetu=1, rack_unit_size=2, id_ormar=ormar1)
        Hardver(tip_opreme="Switch", proizvodac="Cisco", model="Catalyst 9300", serijski_broj=1002, datum_instalacije=datetime(2023, 2, 20), status="Aktivan", datum_servisa=None, pozicija_u_kabinetu=3, rack_unit_size=1, id_ormar=ormar1)
        Hardver(tip_opreme="Firewall", proizvodac="Palo Alto", model="PA-440", serijski_broj=1003, datum_instalacije=datetime(2023, 5, 10), status="Aktivan", datum_servisa=None, pozicija_u_kabinetu=5, rack_unit_size=1, id_ormar=ormar1)
        
        Hardver(tip_opreme="Server", proizvodac="Dell", model="PowerEdge R750", serijski_broj=2001, datum_instalacije=datetime(2023, 3, 5), status="Servis", datum_servisa=datetime(2024, 3, 5), pozicija_u_kabinetu=1, rack_unit_size=2, id_ormar=ormar2)
        Hardver(tip_opreme="Router", proizvodac="Juniper", model="MX104", serijski_broj=2002, datum_instalacije=datetime(2023, 7, 1), status="Aktivan", datum_servisa=None, pozicija_u_kabinetu=4, rack_unit_size=2, id_ormar=ormar2)
        
        commit()
        print("Testni podaci uspješno kreirani.")

create_test_data()

# --- Pomoćne funkcije ---
def ormar_to_dict(ormar):
    return {
        'id': ormar.id,
        'ime_ormara': ormar.ime_ormara,
        'pozicija_red': ormar.pozicija_red,
        'pozicija_stupac': ormar.pozicija_stupac,
        'broj_rack_unita': ormar.broj_rack_unita,
        'lokacija': ormar.lokacija
    }

def hardver_to_dict(hardver):
    return {
        'id': hardver.id,
        'tip_opreme': hardver.tip_opreme,
        'proizvodac': hardver.proizvodac,
        'model': hardver.model,
        'serijski_broj': hardver.serijski_broj,
        'datum_instalacije': hardver.datum_instalacije.isoformat() if hardver.datum_instalacije else None,
        'status': hardver.status,
        'datum_servisa': hardver.datum_servisa.isoformat() if hardver.datum_servisa else None,
        'pozicija_u_kabinetu': hardver.pozicija_u_kabinetu,
        'rack_unit_size': hardver.rack_unit_size,
        'id_ormar': ormar_to_dict(hardver.id_ormar)
    }

# --- Rute za renderiranje HTML stranica ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ormari')
def ormari_page():
    return render_template('ormari.html')

@app.route('/hardver')
def hardver_page():
    return render_template('hardver.html')

@app.route('/vizualizacije')
def vizualizacije_page():
    return render_template('vizualizacije.html')

@app.route('/ormar_detalji')
def ormar_detalji_page():
    return render_template('ormar_detalji.html')

# --- API rute za ormare ---
@app.route('/api/ormari', methods=['GET'])
@db_session
def get_ormari():
    ormari = select(o for o in Ormar)[:]
    return jsonify([ormar_to_dict(o) for o in ormari])

@app.route('/api/ormar/<int:id>', methods=['GET'])
@db_session
def get_ormar(id):
    ormar = Ormar.get(id=id)
    if not ormar:
        return jsonify({'error': 'Ormar not found'}), 404
    
    ormar_data = ormar_to_dict(ormar)
    hardver_data = [hardver_to_dict(h) for h in ormar.hardver]
    
    return jsonify({'ormar': ormar_data, 'hardver': hardver_data})

@app.route('/api/ormari', methods=['POST'])
@db_session
def create_ormar():
    data = request.json
    try:
        ormar = Ormar(**data)
        commit()
        return jsonify(ormar_to_dict(ormar)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ormar/<int:id>', methods=['PUT'])
@db_session
def update_ormar(id):
    ormar = Ormar.get(id=id)
    if not ormar:
        return jsonify({'error': 'Ormar not found'}), 404
    data = request.json
    try:
        ormar.set(**data)
        commit()
        return jsonify(ormar_to_dict(ormar))
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ormar/<int:id>', methods=['DELETE'])
@db_session
def delete_ormar(id):
    ormar = Ormar.get(id=id)
    if not ormar:
        return jsonify({'error': 'Ormar nije pronađen'}), 404
    
    # PROVJERA: Provjeravamo postoji li hardver povezan s ormarom
    if count(ormar.hardver) > 0:
        # Ako postoji hardver, vraćamo grešku i ne brišemo ormar
        return jsonify({'error': 'Ormar nije prazan i ne može se obrisati. Prvo uklonite sav hardver.'}), 409 # 409 Conflict je prikladan status

    # Ako je ormar prazan, brišemo ga
    ormar.delete()
    commit()
    return jsonify({'message': 'Prazan ormar je uspješno obrisan.'}), 200

# --- API rute za hardver ---
@app.route('/api/hardver', methods=['GET'])
@db_session
def get_hardver_list():
    hardveri = select(h for h in Hardver)[:]
    return jsonify([hardver_to_dict(h) for h in hardveri])

@app.route('/api/hardver/<int:id>', methods=['GET'])
@db_session
def get_hardver(id):
    hardver = Hardver.get(id=id)
    if not hardver:
        return jsonify({'error': 'Hardver not found'}), 404
    return jsonify(hardver_to_dict(hardver))

@app.route('/api/hardver', methods=['POST'])
@db_session
def create_hardver():
    data = request.json
    try:
        ormar = Ormar.get(id=data['id_ormar'])
        if not ormar:
            return jsonify({'error': 'Ormar not found'}), 404
        data['id_ormar'] = ormar

        if 'datum_instalacije' in data:
            data['datum_instalacije'] = datetime.fromisoformat(data['datum_instalacije'].replace('Z', ''))
        if data.get('datum_servisa'):
            data['datum_servisa'] = datetime.fromisoformat(data['datum_servisa'].replace('Z', ''))

        hardver = Hardver(**data)
        commit()
        return jsonify(hardver_to_dict(hardver)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/hardver/<int:id>', methods=['PUT'])
@db_session
def update_hardver(id):
    hardver = Hardver.get(id=id)
    if not hardver:
        return jsonify({'error': 'Hardver not found'}), 404

    data = request.json
    try:
        if 'id_ormar' in data:
            ormar = Ormar.get(id=data['id_ormar'])
            if not ormar:
                return jsonify({'error': 'Ormar not found'}), 404
            data['id_ormar'] = ormar
        
        if 'datum_instalacije' in data and data.get('datum_instalacije'):
            data['datum_instalacije'] = datetime.fromisoformat(data['datum_instalacije'].replace('Z', ''))
        else:
             # Ukloni ključ ako je None ili ga nema, da ga Pony ne pokuša ažurirati
            data.pop('datum_instalacije', None)

        if 'datum_servisa' in data and data['datum_servisa']:
            data['datum_servisa'] = datetime.fromisoformat(data['datum_servisa'].replace('Z', ''))
        else:
            data['datum_servisa'] = None

        hardver.set(**data)
        commit()
        return jsonify(hardver_to_dict(hardver))
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/hardver/<int:id>', methods=['DELETE'])
@db_session
def delete_hardver(id):
    hardver = Hardver.get(id=id)
    if not hardver:
        return jsonify({'error': 'Hardver not found'}), 404

    hardver.delete()
    commit()
    return jsonify({'message': 'Hardver deleted successfully'}), 200

# --- Vizualizacije ---
@app.route('/api/vizualizacije/status', methods=['GET'])
@db_session
def get_status_data():
    status_counts = select((h.status, count(h)) for h in Hardver).order_by(1)[:]
    result = {status: broj for status, broj in status_counts}
    return jsonify(result)

@app.route('/api/vizualizacije/popunjenost', methods=['GET'])
@db_session
def get_occupancy_data():
    ormari = select(o for o in Ormar)[:]
    data = []
    for o in ormari:
        zauzeto_ru = sum(h.rack_unit_size for h in o.hardver)
        ukupan_ru = o.broj_rack_unita
        data.append({
            'ime_ormara': o.ime_ormara,
            'ukupni_rack_unita': ukupan_ru,
            'zauzeti_rack_unita': zauzeto_ru
        })
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')