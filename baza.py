# baza.py
from pony.orm import *
from datetime import datetime

# Inicijalizacija baze podataka
db = Database()

class Ormar(db.Entity):
    ime_ormara = Required(str)
    pozicija_red = Required(int)
    pozicija_stupac = Required(int)
    broj_rack_unita = Required(int)
    lokacija = Required(str)
    hardver = Set('Hardver')

class Hardver(db.Entity):
    tip_opreme = Required(str)
    proizvodac = Required(str)
    model = Required(str)
    serijski_broj = Required(int, unique=True)
    datum_instalacije = Required(datetime)
    status = Required(str)
    datum_servisa = Optional(datetime)
    pozicija_u_kabinetu = Required(int)
    rack_unit_size = Required(int)
    id_ormar = Required(Ormar)
