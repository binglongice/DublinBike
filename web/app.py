import json
import pickle

from flask import Flask, g, render_template, jsonify, make_response, request
from sqlalchemy import create_engine, text

import config

app = Flask(__name__)


# Create an engine object to connect to the database
def connect_to_database():
    engine = create_engine("mysql://{}:{}@{}/{}".format(config.USER,
                                                        config.PASSWORD,
                                                        config.URI,
                                                        config.DB), echo=True)
    return engine


@app.route('/')
def index():
    return render_template('index.html')


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.dispose()


@app.route("/availavilities")
def get_avail():
    engine = get_db()
    # rows = engine.execute('SELECT * FROM availability')
    # rows = [d.mapping for d in rows]
    # return (rows, 200)
    with engine.connect() as conn:
        query = text('SELECT * FROM availability')
        result = conn.execute(query)
        rows = result.fetchall()
        rows = [tuple(row) for row in rows]
        rows = json.dumps(rows, default=str)
    return make_response(jsonify(rows, 200))


@app.route("/stations")
def get_stations():
    engine = get_db()
    data = []
    with engine.connect() as conn:
        rows = conn.execute(text('SELECT * FROM station order by name'))
        for row in rows:
            data.append(row._asdict())
    return (jsonify(data), 200)


@app.route("/avg_bikes_per_hour")
def get_avg_bikes_per_hour():
    engine = get_db()
    data = []
    with engine.connect() as conn:
        query = text("""
            SELECT
                number,
                HOUR(last_update) as hour_of_day,
                AVG(available_bikes) as avg_bikes
            FROM availability
            WHERE WEEKDAY(last_update) BETWEEN 0 AND 6
            GROUP BY number, hour_of_day
            ORDER BY number, hour_of_day
        """)
        result = conn.execute(query)
        rows = result.all()
        for row in rows:
            data.append(row._asdict())

    return jsonify(data), 200


@app.route("/avg_bikes_per_day/<int:station_id>")
def get_avg_bikes_per_day(station_id):
    engine = get_db()
    data = []
    with engine.connect() as conn:
        query = text('''
            SELECT
                number,
                DAYOFWEEK(CONVERT_TZ(last_update, "+00:00", @@global.time_zone)) - 1 AS day_of_week,
                AVG(available_bikes) as avg_bikes
            FROM availability
            WHERE number = :station_id
            GROUP BY number, day_of_week
            ORDER BY day_of_week ASC
        ''')
        result = conn.execute(query, {'station_id': station_id})
        rows = [row._asdict() for row in result]
    return jsonify(rows)


@app.route("/weather_info_display")
def get_weather_info():
    engine = get_db()
    with engine.connect() as conn:
        query = text('''
            SELECT datetime, temp, conditions
            FROM weather
            WHERE datetime >= date_sub(now(), interval 0 hour)
            ORDER BY datetime limit 1
        ''')
        result = conn.execute(query)
        row = result.fetchone()
    return jsonify(row._asdict()), 200


@app.route("/prediction", methods=['GET'])
def get_prediction():
    from os.path import join, dirname, realpath

    engine = get_db()
    args = request.args
    station_number = args.get("station_number")
    if station_number is None:
        return "station_number is required", 400

    res = []

    with open(join(dirname(realpath(__file__)), f'NewModels/stationNo{int(station_number)}.pkl'), 'rb') as file:
        model = pickle.load(file)
        with engine.connect() as conn:
            query = text('''
                SELECT datetime, temp, windspeed, visibility, humidity, conditions 
                FROM weather 
                WHERE datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY);
            ''')
            result = conn.execute(query).fetchall()
            db_result = [row._asdict() for row in result]

        for db_weather in db_result:
            python_time = db_weather['datetime']
            pre_res = model.predict([
                [
                    station_number,
                    db_weather['temp'],
                    db_weather['windspeed'],
                    db_weather['visibility'],
                    db_weather['humidity'],
                    python_time.weekday(),
                    convert_condition_to_number(db_weather['conditions']),
                    python_time.hour
                ]
            ])
            res.append({'datetime': python_time.timestamp(), 'res': [pre_res[0][0], pre_res[0][1]]})
    return res, 200


def convert_condition_to_number(db_value):
    converter = {'Rain, Partially cloudy': 1,
                 'Overcast': 2,
                 'Partially cloudy': 3,
                 'Snow, Partially cloudy': 4,
                 'Snow, Rain, Overcast': 5,
                 'Snow, Overcast': 6,
                 'Rain, Overcast': 7,
                 'Snow, Rain, Partially cloudy': 8,
                 'Clear': 8
                 }
    return converter.get(db_value)


if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
