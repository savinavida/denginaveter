const form = document.querySelector("#budget-form");
const errorBox = document.querySelector("#form-error");

const categories = [
  { key: "transport", label: "Транспорт", color: "#f36d3d" },
  { key: "stay", label: "Проживание", color: "#2d7560" },
  { key: "food", label: "Питание", color: "#e9b94d" },
  { key: "fun", label: "Развлечения", color: "#6f75bb" },
  { key: "other", label: "Прочее", color: "#b4a994" }
];

const money = (value) => new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value);

function readNumber(name) {
  const field = form.elements[name];
  const value = field.value.trim() === "" ? NaN : Number(field.value);
  return { field, value };
}

function calculate(event) {
  event.preventDefault();
  errorBox.textContent = "";

  const people = readNumber("people");
  const days = readNumber("days");
  const nights = readNumber("nights");
  const costs = categories.map(category => ({
    ...category,
    ...readNumber(category.key)
  }));

  const required = [people, days, nights, ...costs];
  const invalid = required.find(item => !Number.isFinite(item.value) || item.value < 0);
  if (invalid) {
    errorBox.textContent = "Проверь числа: пустым полям и отрицательным расходам здесь не место.";
    invalid.field.focus();
    return;
  }
  if (!Number.isInteger(people.value) || people.value < 1 ||
      !Number.isInteger(days.value) || days.value < 1 ||
      !Number.isInteger(nights.value)) {
    errorBox.textContent = "Людей и дни указываем целыми числами, ночи — целым числом от нуля.";
    return;
  }

  const total = costs.reduce((sum, item) => sum + item.value, 0);
  const perPerson = total / people.value;
  const perDay = total / days.value;

  document.querySelector("#total").innerHTML = `${money(total)} <span>€</span>`;
  document.querySelector("#per-person").textContent = `${money(perPerson)} €`;
  document.querySelector("#per-day").textContent = `${money(perDay)} €`;
  document.querySelector("#chart-total").textContent = `${money(total)} €`;
  document.querySelector("#trip-summary").textContent =
    `${people.value} ${plural(people.value, "путешественник", "путешественника", "путешественников")} · ${days.value} ${plural(days.value, "день", "дня", "дней")} · ${nights.value} ${plural(nights.value, "ночь", "ночи", "ночей")}`;

  let cursor = 0;
  const segments = costs.map(item => {
    const share = total === 0 ? 0 : item.value / total * 100;
    const start = cursor;
    cursor += share;
    return { ...item, share, start, end: cursor };
  });

  const gradient = total === 0
    ? "conic-gradient(#e9e5dc 0% 100%)"
    : `conic-gradient(${segments.map(item =>
        `${item.color} ${item.start}% ${item.end}%`).join(", ")})`;
  document.querySelector("#donut").style.background = gradient;
  document.querySelector("#donut").setAttribute(
    "aria-label",
    `Распределение расходов: ${segments.map(item =>
      `${item.label} ${money(item.share)} процентов`).join(", ")}`
  );

  document.querySelector("#legend").innerHTML = segments.map(item => `
    <li>
      <span class="legend-dot" style="--cat:${item.color}"></span>
      <span>${item.label}</span>
      <b>${money(item.share)}%</b>
    </li>
  `).join("");
}

function plural(number, one, few, many) {
  const n = Math.abs(number) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

form.addEventListener("submit", calculate);
form.addEventListener("input", () => { errorBox.textContent = ""; });

// Первичный расчёт показывает пример и сразу делает диаграмму согласованной с полями.
calculate(new Event("submit"));
