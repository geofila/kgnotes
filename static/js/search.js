function searchUriButton(){
    searchUriTerm = $("#searchUriText").val()
    window.location.href = "/search/"+ searchUriTerm;
}




function showSimmilarAnnotationText(){
    $.redirect('/find_similar_text', {'focusedText': selectedText, "filename": filename});
}


function showSimmilarAnnotationTextParams(filename, selectedText){
    $.redirect('/find_similar_text', {'focusedText': selectedText, "filename": filename});
}
