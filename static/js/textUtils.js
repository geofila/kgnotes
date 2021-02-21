var filename;
function load_file(){
    filename = document.getElementById("filename").value;
    textarea = document.getElementById("textArea");
    document.getElementById("video").pause()
    cancelAnnotationVideo()
    textarea.value = "Transcript is now Loading. . . "
    split = filename.split(".")
    suffix = split[split.length -1]
    if (suffix == "mp4"){
        $("#pdf_block").hide();
        $("#video_block").show();
        document.getElementById("video").src = "static/transcripts/"+ filename;
    }
    else{
        $("#pdf_block").show();
        $("#video_block").hide();
        read_transcript(filename);
    }
}

function read_transcript(filename){
    $.ajax({
        data : {
            filename: filename
        },
        type : 'POST',
        url : '/read_transcript'
    })
    .done(function(data) {
        console.log(data)
        textarea.innerHTML = data.response;
        bind_right_click(".annotations")
        // create_autocomplete_tag()
    });
}

function add_annotation(focused_text, annotation){
    $.ajax({
            data : {
                focused_text: focused_text,
                annotation: annotation,
            },
            type : 'POST',
            url : '/add_annotation'
        })
        .done(function(data) {
            textarea.innerHTML = data.response;
            bind_right_click(".annotations")
        });
}


function add_annotations_plus(){

    text = $("#selectedText").val()
    annotations = JSON.stringify(tagify.value)
    comment = $("#comments").val()

    $.ajax({
            data : {
                // filename: filename,
                focused_text: text,
                annotation: annotations,
                comment: comment
            },
            type : 'POST',
            url : '/add_annotations_plus'
        })
        .done(function(data) {
            textarea.innerHTML = data.response;
            bind_right_click(".annotations")
        });
}



function bind_right_click(selector){
    $(selector).on('contextmenu', function(e) {
        selectedText = $(this).html()
        var top = e.pageY - 10;
        var left = e.pageX - 90;
        $("#context-menu").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
        }).on("click", function() {
        $("#context-menu").removeClass("show").hide();
        });

    $("#context-menu a").on("click", function() {
      $(this).parent().removeClass("show").hide();
    });
}



function showMoreTextAnnotationOptions(){
    $("#selectedText").val(selectedText)
    getTags(selectedText)
    $('#modal').modal('toggle');
}


var colors = ["#D12013", "#C60040", "#79048D", "#441794", "#1C2E92", "#0073D0", "#298C2D", "#DC7500", "#56322", "#3D5A68"]
function transformTag(tagData){
    tagData.style = "--tag-bg:" + colors[tagData.weight -1]
    console.log(tagData)
}

function create_autocomplete_tag(){
    // bind tags on modal
    var tags = document.querySelector("#tagsAnnotation")
    tagify = new Tagify(tags, {
        whitelist: annotations_list,
        enforceWhitelist: true,
        transformTag: transformTag
    })
}

function getTags(text){
    $.ajax({
            data : {
                text: text
            },
            type : 'POST',
            url : '/get_annotations'
        })
        .done(function(data) {
            tagify.removeAllTags()
            tagify.addTags(data.annotations)
            $("#comments").val(data.comments)
        });
}


var focused_text = "";
function addKeyword(){
    keyword = document.getElementById("keyword").value;
    document.getElementById("keyword").value = ""
    word_arrays.push({text: keyword, weight: 10, html: {class: keyword}})
    jQuery('.word-cloud').html('');
    jQuery('.word-cloud').html('<div class="word-cloud" id="word-cloud"></div>');
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
