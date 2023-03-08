from flask import Flask, g, render_template, jsonify
from sqlalchemy import create_engine

import config

app = Flask(__name__)


# Create an engine object to connect to the database
def connect_to_database():
    engine = create_engine("mysql://{}:{}@{}/{}".format(config.USER,
                                                        config.PASSWORD,
                                                        config.URL,
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


@app.route("/stations")
def get_stations():
    engine = get_db()
    data = []
    rows = engine.execute("SELECT * from station")
    for row in rows:
        data.append(dict(row))
    return (jsonify(data), 200)


if __name__ == '__main__':
    app.run(debug=True)
