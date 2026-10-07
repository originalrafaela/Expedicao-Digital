let activeCourseFilter = "computador";

function getFilteredCourses() {
  return courses.filter((course) => course.category === activeCourseFilter);
}

function getCourseCount(category) {
  return courses.filter((course) => course.category === category).length;
}

function setupTabLabels() {
  document.querySelectorAll("[data-course-filter]").forEach((button) => {
    const label = button.textContent.trim();
    const count = getCourseCount(button.dataset.courseFilter);
    button.innerHTML = `${label}<span class="tab-count" aria-label="${count} cursos">${count}</span>`;
  });
}

function renderCourseCards() {
  document.querySelector("#course-grid").innerHTML = getFilteredCourses()
    .map(
      (course) => `
        <a class="course-card" href="cursos/${course.slug}.html">
          <img src="${course.card_image_url}" alt="">
          <span>${course.level}</span>
          <strong>${course.label}</strong>
          <p>${course.summary}</p>
        </a>
      `
    )
    .join("");
}

function setupCourseTabs() {
  document.querySelectorAll("[data-course-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCourseFilter = button.dataset.courseFilter;

      document.querySelectorAll("[data-course-filter]").forEach((tab) => {
        const isActive = tab === button;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-pressed", String(isActive));
      });

      renderCourseCards();
    });
  });
}

setupTabLabels();
setupCourseTabs();
renderCourseCards();
