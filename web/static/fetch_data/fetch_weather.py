import datetime
import time
import traceback

import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

Session = sessionmaker()

YOUR_API_KEY = "WSQCX887D48G2LJ5N5AMLQ7WS"
URL = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Dublin"

user_name = "admin"
pw = "testtest"
db_name = "dbike"
engine = create_engine(f'mysql://{user_name}:{pw}@dublin-bikes.c8ncoffpzeko.eu-west-1.rds.amazonaws.com/{db_name}')

conn = engine.connect()

local_session = scoped_session(Session)
local_session.configure(bind=engine, autoflush=False, expire_on_commit=False)
session = local_session


def handle_preciptype(origin):
    if origin:
        return ','.join(origin)
    else:
        return ''


def gen_insert_list(d):
    res = []
    date = d['datetime']
    for h in d['hours']:
        query = f"('{date} {h['datetime']}', '{d['tempmax']}', '{h['temp']}', '{d['tempmin']}', '{d['feelslikemax']}', '{h['feelslike']}', '{d['feelslikemin']}', '{h['precip']}', '{h['precipprob']}', '{d['precipcover']}', '{handle_preciptype(h['preciptype'])}', '{h['humidity']}', '{h['visibility']}', '{h['windspeed']}', '{h['winddir']}', '{h['conditions']}', '{d['sunrise']}', '{d['sunset']}')"
        res.append(query)
    return res


def gen_query(data_array):
    res = []
    for d in data_array:
        hours = gen_insert_list(d)
        for i in hours:
            res.append(i)
    return f'''
        INSERT INTO weather(datetime, tempmax, temp, tempmin, feelslikemax, feelslike, feelslikemin, precip, precipprob, precipcover, preciptype, humidity, visibility, windspeed, winddir, conditions, sunrise, sunset )
            VALUES {",".join(res)}
        ON DUPLICATE KEY UPDATE
            tempmax = VALUES(tempmax),
            temp = VALUES(temp),
            tempmin = VALUES(tempmin),
            feelslikemax = VALUES(feelslikemax),
            feelslike = VALUES(feelslike),
            feelslikemin = VALUES(feelslikemin),
            precip = VALUES(precip),
            precipprob = VALUES(precipprob),
            precipcover = VALUES(precipcover),
            preciptype = VALUES(preciptype),
            humidity = VALUES(humidity),
            visibility = VALUES(visibility),
            windspeed = VALUES(windspeed),
            winddir = VALUES(winddir),
            conditions = VALUES(conditions),
            sunrise = VALUES(sunrise),
            sunset = VALUES(sunset)
    '''


def write_to_db(text):
    print("Writing to database")
    session.execute(gen_query(text))
    session.commit()
    print("Writing to database Done")


def main():
    while True:
        try:
            now = datetime.datetime.now()
            response = requests.get(URL, params={"unitGroup": "metric", "key": YOUR_API_KEY, "contentType": "json"})
            if response.status_code != 200:
                print(f"Failed to download，error message：{response.status_code}")
            else:
                print(f"Fail to get response {response}")
            print(response, now)
            write_to_db(response.json()["days"])
            time.sleep(5 * 60)
        except:
            print(traceback.format_exc())
            if engine is None:
                return


if __name__ == '__main__':
    main()
