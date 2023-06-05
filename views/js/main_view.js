// Init page
$(document).ready(function() {
    // Load initial images
    loadImages();

    //
    initAutocomplete()

    // Load more images when the user scrolls to the bottom of the page
    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() === $(document).height()) {
            //loadImages();
        }
    });

    // Prevent form submission and reload images when the search button is clicked
    $('#searchForm').submit(function(e) {
        e.preventDefault();
        $('#imageContainer').empty();
        loadImages();
    });

    $('#imageUpload').change(function () {
        var formData = new FormData();
        formData.append('file', $('#imageUpload')[0].files[0]);

        $.ajax({
            url: '/main/uploadImg',  // 修改为你的上传接口地址
            type: 'POST',
            data: formData,
            processData: false,  // 告诉 jQuery 不要去处理发送的数据
            contentType: false,  // 告诉 jQuery 不要去设置 Content-Type 请求头
            success: function (data) {
                console.log('upload success');
                // 在这里添加上传成功后的代码
                $('#imageUpload').val(''); // Clear upload area
                loadImages();
            },
            error: function (data) {
                console.log('upload error');
                // 在这里添加上传失败后的代码
                $('#imageUpload').val(''); // Clear upload area
            },
        });
    });

    // Enable tooltips
    enableTooltips();
});



function loadImages() {
    $('#imageContainer').empty();
    $.ajax({
        url: '/main/getImages', // 替换为你的后端接口地址
        type: 'GET',
        data: {
            date:$("#date").val()
        },
        success: function (data) {
            data.urls.forEach(function(imageSrc) {
                // var image = $('<div class="card"><img class="card-img-top" src="' + imageSrc + '" data-bs-original-src="' + imageSrc + '" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Image metadata goes here" onclick="zoomImage(this)"></div>');
                var image = $('<div class="col-4"><div class="card"><img class="card-img-top" src="' + imageSrc + '" data-bs-original-src="' + imageSrc + '" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Image metadata goes here" onclick="zoomImage(this)"></div></div>');
                $('#imageContainer').append(image);
            });
            // Refresh tooltips
            enableTooltips();
        },
        error: function (error) {
            console.log('Error:', error);
        }
    });
}


function enableTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}

function zoomImage(img) {
    var src = img.getAttribute('data-bs-original-src');
    var overlay = $('<div id="overlay" style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); z-index: 9999; cursor: pointer;"></div>');
    var image = $('<img src="' + src + '" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-height: 80%; max-width: 80%;">');
    overlay.append(image);
    $('body').append(overlay);
    overlay.click(function() {
        $(this).remove();
    });
}


function initAutocomplete() {
    var availableTags = [
        "Chicago, Illinois, United States",
        "Chico, California, United States",
        "China, Asia",
        "666",
        // Add more tags here...
    ];
    $( "#location" ).autocomplete({
        source: availableTags
    });
}









// function loadImages() {
//     for (var i = 0; i < 20; i++) {
//         var imageHeight = 200 + Math.floor(Math.random() * 300);  // random height between 200 and 500
//         var imageSrc = i%2 === 0
//             ? 'https://photoapp-nu-cs310-yzl7889.s3.us-east-2.amazonaws.com/test/kengan-ashura.jpeg'
//             : 'https://photoapp-nu-cs310-yzl7889.s3.us-east-2.amazonaws.com/2b19e585-5c81-486a-bded-810538c20cc0/374115b5-dcb0-4f57-9373-664ec481f0a5.jpg';
//         var image = $('<div class="card"><img class="card-img-top" src="' + imageSrc + '" data-bs-original-src="' + imageSrc + '" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Image metadata goes here" onclick="zoomImage(this)"></div>');
//         $('#imageContainer').append(image);
//     }
//     // Refresh tooltips
//     enableTooltips();
// }