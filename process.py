from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy

import json
import os
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///annotations.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

app.permanent_session_lifetime = timedelta(days=7)

db = SQLAlchemy(app)
class TextAnnotation(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	filename = db.Column(db.Text, nullable=False)
	text = db.Column(db.Text, nullable=False)
	start = db.Column(db.Integer, nullable=False)
	annotation = db.Column(db.Text, nullable=False)
	timestamp = db.Column(db.DateTime, nullable=False, default= datetime.utcnow)

	def __repr__(self):
		return f"Text('{self.text}', '{self.annotation}', '{self.timestamp}')"

class TextComment(db.Model):
	filename = db.Column(db.Text, nullable=False, primary_key=True)
	text = db.Column(db.Text, nullable=False, primary_key=True)
	start = db.Column(db.Integer, nullable=False, primary_key=True)
	comment = db.Column(db.Text, nullable=False)
	timestamp = db.Column(db.DateTime, nullable=False, default= datetime.utcnow)

	def __repr__(self):
		return f"Text('{self.text}', '{self.comment}', '{self.timestamp}')"


class VideoAnnotation(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	filename = db.Column(db.Text, nullable=False)
	start_timestamp = db.Column(db.String, nullable=False)
	end_timestamp = db.Column(db.String, nullable=False)
	annotation = db.Column(db.Text, nullable=False)
	timestamp = db.Column(db.DateTime, nullable=False, default= datetime.utcnow)

	def __repr__(self):
		return f"Text('{self.filename}', '{self.annotation}', '{self.timestamp}')"

class VideoComment(db.Model):
	filename = db.Column(db.Text, nullable=False, primary_key=True)
	start_timestamp = db.Column(db.String, nullable=False, primary_key=True)
	end_timestamp = db.Column(db.String, nullable=False, primary_key=True)
	comment = db.Column(db.Text)
	timestamp = db.Column(db.DateTime, nullable=False, default= datetime.utcnow)

	def __repr__(self):
		return f"Text('{self.filename}', '{self.comment}', '{self.timestamp}')"



#import editor dependency
from textEditor import *
from videoEditor import *
from search import *



@app.route("/")
def index():
	if "user_id" not in session:
		return redirect(url_for('login'))
	return render_template("index.html")

@app.route("/get_filenames", methods=["POST"]) #for autocomplete
def get_filenames():
	if "user_id" not in session:
		return redirect(url_for('login'))
	files = os.listdir("static/transcripts/")
	files = [f for f in files if f.split(".")[-1] in ["txt", "mp4"]] # keep only mp4 or txt files
	return jsonify({'files' : files})

@app.route("/load_word_array", methods=["POST"]) #read words of ontology
def load_word_array():
	if "user_id" not in session:
		return redirect(url_for('login'))
	global word_array_text
	array = pd.read_csv("static/ontology/ontology.csv", sep ="\t")
	word_array = [{"text": row[1][0], "weight": row[1][1], "class": row[1][2]} for row in array.iterrows()]
	session["word_array"] = [i["text"] for i in word_array]
	return jsonify({'response' : word_array})


@app.route("/read_transcript", methods=["POST"])
def read_transcript():
	if "user_id" not in session:
		return redirect(url_for('login'))
	filename = request.form['filename']
	if os.path.exists("static/transcripts/" + filename):
		try:
			response = load_transcript(filename)
			session["filename"] = filename # save file name to session
			return jsonify({'response' : response})
		except Exception as e:
			print (e)
			return jsonify({"response": "An Error Occurred! Please try again or report the error to the administration!"})
	else:
		return jsonify({"response": "File Does not Exists! Please enter a valid filename!"})

@app.route('/add_annotation', methods=['POST'])
def add_annotation():
	if "user_id" not in session:
		return redirect(url_for('login'))

	filename = session["filename"]
	focused_text = request.form['focused_text'].replace("\r", "")
	annotation = request.form['annotation']

	annotations = TextAnnotation.query.filter_by(filename = session['filename']).all()
	parts = [[ann.start, ann.start + len(ann.text)] for ann in annotations]

	text = load_transcript(filename, annotate= False)
	try:
		start = text.index(focused_text)
		for p in parts:
			if (start > p[0] and start < p[1]):
				raise "Inside Error!"
	except:
		print (f"Can't Find that string in text")
		return jsonify({'response' : annotate_text(text)})

	#add new annotation to  database
	if annotation in session["word_array"]:
		new_annotation = TextAnnotation(filename= filename, text = focused_text, start = start, annotation= annotation)
		db.session.add(new_annotation)
		db.session.commit()

	#re-annotate text to include new annotation
	new_text = annotate_text(text)
	return jsonify({'response' : new_text})


@app.route("/add_annotations_plus", methods=["POST"])
def get_annotations_plus():
	if "user_id" not in session:
		return redirect(url_for('login'))

	filename = session['filename']
	focused_text = request.form['focused_text'].replace("<br>", "\n")
	annotations = json.loads(request.form['annotation'])
	comment = request.form["comment"]

	text = load_transcript(filename, annotate= False)
	anns = TextAnnotation.query.filter_by(filename = session['filename']).all()
	parts = [[a.start, a.start + len(a.text)] for a in anns]
	try:
		start = text.index(focused_text)
		for p in parts:
			if (start > p[0] and start < p[1]):
				raise "Inside Error!"
	except:
		print (f"Can't Find that string in text")
		return jsonify({'response' : annotate_text(text)})

	known_annotations = TextAnnotation.query.filter_by(filename= filename, text = focused_text).all()
	known_annotations = [i.annotation for i in known_annotations]
	for ann in annotations:
		if ann["value"] not in known_annotations and ann["value"] in session["word_array"]:
			new_annotation = TextAnnotation(filename= filename, text = focused_text, start = start, annotation= ann["value"])
			db.session.add(new_annotation)

	#delete removed annotations
	annotations = [ann["value"] for ann in annotations]
	for k_ann in known_annotations:
		if k_ann not in annotations:
			TextAnnotation.query.filter_by(filename= filename, text = focused_text, start = start, annotation= k_ann).delete()

	com = TextComment.query.filter_by(filename= filename, text = focused_text, start = start).first()
	if com != None:
		com.comment = comment
	else:
		new_annotation = TextComment(filename= filename, text = focused_text, start = start, comment = comment)
		db.session.add(new_annotation)

	db.session.commit()
	new_text = annotate_text(text)
	return jsonify({'response' : new_text})


@app.route("/get_annotations", methods=["POST"])
def get_annotations():
	if "user_id" not in session:
		return redirect(url_for('login'))

	filename = session["filename"]
	text = request.form["text"].replace("<br>", "\n")
	answers = TextAnnotation.query.filter_by(filename= filename, text = text).all()
	annotations = [ann.annotation for ann in answers]

	comments = TextComment.query.filter_by(filename= filename, text = text).first()
	if comments == None:
		comment = ""
	else:
		comment = comments.comment
	return jsonify({'annotations' : annotations, "comments": comment})


@app.route("/login",  methods = ["GET", "POST"])
def login():
	if request.method == "POST":
		email = request.form["email"]
		password = request.form["password"]
		remember_me = "rememberMe" in request.form

		if email == "example_user@digigen.ails.com" and password == "123456789":
			session["user_id"] = email
			session.permanent = remember_me

			return  redirect(url_for('index'))
		else:
			return render_template('login.html', error= True)
	else:
		if "user_id" not in session:
			return render_template("login.html")

@app.route("/logout")
def logout():
	if "user_id" in session:
		session.pop("user_id")
	return redirect(url_for('login'))


@app.route("/ektaktianagkieinaiaparaititonaginei")
def ektaktianagkieinaiaparaititonaginei():
	db.drop_all()
	db.create_all()
	return render_template("index.html")




if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
