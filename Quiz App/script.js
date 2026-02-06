// ======= QUIZ APP: full, fixed script.js =======

// ---------- GLOBAL STATE ----------
let quizData = []           // all questions from API
let currentIndex = 0        // which question we are on (0-based)
let score = 0               // correct answers count
let correctIndex = null     // index (0..n-1) of correct option for current question
let timerInterval = null    // id for per-question timer
let consumedInterval = null // id for the consumed-time interval

// ---------- SELECTORS ----------
const loadingScreen = document.querySelector("#loading-screen")

const startScreen = document.querySelector(".start-card")
const startBtn = document.querySelector("#start-btn")

const quizScreen = document.querySelector("#quiz-screen")

const timeConsumed = document.querySelector("#time-consumed")
const questionCount = document.querySelector("#question-count")
const timer = document.querySelector("#timer")

const queSelect = document.querySelector("#que-select")
const queNo = document.querySelector("#que-no")

const answerBox = document.querySelector("#answer-box")

const optionDivs = document.querySelectorAll(".answer")
const optionTexts = document.querySelectorAll(".opt-text")
const optionInputs = document.querySelectorAll('input[name="answer"]')

const resultScreen = document.querySelector("#result-screen")
const finalScore = document.querySelector("#final-score")
const RestartBtn = document.querySelector("#restart-btn")

const errorScreen = document.querySelector("#error-screen")

// Optional progress elements — safe to query (may be absent)
const progressText = document.querySelector(".progress-text")
const progressFill = document.querySelector(".progress-fill")

// question counter for UI (1-based)
let questionCountNum = 1
questionCount.innerText = `Question : ${questionCountNum}`

// ---------- UTIL: decode HTML entities from API (very common) ----------
function decodeHTML(html) {
    // Safe decode using DOM (works in browser)
    const txt = document.createElement("textarea")
    txt.innerHTML = html
    return txt.value
}

// ---------- START BUTTON ----------
startBtn.addEventListener('click', () => {
    // Reset state in case of restart
    currentIndex = 0
    score = 0
    questionCountNum = 1
    questionCount.innerText = `Question : ${questionCountNum}`

    // Show loading screen, hide start
    startScreen.style.display = "none"
    loadingScreen.style.display = "flex"
    errorScreen.style.display = "none"
    resultScreen.style.display = "none"
    quizScreen.style.display = "none"

    // Fetch API
    const apiUrl = "https://opentdb.com/api.php?amount=5&difficulty=easy&type=multiple"
    fetchQuizData(apiUrl)
})

// ---------- FETCH QUIZ DATA ----------
async function fetchQuizData(url) {
    try {
        const response = await fetch(url)
        const data = await response.json()

        if (!data || !data.results || data.results.length === 0) {
            throw new Error("No questions returned by API")
        }

        // Save globally and initialize
        quizData = data.results
        currentIndex = 0
        score = 0
        questionCountNum = 1
        questionCount.innerText = `Question : ${questionCountNum}`

        // Hide loading, show quiz
        loadingScreen.style.display = "none"
        quizScreen.style.display = "block"

        // Start consumed timer (only once)
        startConsumedTime()

        // Render first question
        displayQuizData()

    } catch (error) {
        console.error("Error fetching quiz data:", error)
        loadingScreen.style.display = "none"
        quizScreen.style.display = "none"
        errorScreen.style.display = "block"
    }
}

// ---------- DISPLAY (render) CURRENT QUESTION ----------
function displayQuizData() {
    // Guard: ensure quizData exists
    if (!quizData || quizData.length === 0) return

    const currentQuestion = quizData[currentIndex]

    // Update question number + text (decode HTML entities)
    queNo.innerText = `Q${currentIndex + 1}`
    queSelect.innerHTML = decodeHTML(currentQuestion.question)

    // Shuffle options and set correctIndex
    const shuffledOptions = shuffleOptions(currentQuestion)

    // Update option texts safely (do NOT touch the radio elements)
    optionTexts.forEach((span, index) => {
        span.innerHTML = decodeHTML(shuffledOptions[index] || "")
    })

    // Reset radio inputs (unchecked & enabled)
    optionInputs.forEach(input => {
        input.checked = false
        input.disabled = false
    })

    // Reset option visuals & clicking state
    clearPrevious()

    // Update progress (if present)
    updateProgress()

    // Start per-question timer (ensures previous cleared)
    TimerFunc()
}

// ---------- CLEAR / RESET UI FOR NEXT QUESTION ----------
function clearPrevious() {
    optionDivs.forEach(div => {
        div.classList.remove("correct", "wrong")
        div.style.pointerEvents = "auto"
    })
    optionInputs.forEach(input => {
        input.checked = false
        input.disabled = false
    })
}

// ---------- MAKE ENTIRE OPTION CLICKABLE & HANDLE SELECTION ----------
function optionsAsButton() {
    optionDivs.forEach((optionDiv, index) => {
        // prevent adding multiple listeners if function accidentally called again
        optionDiv.addEventListener("click", () => {
            // If option already locked/disabled, do nothing
            if (optionInputs[index].disabled) return

            // Uncheck all radios, then check the clicked one
            optionInputs.forEach(inp => inp.checked = false)
            optionInputs[index].checked = true

            // Immediately process the answer
            checkWrongOrRight()
        })
    })
}
// run once
optionsAsButton()

// ---------- RETURN SELECTED ANSWER TEXT (or null) ----------
function isAnswered() {
    let selectedAnswer = null
    optionInputs.forEach((input, index) => {
        if (input.checked) {
            selectedAnswer = optionTexts[index].innerHTML
        }
    })
    return selectedAnswer
}

// ---------- PREVENT DOUBLE CLICK (locks UI after selection) ----------
function preventDoubleClick() {
    optionInputs.forEach(input => input.disabled = true)
    optionDivs.forEach(optionDiv => optionDiv.style.pointerEvents = "none")
}

// ---------- CHECK USER ANSWER, COLOR & SCHEDULE NEXT ----------
function checkWrongOrRight() {
    // Stop the per-question timer immediately to avoid overlapping effects
    clearInterval(timerInterval)

    // Determine which input was checked; mark colors and update score
    optionInputs.forEach((input, index) => {
        if (input.checked) {
            if (index === correctIndex) {
                optionDivs[index].classList.add("correct")
                score++
            } else {
                optionDivs[index].classList.add("wrong")
                // also reveal correct option
                if (correctIndex !== null && optionDivs[correctIndex]) {
                    optionDivs[correctIndex].classList.add("correct")
                }
            }
        }

        // If user didn't select the correct option, still highlight correct
        if (!input.checked && index === correctIndex) {
            
            optionDivs[index].classList.add("correct")

        }

    })

    // Lock UI to prevent further interaction
    disableOptions()
    preventDoubleClick()

    // Update progress immediately (so bar shows full for this question)
    updateProgress()

    // Auto move to next question after 3 seconds
    setTimeout(() => {
        nextQuestion()
    }, 3000)
}

// ---------- SHUFFLE OPTIONS & SET correctIndex ----------
function shuffleOptions(questionObj) {
    // Build array: correct + incorrects
    const options = [
        questionObj.correct_answer,
        ...questionObj.incorrect_answers
    ]

    // Shuffle in-place (simple random)
    options.sort(() => Math.random() - 0.5)

    // Find where the correct answer landed
    correctIndex = options.indexOf(questionObj.correct_answer)

    return options
}

// ---------- DISABLE OPTIONS (used after answer) ----------
function disableOptions() {
    optionInputs.forEach(input => input.disabled = true)
    optionDivs.forEach(div => div.style.pointerEvents = "none")
}

// ---------- PROGRESS: update progress bar and text (if exists) ----------
function updateProgress() {
    if (!quizData || quizData.length === 0) return

    const total = quizData.length
    const current = Math.min(currentIndex + 1, total)
    const percent = Math.round((current / total) * 100)

    if (progressText) {
        progressText.innerText = `Question ${current} / ${total}`
    }
    if (progressFill) {
        progressFill.style.width = `${percent}%`
    }
}

// ---------- NEXT QUESTION (advance or finish) ----------
function nextQuestion() {
    // clear any running per-question timer
    clearInterval(timerInterval)

    // If this was last question, show result
    if (currentIndex >= quizData.length - 1) {
        // finish quiz
        quizScreen.style.display = "none"
        resultScreen.style.display = "block"

        // stop consumed timer
        stopConsumedTime()

        // show final score text and animate circle
        finalScore.innerText = `${score} / ${quizData.length}`
        finalScoreStyle()
        return
    }

    // Not finished: go to next
    currentIndex++
    questionCountNum++
    questionCount.innerText = `Question : ${questionCountNum}`

    // Clear old UI flags
    clearPrevious()

    // Render new question
    displayQuizData()
}

// ---------- PER-QUESTION TIMER (30s) ----------
function TimerFunc() {
    // clear existing timer to prevent stacking
    clearInterval(timerInterval)

    let timeLeft = 30
    timer.innerText = `${timeLeft} sec Left`

    timerInterval = setInterval(() => {
        timeLeft--
        if (timeLeft <= 0) {
            clearInterval(timerInterval)
            // time up: show correct / wrong and auto-next (shorter delay)
            checkWrongOrRight()
        } else {
            timer.innerText = `${timeLeft} sec Left`
        }
    }, 1000)
}

// ---------- CONSUMED TIME (total quiz time) ----------
function startConsumedTime() {
    // prevent multiple intervals
    if (consumedInterval) return

    let consumedSecond = 0
    let minute = 0

    consumedInterval = setInterval(() => {
        consumedSecond++
        if (consumedSecond > 59) {
            minute++
            consumedSecond = 0
        }
        timeConsumed.innerText =
            `Time Consumed: ${minute}:${consumedSecond.toString().padStart(2, "0")} sec`
    }, 1000)
}

function stopConsumedTime() {
    clearInterval(consumedInterval)
    consumedInterval = null
}

// ---------- FINAL SCORE CIRCLE + TEXT ANIMATION ----------
function finalScoreStyle() {
    const totalQuestions = quizData.length || 1
    const percentage = Math.round((score / totalQuestions) * 100)

    const circle = document.querySelector("#circle_percent")
    const scoreText = document.querySelector("#final-score")

    // small safety
    if (!circle || !scoreText) return

    let progress = 0
    const progressInterval = setInterval(() => {
        progress++
        const degree = progress * 3.6
        circle.style.background = `
            conic-gradient(
                var(--green-primary) ${degree}deg,
                #1a1a1a ${degree}deg
            )
        `
        scoreText.innerText = `${progress}%`
        if (progress >= percentage) {
            clearInterval(progressInterval)
        }
    }, 15)
}

// ---------- RESTART QUIZ ----------
function restartQuiz() {
    // hide result & loading
    resultScreen.style.display = "none"
    loadingScreen.style.display = "none"
    errorScreen.style.display = "none"

    // reset state
    currentIndex = 0
    score = 0
    questionCountNum = 1
    questionCount.innerText = `Question : ${questionCountNum}`

    // reset UI
    clearPrevious()
    timer.innerText = "30 sec Left"
    timeConsumed.innerText = "Time Consumed: 0:00 sec"

    // show start screen
    startScreen.style.display = "block"
    quizScreen.style.display = "none"

    // stop timers
    clearInterval(timerInterval)
    stopConsumedTime()
}

// wire restart button
RestartBtn.addEventListener("click", restartQuiz)
