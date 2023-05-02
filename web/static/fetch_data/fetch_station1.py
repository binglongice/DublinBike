import datetime
import json
import time
import traceback

import requests
import sqlalchemy as sqla
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

Session = sessionmaker()

api_key = "75776090a3600bd91fe0136a435524a27c6a2e9b"
url = "https://api.jcdecaux.com/vls/v1/stations"

user_name = "admin"
pw = "testtest"
db_name = "dbike"
engine = create_engine(f'mysql://{user_name}:{pw}@dublin-bikes.c8ncoffpzeko.eu-west-1.rds.amazonaws.com/{db_name}')

metadata = sqla.MetaData()

local_session = scoped_session(Session)
local_session.configure(bind=engine, autoflush=False, expire_on_commit=False)
session = local_session


def gen_query(data_array):
    res = []
    for d in data_array:
        res.append(
            f"('{d['available_bikes']}', '{d['available_bike_stands']}', '{d['number']}', '{d['last_update']}', '{d['status']}')")
    return f'''
        INSERT INTO availability(available_bikes, available_bike_stands, number, last_update, status)
            VALUES {",".join(res)}
        ON DUPLICATE KEY UPDATE
            available_bikes = VALUES(available_bikes),
            available_bike_stands = VALUES(available_bike_stands),
            status = VALUES(status)
    '''


def write_to_db(text):
    print("Writing to database ...")
    session.execute(gen_query(json.loads(text)))
    session.commit()
    print("Writing to database done")


def main():
    while True:
        try:
            now = datetime.datetime.now()
            r = requests.get(url, params={"apiKey": api_key, "contract": "dublin"})
            print(r, now)
            write_to_db(r.text)
            time.sleep(5 * 60)
        except:
            print(traceback.format_exc())


if __name__ == '__main__':
    main()
