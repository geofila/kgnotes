//on load function
$( document ).ready(function() {
    get_filenames();
});


function get_filenames(){
    $.ajax({
        data : {
        },
        type : 'POST',
        url : '/get_filenames'
        })
        .done(function(data) {
            var source = data.files;
            $('#filename').autocomplete({source: source, minLength: 0});
    });
}
