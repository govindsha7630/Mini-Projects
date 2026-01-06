const hours = document.querySelector("#hrs")
const minute = document.querySelector("#min")

const date = document.querySelector("#date")


setInterval(() => {

    const currentTime = new Date()
    console.log(currentTime);

    let customDate = currentTime.toLocaleString("default", {

        weekday: "short", day: "2-digit", month: "long", year: "numeric"
    })

    date.innerHTML = customDate


    hours.innerHTML = (currentTime.getHours() < 10 ? "0" : "") + currentTime.getHours()

    minute.innerHTML = (currentTime.getMinutes() < 10 ? "0" : "") + currentTime.getMinutes()

    
}, 1000);

