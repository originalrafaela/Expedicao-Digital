const state = {
  summaryCollapsed: false,
  openTopicId: null
};

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCourse() {
  const slug = document.body.dataset.course;
  return courses.find((course) => course.slug === slug) || courses[0];
}

function getSuggestedCourses(currentCourse) {
  const otherCourses = courses.filter((course) => course.slug !== currentCourse.slug);
  const sameCategory = otherCourses.filter((course) => course.category === currentCourse.category);
  const otherCategory = otherCourses.filter((course) => course.category !== currentCourse.category);

  return [...sameCategory, ...otherCategory].slice(0, 3);
}

function renderList(items) {
  return `
    <ul class="lesson-list">
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function renderLessonContent(topic) {
  const details = topic[3];

  if (!details) {
    return `<p>${topic[1]}</p>`;
  }

  return `
    <p>${topic[1]}</p>
    <div class="lesson-block">
      <h4>Objetivo</h4>
      <p>${details.objective}</p>
    </div>
    <div class="lesson-block">
      <h4>Passo a passo</h4>
      ${renderList(details.steps)}
    </div>
    <div class="lesson-block">
      <h4>Pratique</h4>
      <p>${details.practice}</p>
    </div>
    <div class="lesson-alert">
      <strong>Atenção:</strong> ${details.warning}
    </div>
  `;
}

function renderCoursePage() {
  const course = getCourse();
  const suggestedCourses = getSuggestedCourses(course);
  const lessonImage = course.lesson_image_url || course.image_url;
  const defaultTopicId = `${course.slug}-${slugify(course.topics[0][0])}`;
  state.openTopicId = state.openTopicId || defaultTopicId;

  document.title = `${course.title} | Expedição Digital`;

  document.querySelector("#course-root").innerHTML = `
    <section class="basic-template-shell ${state.summaryCollapsed ? "summary-is-collapsed" : ""}">
      <aside class="basic-template-summary ${state.summaryCollapsed ? "collapsed" : ""}">
        <div class="basic-template-controls">
          <a class="basic-back" href="../index.html#modulos" aria-label="Voltar para cursos">←</a>
          <button class="basic-menu" type="button" data-summary-toggle aria-expanded="${!state.summaryCollapsed}" aria-label="${state.summaryCollapsed ? "Abrir sumário" : "Recolher sumário"}">
            <span class="menu-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="menu-label">${state.summaryCollapsed ? "Abrir sumário" : "Sumário"}</span>
          </button>
        </div>
        <div class="basic-summary-content">
          <h3>Sumário</h3>
          <ol>
            ${course.topics
              .map((topic, index) => {
                const id = `${course.slug}-${slugify(topic[0])}`;
                return `
                  <li>
                    <a class="${state.openTopicId === id ? "active" : ""}" href="#${id}" data-topic-link="${id}">
                      <span>${String(index + 1).padStart(2, "0")}</span>
                      ${topic[0]}
                    </a>
                  </li>
                `;
              })
              .join("")}
          </ol>
        </div>
      </aside>

      <article class="basic-template-content">
        <header class="basic-title-block">
          <span>${course.level}</span>
          <h1>${course.title}</h1>
          <p>${course.summary}</p>
        </header>

        <section class="basic-intro-card">
          <img src="${course.image_url}" alt="">
          <div>
            <h3>Antes de começar</h3>
            <p>Use este curso como consulta. Leia um tópico por vez e siga as orientações no seu próprio aparelho, sem pressa.</p>
          </div>
        </section>

        ${course.topics
          .map((topic) => {
            const id = `${course.slug}-${slugify(topic[0])}`;
            const isOpen = state.openTopicId === id;

            return `
              <section class="basic-topic ${isOpen ? "open" : ""}" id="${id}">
                <button class="topic-toggle" type="button" data-topic-toggle="${id}" aria-expanded="${isOpen}">
                  <span>Tópico</span>
                  <strong>${topic[0]}</strong>
                  <em>${isOpen ? "Recolher" : "Expandir"}</em>
                </button>
                <div class="topic-body">
                  <div>
                    ${renderLessonContent(topic)}
                  </div>
                  <img class="topic-illustration" src="${lessonImage}" alt="${course.category === "computador" ? "Ilustração de um computador" : "Ilustração de um celular"}">
                </div>
              </section>
            `;
          })
          .join("")}

      </article>
    </section>

    <section class="course-suggestions" aria-labelledby="course-suggestions-title">
      <div class="section-heading compact">
        <p class="eyebrow">Continue aprendendo</p>
        <h3 id="course-suggestions-title">Outros cursos sugeridos</h3>
      </div>

      <div class="suggested-course-grid">
        ${suggestedCourses
          .map(
            (suggestedCourse) => `
              <a class="course-card" href="${suggestedCourse.slug}.html">
                <img src="${suggestedCourse.card_image_url}" alt="">
                <span>${suggestedCourse.level}</span>
                <strong>${suggestedCourse.label}</strong>
                <p>${suggestedCourse.summary}</p>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

let topicScrollFrame = null;

function scrollCourseContentToTopic(topic) {
  const content = document.querySelector(".basic-template-content");
  if (!content || !topic?.isConnected) return;

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";
  const contentHasOwnScroll = ["auto", "scroll"].includes(getComputedStyle(content).overflowY);
  const title = topic.querySelector(".topic-toggle");

  if (!contentHasOwnScroll) {
    const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
    const top = title.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
    window.scrollTo({ top: Math.max(0, top), behavior });
    return;
  }

  // Leave enough room below the last topic to align even a short lesson's title.
  const lastTopic = content.querySelector(".basic-topic:last-child");
  content.style.paddingBottom = `${Math.max(64, content.clientHeight - lastTopic.offsetHeight)}px`;
  const contentRect = content.getBoundingClientRect();
  const titleRect = title.getBoundingClientRect();
  const top = content.scrollTop + titleRect.top - contentRect.top - content.clientTop - 12;
  content.scrollTo({ top: Math.max(0, top), behavior });
}

function keepTopicTitleAligned(topic) {
  topicScrollFrame = requestAnimationFrame(() => {
    topicScrollFrame = null;
    scrollCourseContentToTopic(topic);
  });
}

function setOpenTopic(topicId, shouldScroll = true, allowClose = true) {
  cancelAnimationFrame(topicScrollFrame);
  topicScrollFrame = null;
  const previousTopic = document.querySelector(".basic-topic.open");
  const previousSummary = document.querySelector(".basic-summary-content a.active");
  const nextTopic = document.querySelector(`#${topicId}`);
  const nextSummary = document.querySelector(`[data-topic-link="${topicId}"]`);

  if (previousTopic && previousTopic.id !== topicId) {
    previousTopic.classList.remove("open");
    previousTopic.querySelector(".topic-toggle").setAttribute("aria-expanded", "false");
    previousTopic.querySelector(".topic-toggle em").textContent = "Expandir";
  }

  if (previousSummary) {
    previousSummary.classList.remove("active");
  }

  if (!nextTopic) return;

  const isAlreadyOpen = nextTopic.classList.contains("open");
  if (isAlreadyOpen && state.openTopicId === topicId && allowClose) {
    nextTopic.classList.remove("open");
    nextTopic.querySelector(".topic-toggle").setAttribute("aria-expanded", "false");
    nextTopic.querySelector(".topic-toggle em").textContent = "Expandir";
    state.openTopicId = null;
    return;
  }

  nextTopic.classList.add("open");
  nextTopic.querySelector(".topic-toggle").setAttribute("aria-expanded", "true");
  nextTopic.querySelector(".topic-toggle em").textContent = "Recolher";
  nextSummary?.classList.add("active");
  state.openTopicId = topicId;

  if (shouldScroll) {
    keepTopicTitleAligned(nextTopic);
  }
}

document.querySelector("#course-root").addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-summary-toggle]");
  if (toggle) {
    state.summaryCollapsed = !state.summaryCollapsed;
    renderCoursePage();
    return;
  }

  const link = event.target.closest("[data-topic-link]");
  if (link) {
    event.preventDefault();
    setOpenTopic(link.dataset.topicLink, true, false);
    return;
  }

  const topicToggle = event.target.closest("[data-topic-toggle]");
  if (!topicToggle) return;

  setOpenTopic(topicToggle.dataset.topicToggle, false);
});

renderCoursePage();

