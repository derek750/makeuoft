// Change navbar color on scroll
$(document).scroll(function () {
    let $nav = $(".navbar");
    $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
});

// Pick a readable font colour (dark or light) for a given hex background, so the
// text colour is always derived from the section's actual background. This
// replaces a hard-coded per-index colour list, which silently desynced whenever
// a section was added/removed/reordered (e.g. leaving white text on a white panel).
function contrastFontColor(hex) {
    let c = (hex || "").replace("#", "");
    if (c.length === 3) {
        c = c.replace(/(.)/g, "$1$1"); // expand shorthand e.g. "fff" -> "ffffff"
    }
    if (c.length !== 6) {
        return "#333";
    }
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    // Perceived luminance (ITU-R BT.601); bright backgrounds get dark text.
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? "#333" : "#FFF";
}

// Background color changing
$(window)
    .scroll(function () {
        let $window = $(window),
            $wrapper = $(".wrapper"),
            $colorScrollPanel = $(".colorScroll");

        // Change 40% earlier than scroll position so colour is there when you arrive.
        let scroll = $window.scrollTop() + $window.height() * 0.4;
        if ($window.scrollTop() < 300) {
            $wrapper.css("background-color", "#fff");
        }
        $colorScrollPanel.each(function () {
            let $this = $(this);

            if (
                $this.position().top <= scroll &&
                $this.position().top + $this.height() > scroll
            ) {
                let bg = $this.attr("data-background-color");
                $wrapper.css("background-color", bg);
                $colorScrollPanel.css("color", contrastFontColor(bg));
            }
        });
    })
    .scroll();

$(document).ready(function () {
    // Materialize stuff
    $(".carousel").carousel({ dist: 0, padding: 600 });
    setInterval(function () {
        $(".carousel").carousel("next");
    }, 3000);

    $(".scrollspy").scrollSpy();
    $(".collapsible").collapsible({ accordion: false });

    // Countdown stuff

    const now = new Date();
    let countDownDate;

    // Set the title based off what it's counting down to
    if (registrationOpenDate >= now) {
        countDownDate = registrationOpenDate;
        $("#countdownTitle").html("Registration Opens In");
    } else if (registrationCloseDate >= now) {
        countDownDate = registrationCloseDate;
        $("#countdownTitle").html("Registration Closes In");
    } else if (eventStartDate >= now) {
        countDownDate = eventStartDate;
        $("#countdownTitle").html("Event Starts In");
    }

    // Delete the entire countdown if event start date has passed
    if (eventStartDate < now) {
        $("#countdown").remove();
        $("#aboutText").removeClass("l7");
    } else {
        // Update the countdown every ten minute
        setInterval(setCounter(countDownDate), 600000);
    }
});

function setCounter(countDownDate) {
    const now = new Date();
    const distance = countDownDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(distance / (1000 * 60 * 60));

    console.log("days, hours", days, hours);

    if (hours < 1) {
        console.log("less than 1 hour");
        const minutes = Math.floor(distance / (1000 * 60));
        // Change to show minutes on the website
        $("#day1").parent().remove();
        $("#day2").html(Math.floor(minutes / 10));
        $("#day3").html(minutes % 10);
        $("#countdownUnit").html(minutes === 1 ? "Minute" : "Minutes");
        return;
    }

    if (days < 2) {
        console.log("less than 2 days");
        // Change to show hours on the website
        $("#day1").parent().remove();
        $("#day2").html(Math.floor(hours / 10));
        $("#day3").html(hours % 10);
        $("#countdownUnit").html(hours === 1 ? "Hour" : "Hours");
        return;
    }

    // Check if we need a third digit or not
    if (days > 99) {
        $("#day1").html(Math.floor(days / 100));
    } else {
        $("#day1").parent().remove();
    }

    $("#day2").html(Math.floor(days / 10) % 10);
    $("#day3").html(days % 10);
}
