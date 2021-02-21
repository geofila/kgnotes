var filename = ""

function load_transcript(){
    filename = document.getElementById("filename").value;
    textarea = document.getElementById("textArea");
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
        load_text();
    }
    // open_file_loader()
}

function load_text(){
    $.ajax({
        data : {
            filename: filename
        },
        type : 'POST',
        url : '/read_transcript'
    })
    .done(function(data) {
        textarea.innerHTML = data.response;
        bind_right_click(".annotations")
        create_autocomplete_tag()
    });
}

var show_file_loader = true;
// $("#file_loader").hide();
function open_file_loader(){
    if (show_file_loader) $("#file_loader").show();
    else $("#file_loader").hide();
    show_file_loader = !(show_file_loader)
}


var show_annotations = false;
function close_annotations(){
    // if (show_annotations) $(".annotations").toggleClass("ann-removed", true)
    // else $(".annotations").toggleClass("ann-removed", false)
    // show_annotations = !(show_annotations)
}


var annotations_list = []
function tags_autocomplete(word_arrays){
    for (i=0; i < word_arrays.length; i++){
        annotations_list.push({"value": word_arrays[i].text, "weight":word_arrays[i].weight})
    }
    $("#tags").autocomplete({
        source: annotations_list
    },{
        autoFocus: true,
        delay: 300
    })
}


var selectedText = ""
var tagify;
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

function create_autocomplete_tag(){
    // bind tags on modal
    var tags = document.querySelector("#tagsAnnotation")
    tagify = new Tagify(tags, {
        whitelist: annotations_list,
        enforceWhitelist: true,
        transformTag: transformTag,
    })

}

function getTags(text){
    $.ajax({
            data : {
                filename: filename,
                text: text
            },
            type : 'POST',
            url : '/get_annotations'
        })
        .done(function(data) {
            tagify.removeAllTags()
            tagify.addTags(data.annotations)

            com = $("#comments").val(data.comments)
        });
}


function pame(){
    $("#selectedText").val(selectedText)
    getTags(selectedText)
    $('#modal').modal('toggle');
}

var colors = ["#D12013", "#C60040", "#79048D", "#441794", "#1C2E92", "#0073D0", "#298C2D", "#DC7500", "#56322", "#3D5A68"]
function transformTag(tagData){
    tagData.style = "--tag-bg:" + colors[tagData.weight -1]
    console.log(tagData)
}
