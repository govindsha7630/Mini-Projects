/* =====================================================
   DOM ELEMENT REFERENCES
   -----------------------------------------------------
   All DOM queries are kept at the top so:
   - They are easy to find
   - The browser queries them only once
   - The code is easier to maintain and debug
   ===================================================== */

// User input & trigger
const inputBox = document.querySelector("#input-box");
const searchBtn = document.querySelector(".search");

// Error UI elements
const errorSelector = document.querySelector(".error");
const errorBox = document.querySelector("#error-box");

// Result container
const resultBox = document.querySelector(".result-box");

// Result display elements
const wordSelector = document.querySelector(".word");
const phoneticSelector = document.querySelector(".phonetic");
const meaningSelector = document.querySelector(".meanings");
const exampleSelector = document.querySelector(".example");
const audioSelector = document.querySelector(".audio");

// Loading spinner
const loader = document.querySelector("#loader");

//============================
const exampleHider = document.querySelector("#example-hide")
const audioHider = document.querySelector("#audio-hide")

//============================


/* =====================================================
   USER INTERACTION
   ===================================================== */

// Enable search using the Enter key (keyboard accessibility)
inputBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchBtn.click();
    }
});

// Handle button click search
searchBtn.addEventListener("click", () => {
    const inputValue = inputBox.value.trim();

    // Guard clause:
    // Prevents empty API calls and keeps UX clean
    if (!inputValue) {
        errorSelector.textContent = "Please enter a word first";
        resultBox.style.display = "none";
        errorBox.style.display = "flex";
        return;
    }

    // API URL is created dynamically from user input
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${inputValue}`;

    // Fetch and display dictionary data
    getDictionaryData(apiUrl);
});


/* =====================================================
   FETCH & DATA HANDLING
   -----------------------------------------------------
   Uses async/await for:
   - Better readability
   - Easier error handling
   - Linear execution flow
   ===================================================== */

async function getDictionaryData(apiUrl) {
    try {
        // Show loading state
        loader.style.display = "block";
        resultBox.style.display = "none";
        errorBox.style.display = "none";

        const response = await fetch(apiUrl);

        // dictionaryapi.dev returns 404 for invalid words
        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data = await response.json();

        // Reset UI state on success
        loader.style.display = "none";
        errorBox.style.display = "none";
        resultBox.style.display = "flex";
        exampleHider.style.display = "flex";
        audioHider.style.display = "flex";

        /* =====================================================
           DATA EXTRACTION
           -----------------------------------------------------
           Defensive programming is used here:
           - Never assume array positions
           - Always check if data exists
           ===================================================== */

        // Word text
        const word = data[0].word;

        // ------------------------------------------
        // PHONETIC TEXT
        // Find the first phonetic entry that
        // actually contains readable text
        // ------------------------------------------
        const phoneticObj = data[0].phonetics.find(p => p.text);
        const phoneticText = phoneticObj?.text || "";

        // ------------------------------------------
        // MEANING
        // Safely access the first definition
        // ------------------------------------------
        const meaningText =
            data[0].meanings[0]?.definitions[0]?.definition || "";

        // ------------------------------------------
        // EXAMPLE SENTENCE
        // Search across ALL meanings and definitions
        // instead of relying on fixed indexes
        // ------------------------------------------
        const exampleObj = data[0].meanings
            .flatMap(meaning => meaning.definitions)
            .find(def => def.example);

        const exampleText = exampleObj?.example || "";

        /* =====================================================
           VISIBILITY CONTROL
           -----------------------------------------------------
           Professional UI rule:
           ❝ If data does not exist, the UI should not exist ❞
           ===================================================== */

        // Phonetic visibility
        if (phoneticText) {
            phoneticSelector.textContent = phoneticText;
            phoneticSelector.style.display = "block";
        } else {
            phoneticSelector.style.display = "none";
        }

        // Example visibility
        if (exampleText) {
            exampleSelector.textContent = exampleText;
            exampleSelector.style.display = "block";
        } else {
            exampleSelector.style.display = "none";
            exampleHider.style.display = "none";
        }

        // ------------------------------------------
        // AUDIO PRONUNCIATION
        // Find the first available audio URL
        // ------------------------------------------
        let audioUrl = "";

        for (const phonetic of data[0].phonetics) {
            if (phonetic.audio) {
                audioUrl = phonetic.audio;
                break;
            }
        }

        // ------------------------------------------
        // FINAL UI UPDATE
        // ------------------------------------------
        wordSelector.textContent = word;
        meaningSelector.textContent = meaningText;

        if (audioUrl) {
            audioSelector.src = audioUrl;
            audioSelector.load();
            audioSelector.style.display = "block";
        } else {
            audioSelector.style.display = "none";
            audioHider.style.display = "none";
        }

    } catch (error) {
        // Hide loader on failure
        loader.style.display = "none";

        /* =====================================================
           ERROR HANDLING
           -----------------------------------------------------
           All errors (network, 404, logic)
           end up here in a controlled manner
           ===================================================== */

        errorSelector.textContent = error.message;
        resultBox.style.display = "none";
        errorBox.style.display = "flex";

        console.error("Dictionary Error:", error.message);
    }
}
