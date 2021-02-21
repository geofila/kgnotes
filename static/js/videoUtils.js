function goToFrame(time){
    document.getElementById("video").currentTime = time;
}

function sec2time(timeInSeconds) {
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
    time = parseFloat(timeInSeconds).toFixed(3),
    hours = Math.floor(time / 60 / 60),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60)

    if (hours > 0) return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
    else return pad(minutes, 2) + ':' + pad(seconds, 2);
}

function time2sec(text){
    var time = text.split(":")
    if (len(time) == 3) return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    else return (+a[0]) * 60 + (+a[1]);
}

var videoTagify = new Tagify(document.querySelector("#label"), {
    whitelist: annotations_list,
    enforceWhitelist: true,
    transformTag: transformTag,
})

var last_time = 0
var flagStart=false, flagEnd=false;
var times= [];
document.getElementById("video").addEventListener('timeupdate', function() {
    time = Math.ceil(this.currentTime);
    if (time != last_time){
        if ((!flagStart && !flagEnd) || !flagStart && flagEnd){
            $('#startTime').text(sec2time(time))
            $('#endTime').text("--:--")
            flagEnd = false;
        }
        else if (flagStart && !flagEnd) {
            startTime = $("#startTime").text()
            currentTime = sec2time(time)
            if (startTime > currentTime) $('#endTime').text(startTime)
            else $('#endTime').text(currentTime)
        }

        appendHistory(time);
    }
    last_time = time;
});



function showAnnotationBlockVideo(){
    $("#annotationBlockVideo").slideToggle();
    // document.getElementById("video").pause();
}

function flagVideo(flag){
    if (flag == "start") flagStart = !flagStart;
    else  flagEnd = !flagEnd;
    $("#annotationBlockVideo").show();
}

function saveAnnotationVideo(){

    annotations = JSON.stringify(videoTagify.value)
    comment = $("#videoComment").val()
    start_time = $("#startTime").text()
    end_time = $("#endTime").text()

    $.ajax({
            data : {
                start_time: start_time,
                end_time: end_time,
                annotation: annotations,
                comment: comment
            },
            type : 'POST',
            url : '/save_annotation_video'
        })
        .done(function(data) {
            cancelAnnotationVideo()
        });
}


function cancelAnnotationVideo(){
    flagEnd = false;
    flagEnd = false;
    $("#annotationBlockVideo").slideUp();

    videoTagify.removeAllTags()
    document.getElementById("videoComment").value = "";
    time = Math.ceil(document.getElementById("video").currentTime);
    $('#startTime').text(sec2time(time));
    $('#endTime').text("--:--");
}


function showHistory(){
    $("#historyAnnotations").toggle();
}


function appendHistory(time){

    if (!times.includes(time)) {

        $("#buttons").append( "<div class='input-group'><button type='button' class='btn btn-link col-3' onclick = goToFrame("+ time +") id = 'buttons_"+ time +"'>"+ sec2time(time) +"</button><div class='col-9' id='tagify_"+time+"'></span></div>" );

        var videoTagify = new Tagify(document.querySelector("#tagify_"+ time +""), {
            whitelist: annotations_list,
            enforceWhitelist: true,
            transformTag: transformTag,
        })
    }


    $('#historyAnnotations').scrollTop($("#buttons_" + time).offset().top - $("#buttons_1").offset().top);
    times.push(time);
}
