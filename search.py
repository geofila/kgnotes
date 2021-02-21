import re
import pandas as pd
from process import VideoAnnotation, VideoComment, TextAnnotation, TextComment, app, db, session, request
from flask import render_template, redirect, url_for, session

@app.route("/search/<searchTerm>")
def search(searchTerm):
    if "user_id" not in session:
        return redirect(url_for('login'))
	#search if term is valid (belongs to ontology)
    if searchTerm not in session["word_array"]:
        return render_template('search.html', searchTerm = searchTerm, error = "Oups! This term doesn't belong to ontology! Please try to import this term manual or contact to administrator!")


    textAnnotations = TextAnnotation.query.filter_by(annotation= searchTerm).all()
    if textAnnotations == None:
        return render_template('search.html', searchTerm = searchTerm, error="")

    textComments = []
    for ann in textAnnotations:
        comment = TextComment.query.filter_by(filename= ann.filename, text= ann.text, start=ann.start).first()
        if comment == None:
            textComments.append("")
        else:
            textComments.append(comment.comment)

    combinedAnnotations = getCombinedAnnotations(textAnnotations, searchTerm)
    relevant_labels = get_relevant_labels(combinedAnnotations)
    return render_template('search.html', searchTerm = searchTerm, error="", textAnnotations = textAnnotations,
                                    textComments=textComments, relevant_labels = relevant_labels, combinedAnnotations= combinedAnnotations)

def getCombinedAnnotations(annotations, searchTerm):
    combinedAnnotations = []
    for ann in annotations:
        all_ann = TextAnnotation.query.filter_by(filename= ann.filename, text= ann.text, start=ann.start).all()
        file_annotations = [c.annotation for c in all_ann if c.annotation != searchTerm]
        combinedAnnotations.append(file_annotations)
    return combinedAnnotations


def get_relevant_labels(combinedAnnotations):
    relevance = {}
    combinedAnnotations = [item for sublist in combinedAnnotations for item in sublist]
    for c in combinedAnnotations:
        if c in relevance:
            relevance[c] += 1
        else:
            relevance[c] = 1

    relevance = {k: v for k, v in sorted(relevance.items(), key=lambda item: item[1], reverse=True)}
    scores = list(relevance.values())
    i = 0
    for i, score in enumerate(scores):
        if score < 3:
            break
    return list(relevance.keys())[:max(i, 4)]




@app.route("/find_similar_text", methods=["POST"])
def find_similar_text():
    if "user_id" not in session:
        return redirect(url_for('login'))
    filename = request.form["filename"]
    focused_text = request.form["focusedText"]

    annotations = list(set([ann.annotation for ann in TextAnnotation.query.filter_by(filename= filename, text= focused_text).all()]))
    #find simmilar annotation => texts with common label
    fs, ts = [], []
    for ann in annotations:
        for ta in TextAnnotation.query.filter_by(annotation = ann).all():
            fs.append(ta.filename)
            ts.append(ta.text)

    sim_ann = []
    for f, t in zip(fs, ts):
        sim_ann += TextAnnotation.query.filter_by(filename = f, text = t).all()


    similar_annotations = {}
    for s in sim_ann:
        if s.filename == filename and s.text == focused_text:
            continue
        if s.filename not in similar_annotations:
            similar_annotations[s.filename] = {s.text: [s.annotation]}
        elif s.text not in similar_annotations[s.filename]:
            similar_annotations[s.filename][s.text] = [s.annotation]
        else:
            similar_annotations[s.filename][s.text].append(s.annotation)

    #now calculate score and return output
    scores = []
    for filename  in similar_annotations:
        for text, ann in similar_annotations[filename].items():
            ann = list(set(ann))
            score = jaccard_similarity(annotations, ann)
            scores.append({"filename":filename, "text": text,"annotations": ann, "score": score})

    scores = sorted(scores, key=lambda k: k['score'], reverse= True)

    return render_template('similar.html', focused_text = focused_text, filename= filename, scores = scores, annotations = annotations)



def jaccard_similarity(list1, list2):
    intersection = len(list(set(list1).intersection(list2)))
    union = (len(list1) + len(list2)) - intersection
    return float(intersection) / union
