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
    rows = engine.execute('SELECT * FROM availability')
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

if __name__ == '__main__':
    app.run(debug=True)