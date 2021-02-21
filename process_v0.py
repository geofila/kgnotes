from flask import Flask, render_template, request, jsonify, flash
from flask_sqlalchemy import SQLAlchemy

import json
import os

from datetime import datetime
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///annotations.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

db = SQLAlchemy(app)

class Annotation(db.Model):
	# id = db.Column(db.Integer)
	filename = db.Column(db.Text, nullable=False, primary_key=True)
	text = db.Column(db.Text, nullable=False, primary_key=True)
	start = db.Column(db.Integer, nullable=False, primary_key=True)
	annotation = db.Column(db.Text, nullable=False, primary_key=True)
	# comment = db.Column(db.Text)
	timestamp = db.Column(db.DateTime, nullable=False, default= datetime.utcnow)

	def __repr__(self):
		return f"Text('{self.text}', '{self.annotation}', '{self.timestamp}')"

from editor import *

@app.route('/')
def index():
	return render_template('form.html')

@app.route('/read_transcript', methods=['POST'])
def read_transcript():
	filename = request.form['filename']
	return jsonify({'response' : load_transcript(filename)})


@app.route('/add_annotation', methods=['POST'])
def add_annotation():
	filename = request.form['filename']
	focused_text = request.form['focused_text']
	annotation = request.form['annotation']
	text = load_transcript(filename, annotate= False)
	try:
		start = text.index(focused_text) # to do: na ginetai pio swsta o elegxos
	except:
		print (f"Can't Find that string in text")
		return jsonify({'response' : annotate_text(text)})

	#add new annotation to  database
	new_annotation = Annotation(filename= filename, text = focused_text, start = start, annotation= annotation)
	db.session.add(new_annotation)
	db.session.commit()
	#re-annotate text to include new annotation
	new_text = annotate_text(text)
	return jsonify({'response' : new_text})

# @app.route('/remove_annotation', methods=['POST'])
# def remove_annotation():
# 	ann_id = request.form['id']
# 	Annotation.query.filter_by(id= ann_id).delete()
# 	db.session.commit()
# 	return read_transcript()


@app.route("/load_word_array", methods=["POST"])
def load_word_array():
	wa = word_array()
	return jsonify({'response' : wa})



@app.route("/get_annotations", methods=["POST"])
def get_annotations():
	filename = request.form["filename"]
	text = request.form["text"]
	answers = Annotation.query.filter_by(filename= filename, text = text).all()
	annotations = [ann.annotation for ann in answers]
	# comments = "\n".join([ann.comment for ann in answers if ann.comment != None])
	return jsonify({'annotations' : annotations})


@app.route("/add_annotations_plus", methods=["POST"])
def get_annotations_plus():
	filename = request.form['filename']
	focused_text = request.form['focused_text']
	annotations = json.loads(request.form['annotation'])
	text = load_transcript(filename, annotate= False)
	try:
		start = text.index(focused_text) # to do: na ginetai pio swsta o elegxos
	except:
		print (f"Can't Find that string in text")
		return jsonify({'response' : annotate_text(text)})

	known_annotations = Annotation.query.filter_by(filename= filename, text = focused_text, start = start).all()
	known_annotations = [i.annotation for i in known_annotations]
	for ann in annotations:
		if ann["value"] not in known_annotations:
			new_annotation = Annotation(filename= filename, text = focused_text, start = start, annotation= ann["value"])
			db.session.add(new_annotation)

	annotations = [ann["value"] for ann in annotations]
	for k_ann in known_annotations:
		if k_ann not in annotations:
			Annotation.query.filter_by(filename= filename, text = focused_text, start = start, annotation= k_ann).delete()

	db.session.commit()
	new_text = annotate_text(text)
	return jsonify({'response' : new_text})

@app.route("/get_filenames", methods=["POST"])
def get_filenames():
	files = os.listdir("static/transcripts/")
	return jsonify({'files' : files})


if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
