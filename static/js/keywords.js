var focused_text = "";
function addKeyword(){
    jQuery('.background2').html('');
    keyword = document.getElementById("keyword").value;
    word_arrays.push({text: keyword, weight: 10, html: {class: keyword}})
    jQuery('.background2').html('<div id="word-cloud"></div>');
    drawCloud(word_arrays);
}

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

document.onmouseup = document.onkeyup = document.onselectionchange = function() {
  // console.log(getSelectionText());
  focused_text = getSelectionText()
};


function add_annotation(focused_text, annotation, color){
    $.ajax({
            data : {
                filename: filename,
                focused_text: focused_text,
                annotation: annotation,
                color: color
            },
            type : 'POST',
            url : '/add_annotation'
        })
        .done(function(data) {
            textarea.innerHTML = data.response;
            bind_right_click(".annotations")
        });
}

var remove = false
$("#readyToRemove").toggleClass('pulse', false)
$("#readyToRemove").toggleClass('shadow-none', true)
$(".annotations").css("cursor", "help")
function readyToRemove(){
    if (!remove) {
        $("#readyToRemove").toggleClass('pulse', true)
        $("#readyToRemove").toggleClass('shadow-none', false)
        $(".annotations").css("cursor", "pointer")
        remove = true;
    }
    else {
        remove= false;
        $("#readyToRemove").toggleClass('pulse', false)
        $("#readyToRemove").toggleClass('shadow-none', true)
        $(".annotations").css("cursor", "help")
    }

    // if (remove) $("#readyToRemove").effect( "pulsate", {times:5}, 3000 );
}

function remove_annotation(id){
    if (!remove) return;
    $.ajax({
            data : {
                filename: filename,
                id: id
           },
            type : 'POST',
            url : '/remove_annotation'
        })
        .done(function(data) {
            remove= false;
            $("#readyToRemove").toggleClass('pulse', false)
            textarea.innerHTML = data.response;
        });
}



function add_annotations_plus(){

    text = $("#selectedText").val()
    annotations = JSON.stringify(tagify.value)
    comment = $("#comments").val()

    $.ajax({
            data : {
                filename: filename,
                focused_text: text,
                annotation: annotations,
            },
            type : 'POST',
            url : '/add_annotations_plus'
        })
        .done(function(data) {
            textarea.innerHTML = data.response;
            bind_right_click(".annotations")
        });
}
