// Init page
$(document).ready(function() {
    // Load initial images
    loadImages();

    let searchTerm = '';
    $('#searchLabels').on('select2:select select2:unselect', function () {
        // Get selected items
        let selectedLabels = $(this).val();

        // Now `selectedLabels` is an array of the selected label strings
        console.log(selectedLabels);
    });


    // Capture the select2:close event
    $('#searchLabels').on('select2:close', function(e) {
        // After the dropdown has closed, restore the search term
        var select2Data = $('#searchLabels').data('select2');
        if (select2Data && select2Data.search && searchTerm) {
            setTimeout(function() { select2Data.search.val(searchTerm).trigger('keyup'); }, 0);
        }
    });


    //init labels
    $('#searchLabels').select2({
        placeholder: 'Select labels',
        multiple: true,
        ajax: {
            url: '/main/labels',
            dataType: 'json',
            delay: 300,
            processResults: function (data) {
                return {
                    results: $.map(data.items, function(label) {
                        return { id: label.text, text: label.text }
                    })
                };
            },
            cache: true
        },
        minimumInputLength: 1
    });


    //init location
    $("#location").on('input', function() {
        let value = $(this).val();
        if (!value) {  // 当 location 输入字段被清空时
            // 清空所有隐藏的输入字段
            $('#country').val('');
            $('#administrative_area_level_1').val('');
            $('#administrative_area_level_2').val('');
            $('#city').val('');
            $('#street').val('');
            $('#postal_code').val('');
        }
        $.ajax({
            url: "/main/initLocation",
            type: 'GET',
            data: {
                key: value
            },
            success: function (data) {
                $("#location").autocomplete({
                    source: data.map(item => item.resultString),
                    delay: 300,
                    select: function(event, ui) {
                        let selected = data.find(item => item.resultString === ui.item.value);
                        // 更新隐藏输入框的值
                        $('#country').val(selected.country);
                        $('#administrative_area_level_1').val(selected.administrative_area_level_1);
                        $('#administrative_area_level_2').val(selected.administrative_area_level_2);
                        $('#city').val(selected.city);
                        $('#street').val(selected.street);
                        $('#postal_code').val(selected.postal_code);
                    }
                });
            },
            error: function (error) {
                console.log('Error:', error);
            }
        });
    });



    // Load more images when the user scrolls to the bottom of the page
    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() === $(document).height()) {
            //loadImages();
            //瀑布式加载还没做
        }
    });

    // Prevent form submission and reload images when the search button is clicked
    $('#searchForm').submit(function(e) {
        e.preventDefault();
        $('#imageContainer').empty();
        loadImages();
    });

    $('#imageUpload').change(function () {
        var file = $('#imageUpload')[0].files[0];

        // 检查文件类型
        const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml', 'image/tiff'];

        if (!allowedImageTypes.includes(file.type)) {
            alert("Please select a valid image file (png, jpg, jpeg, gif, bmp, webp, svg, tiff).");
            $('#imageUpload').val('');
            return;
        }

        var formData = new FormData();
        formData.append('file', file);

        // 显示遮罩层和spinner
        $('#uploadMask').show();
        $('#uploadSpinner').show();

        $.ajax({
            url: '/main/uploadImg',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                console.log('upload success');
                // 隐藏遮罩层和spinner
                $('#uploadMask').hide();
                $('#uploadSpinner').hide();
                $('#imageUpload').val('');
                loadImages();
            },
            error: function (data) {
                console.log('upload error');
                // 隐藏遮罩层和spinner
                $('#uploadMask').hide();
                $('#uploadSpinner').hide();
                $('#imageUpload').val('');
            }
        });
    });

    // Enable tooltips
    enableTooltips();
});



    function loadImages() {
    $('#imageContainer').empty();
    $.ajax({
        url: '/main/getImages',
        type: 'GET',
        data: {
            labels: $('#searchLabels').val(),
            bgndate: $("#startDate").val(),
            enddate: $("#endDate").val(),
            country: $('#country').val(),
            administrative_area_level_1: $('#administrative_area_level_1').val(),
            administrative_area_level_2: $('#administrative_area_level_2').val(),
            city: $('#city').val(),
            street: $('#street').val(),
            postal_code: $('#postal_code').val()
        },
        success: function (data) {
            // Create a reference to your Masonry layout
            var $grid = $('.masonry-grid').masonry({
                itemSelector: '.card',
                percentPosition: true
            });

            data.data.forEach(function(imageData) {
                var imageSrc = imageData.url;
                var metadata = imageData.metadata || {};
                var labels = imageData.labels || [];
                var tooltipText = "Labels: " + labels.join(", ") + "\n" +
                    // "Time: " + (metadata.timestamp || "") + "\n" +
                    "Time: " + (metadata.timestamp ? new Date(metadata.timestamp).toLocaleString() : "")+
                "Location: " + (metadata.country || "") + ", " + (metadata.administrative_area_level_1 || "") + (metadata.city?(", "+metadata.city) : "");
                var image = $('<div class="card"><img class="card-img-top" src="' + imageSrc + '" data-bs-original-src="' + imageSrc + '" data-bs-toggle="tooltip" data-bs-placement="bottom" title="' + tooltipText + '" onclick="zoomImage(this)"></div>');
                $('#imageContainer').append(image);
                $grid.append(image).masonry('appended', image);  // Append image to Masonry
            });

            $grid.imagesLoaded().done(function() {
                $grid.masonry('reloadItems').masonry('layout');  // Reload Masonry layout
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

