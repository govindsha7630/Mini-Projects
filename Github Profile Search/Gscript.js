/* ================================
   DOM ELEMENT SELECTION
   ================================ */

// Profile elements
const avtaarImg = document.querySelector("#avtaarimg");
const userId = document.querySelector("#userid");
const userName = document.querySelector("#username");
const userLang = document.querySelector("#language");
const userBio = document.querySelector("#bio");

// Input & button
const inputBox = document.querySelector("#input-box");
const searchBtn = document.querySelector(".search");

// Stats
const repoCount = document.querySelector("#repos");
const FollowerCount = document.querySelector("#follower");

// Containers
const Container = document.querySelector(".container");
const Loader = document.querySelector("#loader");

// Error
const errorSelector = document.querySelector("#error");
const errorMsg = document.querySelector("#error-msg");


/* ================================
   EVENT LISTENER
   ================================ */

searchBtn.addEventListener("click", () => {
    const username = inputBox.value.trim();

    // If input is empty
    if (!username) {
        Container.style.display = "none";
        Loader.style.display = "none";
        errorSelector.style.display = "block";
        errorMsg.textContent = "Please enter a valid GitHub username";
        return;
    }

    // Call API
    getUserData(username);
});


/* ================================
   FORMAT COUNT (1K, 1.2K etc.)
   ================================ */

function formatCount(count, label) {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K ${label}`;
    }
    return `${count} ${label}`;
}


/* ================================
   FETCH USER PROFILE DATA
   ================================ */

async function getUserData(username) {
    try {
        // Show loader & hide others
        Loader.style.display = "block";
        Container.style.display = "none";
        errorSelector.style.display = "none";

        // Fetch user data
        const response = await fetch(
            `https://api.github.com/users/${username}`
        );

        // If user not found
        if (!response.ok) {
            throw new Error("User not found");
        }

        const data = await response.json();

        // Update profile UI
        avtaarImg.src = data.avatar_url;
        userId.textContent = `@${data.login}`;
        userName.textContent = data.name || "No name available";
        userBio.textContent = data.bio || "No bio available";

        repoCount.textContent = formatCount(data.public_repos, "Repos");
        FollowerCount.textContent = formatCount(data.followers, "Followers");

        // Fetch top 3 languages
        const topLanguages = await getTopLanguages(data.login);
        userLang.textContent = topLanguages.length
            ? topLanguages.join(", ")
            : "No language data";

        // Show profile
        Loader.style.display = "none";
        Container.style.display = "block";

    } catch (error) {
        // Show error
        Loader.style.display = "none";
        Container.style.display = "none";
        errorSelector.style.display = "block";
        errorMsg.textContent = error.message;
    }
}


/* ================================
   FETCH TOP 3 USED LANGUAGES
   ================================ */

async function getTopLanguages(username) {
    // Fetch user repositories (limit to avoid API limit)
    const reposResponse = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=3`
    );

    const repos = await reposResponse.json();

    // Object to store language bytes
    const languageStats = {};

    // Loop through each repo
    for (let repo of repos) {

        // Ignore forked repositories
        if (repo.fork) continue;

        // Fetch languages of repo
        const langResponse = await fetch(repo.languages_url);
        const languages = await langResponse.json();

        // Sum bytes for each language
        for (let lang in languages) {
            languageStats[lang] =
                (languageStats[lang] || 0) + languages[lang];
        }
    }

    // Sort languages by usage (bytes)
    return Object.entries(languageStats)
        .sort((a, b) => b[1] - a[1]) // descending
        .slice(0, 3)                // top 3
        .map(item => item[0]);      // language names only
}
