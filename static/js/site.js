$(document).ready(function() {
  var flip = function () {
      var target = $('.pusher')
      if (bodyBgSwitchIndex === 0) {
        bodyBgSwitchIndex = 1
        target.toggleClass('flip-it')
        setTimeout( function () {
          $('.front').css('display','none')
          $('.back').css('display','block')
        }, 300)
      }
        else {
          bodyBgSwitchIndex = 0
          target.toggleClass('flip-it')
          setTimeout( function (){
            $('.front').css('display','block')
            $('.back').css('display','none')
        }, 300)
      }
  };

  $(".ui.accordion").accordion();
  $("#tag-category-pop").click(function() {
    $(".hand.point.icon").toggleClass("active");
  });

  $('.dream-flip-toggle').click(flip);

  // TODO: Generate this from leaf partials
  var backHeadings = [
    '#about-me',
    '#hiring-me',
    '#buy-me-coffee'
  ];

  if(backHeadings.includes(window.location.hash)) {
    flip();
  }
});
