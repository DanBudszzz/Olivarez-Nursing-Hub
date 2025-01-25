function showEbooks(year) {
  const ebooks = {
    "1st": [
      "Anatomy and Physiology eBook",
      "Fundamentals of Nursing eBook"
    ],
    "2nd": [
      "Pharmacology Essentials",
      "Medical-Surgical Nursing Guide"
    ],
    "3rd": [
      "Community Health Nursing",
      "Pathophysiology References"
    ],
    "4th": [
      "Leadership in Nursing",
      "Comprehensive NCLEX Review"
    ]
  };

  const ebooksContainer = document.getElementById("ebooks");
  if (ebooks[year]) {
    ebooksContainer.innerHTML = `<ul>${ebooks[year]
      .map((book) => `<li>${book}</li>`)
      .join("")}</ul>`;
  } else {
    ebooksContainer.innerHTML = "<p>No eBooks available for this year.</p>";
  }
}

function showPracticeQuestions(year) {
  const questions = {
    "1st": "Basic Nursing Practice Questions",
    "2nd": "Intermediate Medical-Surgical Practice",
    "3rd": "Advanced Community Health Practice",
    "4th": "NCLEX Preparation Practice Questions"
  };

  const questionsContainer = document.getElementById("practice-questions");
  if (questions[year]) {
    questionsContainer.innerHTML = `<p>${questions[year]}</p>`;
  } else {
    questionsContainer.innerHTML = "<p>No practice questions available for this year.</p>";
  }
}