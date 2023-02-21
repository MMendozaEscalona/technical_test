from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS, cross_origin
import pandas as pd
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://factorial:Password123#..@db:3306/technical_test'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['CORS_HEADERS'] = ['Content-Type','Authorization']

db = SQLAlchemy(app)
url = 'mysql+pymysql://factorial:Password123#..@db:3306/technical_test'
engine = db.create_engine(url,{})
ma = Marshmallow(app)
app.app_context().push()

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(70))

    def __init__(self, name):
        self.name = name

class Metrics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file = db.Column(db.Integer, db.ForeignKey('file.id'))
    name = db.Column(db.String(70))
    value = db.Column(db.Integer)
    day = db.Column(db.String(30))
    hour = db.Column(db.Integer)
    minute = db.Column(db.Integer)

    def __init__(self, name, value, day, hour, minute):
        self.name = name
        self.value = value
        self.day = day
        self.hour = hour
        self.minute = minute

db.create_all()

class FileSchema(ma.Schema):
    class Meta:
        fields = ("id", "title")

class MetricsSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "value", "day", "hour", "minute")

file_schema = FileSchema()
metrics_schema = MetricsSchema()

def data_to_json(query):
    result = engine.execute(query).fetchall()
    formated = json.dumps([dict(ix) for ix in result], sort_keys=True, default=str )
    all_tables = {}
    for row in json.loads(formated):
        if row['name'] in all_tables.keys():
            all_tables[row['name']].append({"time": row['date'],
                                            "value": row['value'],
                                            "average": round(int(row['value']) / row['entries'], 2)})
        else:
            all_tables[row['name']] = []
            all_tables[row['name']].append({"time": row['date'],
                                            "value": row['value'],
                                            "average": round(int(row['value']) / row['entries'], 2)})
    return all_tables

@app.route('/metric', methods=['POST'])
@cross_origin(origins='http://localhost:3000',headers=['Content-Type','Authorization',
'application/x-www-form-urlencoded','*'], upports_credentials=True)
def create_metric():

    file = request.files['file']
    filename = file.filename

    new_file = File(filename)

    db.session.add(new_file)
    db.session.commit()


    new_df = pd.read_csv(file, parse_dates=['timestamp'])
    new_df['date-time-obj'] = pd.to_datetime(new_df["timestamp"], format="%Y-%m-%d %H:%M:%S")

    new_df['day'] = new_df['date-time-obj'].dt.date
    new_df['hour'] = new_df['date-time-obj'].dt.hour
    new_df['minute'] = new_df['date-time-obj'].dt.minute

    del new_df['date-time-obj']
    del new_df['timestamp']

    new_df['file'] = new_file.id
    new_df.to_json()

    new_df.to_sql(
        name='metrics',
        con=engine,
        if_exists='append',
        index=False,
    )

    query_by_day = db.select([db.cast(Metrics.day, db.Date).label("date"), db.func.count(db.cast(Metrics.day, db.Date)).label("entries"), db.func.sum(Metrics.value).label("value"), Metrics.name]).where(Metrics.file == new_file.id).group_by(Metrics.name, db.cast(Metrics.day, db.Date)).order_by(db.cast(Metrics.day, db.Date).asc())
    query_by_hour = db.select([Metrics.hour.label("date"), db.func.count(Metrics.hour).label("entries"), db.func.sum(Metrics.value).label("value"), Metrics.name]).where(Metrics.file == new_file.id).group_by(Metrics.name, Metrics.hour).order_by(Metrics.hour.asc())
    query_by_minute = db.select([Metrics.minute.label("date"), db.func.count(Metrics.minute).label("entries"), db.func.sum(Metrics.value).label("value"), Metrics.name]).where(Metrics.file == new_file.id).group_by(Metrics.name, Metrics.minute).order_by(Metrics.minute.asc())

    data_day = data_to_json(query_by_day)
    data_hour = data_to_json(query_by_hour)
    data_minute = data_to_json(query_by_minute)

    return { 'data_day': data_day, 'data_hour': data_hour, 'data_minute': data_minute }
if __name__ == "__main__":
    app.run(host="0.0.0.0")
