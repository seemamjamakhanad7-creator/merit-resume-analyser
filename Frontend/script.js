

const resumeInput = document.getElementById("resume-file");
const fileName = document.getElementById("file-name");
const jobDescription = document.getElementById("job-description");
const uploadButton = document.getElementById("upload-button");
const statusMessage = document.getElementById("status-message");

const results = document.getElementById("results");
const matchScore = document.getElementById("match-score");
const scoreNote = document.getElementById("score-note");
const matchedSkills = document.getElementById("matched-skills");
const missingSkills = document.getElementById("missing-skills");
const suggestions = document.getElementById("suggestions");

// Skills and alternative terms the first version can recognize.
const skillList = [
    { name: "Java", terms: ["java"] },
    { name: "Python", terms: ["python"] },
    { name: "C++", terms: ["c++"] },
    { name: "SQL", terms: ["sql", "mysql", "postgresql"] },
    { name: "HTML", terms: ["html"] },
    { name: "CSS", terms: ["css"] },
    { name: "JavaScript", terms: ["javascript", "js"] },
    { name: "React", terms: ["react", "react.js", "reactjs"] },
    { name: "Node.js", terms: ["node.js", "nodejs"] },
    { name: "Git", terms: ["git", "github"] },
    { name: "REST APIs", terms: ["rest api", "rest apis"] },
    { name: "Data Structures", terms: ["data structures", "dsa"] },
    { name: "Machine Learning", terms: ["machine learning", "ml"] },
    { name: "Communication", terms: ["communication"] },
    { name: "Problem-solving", terms: ["problem-solving", "problem solving"] },
    { name: "Teamwork", terms: ["teamwork", "team work"] },
    { name: "Excel", terms: ["excel", "microsoft excel"] },
    { name: "Artificial Intelligence", terms: ["artificial intelligence"] }
];

// Escape special characters before creating a regular expression.
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Check for whole terms, rather than matching inside unrelated words.
function containsTerm(text, term) {
    const pattern = new RegExp(
        "(^|[^a-z0-9])" +
        escapeRegExp(term) +
        "($|[^a-z0-9])",
        "i"
    );

    return pattern.test(text);
}

function findSkills(text) {
    const normalizedText = text.toLowerCase();

    return skillList.filter(skill =>
        skill.terms.some(term =>
            containsTerm(normalizedText, term.toLowerCase())
        )
    );
}

function showList(element, items) {
    element.replaceChildren();

    if (items.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No items identified.";
        element.appendChild(li);
        return;
    }

    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        element.appendChild(li);
    });
}

resumeInput.addEventListener("change", function () {
    const file = resumeInput.files[0];

    fileName.textContent = file
        ? "Selected file: " + file.name
        : "No file selected yet";

    results.hidden = true;
});

uploadButton.addEventListener("click", async function () {

    const file = resumeInput.files[0];
    const jobText = jobDescription.value.trim();

    statusMessage.textContent = "";
    results.hidden = true;

    if (!file) {
        statusMessage.textContent = "Please select your resume first.";
        return;
    }

    if (
        !file.name.toLowerCase().endsWith(".pdf") ||
        file.type !== "application/pdf"
    ) {
        statusMessage.textContent = "Please select a PDF file.";
        return;
    }

    if (!jobText) {
        statusMessage.textContent =
            "Please paste the job or internship description.";
        return;
    }

    uploadButton.disabled = true;

    try {
        statusMessage.textContent = "Reading your resume...";

        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

        let resumeText = "";

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();

            resumeText += content.items
                .map(item => item.str)
                .join(" ") + "\n";
        }

        if (!resumeText.trim()) {
            statusMessage.textContent =
                "No readable text found. This PDF may be scanned.";
            return;
        }

        statusMessage.textContent = "Comparing skills...";

        const jobSkills = findSkills(jobText);
        const resumeSkills = findSkills(resumeText);

        if (jobSkills.length === 0) {
            statusMessage.textContent =
                "No recognized skills found in the job description. " +
                "Try including specific skills such as Java, SQL, or Python.";
            return;
        }

        const matched = jobSkills.filter(jobSkill =>
            resumeSkills.some(resumeSkill =>
                resumeSkill.name === jobSkill.name
            )
        );

        const missing = jobSkills.filter(jobSkill =>
            !matched.some(skill => skill.name === jobSkill.name)
        );

        const score = Math.round(
            (matched.length / jobSkills.length) * 100
        );

        matchScore.textContent = score + "%";

        scoreNote.textContent =
            matched.length + " of " + jobSkills.length +
            " recognized job skills were found in your resume.";

        showList(
            matchedSkills,
            matched.map(skill => skill.name)
        );

        showList(
            missingSkills,
            missing.map(skill => skill.name)
        );

        const advice = [];

        if (missing.length > 0) {
            advice.push(
                "Review the missing skills and learn or practise " +
                "them if they are relevant to your goals."
            );

            advice.push(
                "If you already have experience with a missing skill, " +
                "make that experience clearer in your resume."
            );
        }

        if (matched.length > 0) {
            advice.push(
                "Make sure your matching skills are supported by " +
                "projects, coursework, or practical examples."
            );
        }

        if (advice.length === 0) {
            advice.push(
                "Add specific skills from the job description " +
                "to your resume when they accurately reflect your experience."
            );
        }

        showList(suggestions, advice);

       
        sessionStorage.setItem("meritResults", JSON.stringify({
         score: score,
         scoreNote: scoreNote.textContent,
         matched: matched.map(skill => skill.name),
         missing: missing.map(skill => skill.name),
         suggestions: advice
        }));
 
        window.location.href = "results.html";


    } catch (error) {
        console.error(error);

        statusMessage.textContent =
            "Could not read this PDF. Please try another file.";

    } finally {
        uploadButton.disabled = false;
    }
});
