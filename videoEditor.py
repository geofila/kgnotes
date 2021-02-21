import re
import pandas as pd
from process import VideoAnnotation, VideoComment, app, db, session, request
import json
from flask import jsonify, session

@app.route('/save_annotation_video', methods=['POST'])
def save_annotation_video():
    if "user_id" not in session:
        return redirect(url_for('login'))
    filename = session["filename"]
    annotations = json.loads(request.form['annotation'])
    start_time = request.form["start_time"]
    end_time = request.form["end_time"]
    comment = request.form["comment"]


    known_annotations = VideoAnnotation.query.filter_by(filename= filename, start_timestamp = start_time, end_timestamp= end_time).all()
    known_annotations = [i.annotation for i in known_annotations]
    for ann in annotations:
        if ann["value"] not in known_annotations and ann["value"] in session["word_array"]:
            new_annotation = VideoAnnotation(filename= filename, start_timestamp = start_time, end_timestamp= end_time, annotation= ann["value"])
            db.session.add(new_annotation)

    com = VideoComment.query.filter_by(filename= filename, start_timestamp = start_time, end_timestamp= end_time).first()
    if com != None:
        com.comment = comment
    else:
        new_annotation = VideoComment(filename= filename, start_timestamp = start_time, end_timestamp= end_time, comment = comment)
        db.session.add(new_annotation)

    db.session.commit()
    return jsonify({'response' : "Saved Succesfully!"})
