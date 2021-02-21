import re
import pandas as pd
from process import TextAnnotation
from flask import session
colors = ["#000099", "#006600", "#ffff00", "#ffff00", "#cc3300", "#cc0099"]


def word_array():
    array = pd.read_csv("static/ontology/ontology.csv", sep ="\t")
    l = []
    for row in array.iterrows():
        l.append({"text": row[1][0], "weight": row[1][1], "class": row[1][2]})
    return l

def load_transcript(filename, annotate = True):
    with open("static/transcripts/" + filename, "r") as f:
        data = f.read()
        f.close()

        data = '\n'.join(line for line in data.split("\n") if line)
        if annotate:
            return annotate_text(data)
        return data


#we need word_to_class for correct indexing anotated text to css class
word_to_class= {i["text"]: str(i["weight"]) for i in word_array()}
# def annotate_text(text):
#     text = highlight_keywords(text)
#     annotations = TextAnnotation.query.filter_by(filename = "transcript1.txt").all()
#     labels = {ann.text: [] for ann in annotations}
#     for ann in annotations:
#         labels[ann.text].append(ann.annotation)
#     for l in labels:
#         ans = ",".join(labels[l])
#         text = insert_before(text, l, f"<p title = '"+ ans +"' class='annotations w" + word_to_class[labels[l][0]] + "'>")
#         text = insert_after(text, l, "</p>")
#     return text

def annotate_text(text):

    dict_strings = {}
    # dict_strings = highlight_keywords(text, dict_strings)

    annotations = TextAnnotation.query.filter_by(filename = session['filename']).all()
    labels = {ann.text: [] for ann in annotations}
    starts = {ann.text: ann.start for ann in annotations}
    for ann in annotations:
        labels[ann.text].append(ann.annotation)
    for l in labels:
        ans = ",".join(labels[l])
        dict_strings = insert(starts[l], l, f"<p title = '"+ ans +"' style='display: inline;' class='annotations w" + word_to_class[labels[l][0]] + "'>", dict_strings)
        dict_strings = insert(starts[l], l, "</p>", dict_strings, after = True)

    #add annotations
    #firstly sort the dictionary
    dict_strings = sorted(dict_strings.items(), key =  lambda kv:(kv[0], kv[1]))
    acc = 0
    for k, val in dict_strings:
        for v in val:
            idx = k + acc
            text = text[:idx] + v + text[idx:]
            acc += len(v)
    return text.replace("\n", "<br>")

def highlight_keywords(text, dict_strings):
    s1 = text.split("<br>")
    ident = set()
    for s in s1:
        s2 = s.split(":")
        ident.add(s2[0])
    for c, i in enumerate(ident):
        i = i + ":"
        dict_strings = insert(text, i, "<p style='display: inline; color:" + colors[c] + ";'>", dict_strings)
        dict_strings = insert(text, i, "</p>", dict_strings, after = True)
    return dict_strings

def insert(start, subtext,add, dict_strings, after = False):
    idx =  start
    if after:
        idx =  start + len(subtext)
    if idx in dict_strings:
        dict_strings[idx].append(add)
    else:
        dict_strings[idx] = [add]
    return dict_strings

def insert_before(text, subtext, add):
    idxs =  [m.start() for m in re.finditer(subtext, text)]
    for i in range(len(idxs)):
        idx =  [m.start() for m in re.finditer(subtext, text)][i]
        text = text[:idx] + add + text[idx:]
    return text

def insert_after(text, subtext, add):
	idxs =  [m.start() for m in re.finditer(subtext, text)]
	for i in range(len(idxs)):
		idx =  [m.start() for m in re.finditer(subtext, text)][i] + len(subtext)
		text = text[:idx] + add + text[idx:]
	return text


# def highlight_keywords(text):
#     text = '\n'.join(line for line in text.split("\n") if line)
#     text = text.replace("\n", "<br>")
#     s1 = text.split("<br>")
#     ident = set()
#     for s in s1:
#         s2 = s.split(":")
#         ident.add(s2[0])
#     for c, i in enumerate(ident):
#         i = i + ":"
#         text = insert_before(text, i, "<p style='display: inline; color:" + colors[c] + ";'>")
#         text = insert_after(text, i, "</p>")
#     return text
