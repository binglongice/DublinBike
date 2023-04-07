from flask import Flask, g, render_template, jsonify, make_response
from sqlalchemy import create_engine, text
import json
import config
import mysql

app = Flask(__name__)

# Create an engine object to connect to the database
def connect_to_database():
    engine = create_engine("mysql://{}:{}@{}/{}".format(config.USER,
                                                        config.PASSWORD,
                                                        config.URI,
                                                        config.DB),echo=True)
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
        rows = json.dumps(rows,default=str)
    return make_response(jsonify(rows, 200))

@app.route("/stations")
def get_stations():
    engine = get_db()
    data = []
    rows = engine.execute('SELECT * FROM station')
    for row in rows:
        data.append(dict(row))
    return (jsonify(data), 200)
    # rows = [d.mapping for d in rows]
    # return (rows, 200)
    # with engine.connect() as conn:
    #     query = text('SELECT * FROM station')
    #     result = conn.execute(query)
    #     rows = result.fetchall()
    #     rows = [tuple(row) for row in rows]
    #     rows = json.dumps(rows,default=str)
    return make_response(jsonify(rows, 200))

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
        rows = result.fetchall()
        for row in rows:
            data.append(dict(row))

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
        result = conn.execute(query, station_id=station_id)
        rows = [dict(row) for row in result]
    return jsonify(rows)

if __name__ == '__main__':
    app.run(debug=True)