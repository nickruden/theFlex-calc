// Глобальный объект формы
const formData = {
  name: "",
  phone: "",
  city: "",
  sendingAgree: false,
  selectedOptions: [],
  totalPrice: 0,
  monthlyPrice: 0,
  plaitePrice: 0,
};

let selectedOptions = new Set();
const STORAGE_KEY = "gymFormState";

function saveSessionState() {
  const state = {
    formData,
    selectedOptions: Array.from(selectedOptions),
    currentPage: getCurrentPage(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSessionState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function clearSessionState() {
  localStorage.removeItem(STORAGE_KEY);
}

function getCurrentPage() {
  const optionsBlock = document.querySelector(".options");
  const bonusesPage = document.querySelector(".bonuses-page");

  if (optionsBlock.classList.contains("--final-page")) return "final";
  if (!bonusesPage.classList.contains("--display-none")) return "bonuses";
  return "form";
}

const updateFormData = () => {
  formData.name = document.querySelector("#clientName").value;
  formData.phone = document.querySelector("#clientPhone").value;
  formData.city = document.querySelector("#recipientCity").value;
  formData.sendingAgree = document.querySelector("#sendingAgree").checked;
  formData.selectedOptions = Array.from(selectedOptions);
  saveSessionState();
};

let localTick;

// РАБОТА С ТАЙМЕРОМ
function handleTickInit(tick) {
  console.log(tick);
  localTick = tick;
  if (!window.timerInitialized && localStorage.getItem("tickStarted")) {
    console.log("Инициализация таймера");

    const STORAGE_KEY = "tickDeadline";
    const DURATION_MINUTES = 5;

    let deadline;
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      deadline = new Date(saved);
    } else {
      const now = new Date();
      deadline = new Date(now.getTime() + DURATION_MINUTES * 60 * 1000);
      localStorage.setItem(STORAGE_KEY, deadline.toISOString());
    }

    const counter = Tick.count.down(deadline, { format: ["m", "s"] });

    counter.onupdate = function (value) {
      if (tick) {
        tick.value = value;
      }
    };

    counter.onended = function () {
      localStorage.removeItem("gymFormState");
      // document.querySelectorAll(".final-page__option").forEach((el) => {
      //   el.classList.add("disabled");
      //   el.setAttribute("disabled", "true");
      // });
    };

    window.timerInitialized = true; // Защита от повторной инициализации
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".wrapper");
  const header = wrapper.querySelector(".header");

  const formPage = wrapper.querySelector(".form-page");
  const bonusesPage = wrapper.querySelector(".bonuses-page");
  const optionsBlock = wrapper.querySelector(".options");

  const btnNextForm = wrapper.querySelector(
    ".form-page .control-buttons .my-button"
  );
  const btnBackBonuses = wrapper.querySelector(".bonuses-page .back-button");
  const btnNextBonuses = wrapper.querySelector(".bonuses-page .next-button");

  const nameInput = document.querySelector("#clientName");
  const phoneInput = document.querySelector("#clientPhone");
  const sendingAgreeCheckbox = document.querySelector("#sendingAgree");
  const policyCheckbox = document.querySelector("#policyAgree");
  const citySelect = document.querySelector("#recipientCity");
  const optionItems = document.querySelectorAll(".options__item");
  const priceOutput = document.querySelector(".your-card__price-number");

  const optionsData = {
    irkutsk: {
      startPrice: 26970,
      motivator: 3500,
      nolimit: 1000,
      massage: 3500,
      "20-trainings": 5000,
      fullday: 3500,
      "15-freezing": 990,
      "30-freezing": 1500,
      "2-mounth": 3000,
      "summer-events": 2000,
    },
    angarsk: {
      startPrice: 26970,
      motivator: 3000,
      nolimit: 3000,
      massage: 3000,
      "20-trainings": 3000,
      fullday: 3000,
      "15-freezing": 3000,
      "30-freezing": 3000,
      "2-mounth": 3000,
      "summer-events": 3000,
    },
  };

  function updateFinalPagePrices() {
    const totalPriceEl = document.querySelector(
      '[data-final-btn-id="all-price"] .final-page__option-price-number'
    );
    if (totalPriceEl) {
      totalPriceEl.textContent = `${formData.totalPrice.toLocaleString()}₽`;
    }

    const pladeInitialEl = document.querySelector(
      '[data-final-btn-id="plade"] .final-page__option-price-number'
    );
    const pladeNextEl = document.querySelector(
      '[data-final-btn-id="plade"] .plade-end__number'
    );
    if (pladeInitialEl) {
      pladeInitialEl.textContent = `${formData.plaitePrice.toLocaleString()}₽`;
    }
    if (pladeNextEl) {
      pladeNextEl.textContent = `${formData.plaitePrice.toLocaleString()}}₽`;
    }

    const monthlyPriceEl = document.querySelector(
      '[data-final-btn-id="in-month"] .final-page__option-price-number'
    );
    if (monthlyPriceEl) {
      monthlyPriceEl.textContent = `${formData.monthlyPrice.toLocaleString()}₽`;
    }
  }

  const getSelectedCity = () => citySelect.value;

  const updateOptionPrices = (city) => {
    const cityData = optionsData[city];
    if (!cityData) return;

    optionItems.forEach((item) => {
      const id = item.dataset.optId;
      const priceEl = item.querySelector(".options__item-price");
      const price = cityData[id];

      if (priceEl && price !== undefined) {
        const textNodes = Array.from(priceEl.childNodes).filter(
          (node) => node.nodeType === Node.TEXT_NODE
        );
        if (textNodes.length > 0) {
          textNodes[0].textContent = `+${price.toLocaleString()}₽`;
        } else {
          priceEl.insertBefore(
            document.createTextNode(`+${price.toLocaleString()}₽`),
            priceEl.firstChild
          );
        }
      }
    });

    recalculateTotal();
    updateFinalPagePrices();
  };

  const toggleCardOption = (optId, show) => {
    if (["validPeriod", "20-trainings", "fullday"].includes(optId)) {
      return;
    }

    const cardOption = document.querySelector(
      `.your-card__option[id="${optId}"]`
    );
    if (!cardOption) return;
    cardOption.style.display = show ? "inline" : "none";
  };

  const updateFreezingOption = () => {
    const freezingOption = document.querySelector(
      '.your-card__option[id="freezing"]'
    );
    if (!freezingOption) return;

    const has15 = selectedOptions.has("15-freezing");
    const has30 = selectedOptions.has("30-freezing");

    if (has15 || has30) {
      freezingOption.style.display = "inline";
      const daysText = has30 ? "30" : "15";
      freezingOption.innerHTML = freezingOption.innerHTML.replace(
        /\d+ дней/,
        `${daysText} дней`
      );
    } else {
      freezingOption.style.display = "none";
    }
  };

  const recalculateTotal = () => {
    const city = getSelectedCity();
    const cityData = optionsData[city];
    if (!cityData) return;

    let total = cityData.startPrice || 0;
    const months = selectedOptions.has("2-mounth") ? 12 : 10;

    const isNoLimit = selectedOptions.has("nolimit");
    const twentyTrainingsEl = document.querySelector(
      ".your-card__option[id='20-trainings']"
    );

    if (twentyTrainingsEl) {
      twentyTrainingsEl.style.display = isNoLimit ? "none" : "inline";
    }

    selectedOptions.forEach((id) => {
      if (id === "nolimit") {
        total += 1000 * months;
      } else {
        total += cityData[id] || 0;
      }
    });

    const periodEl = document.querySelector(
      ".your-card__option[id='validPeriod']"
    );
    periodEl.innerHTML = periodEl.innerHTML.replace(
      /\d+ месяцев/,
      `${months} месяцев`
    );

    updateFreezingOption();

    // Обновляем отображение количества тренировок
    const trainingEl = document.querySelector(
      '.your-card__option[id="20-trainings"]'
    );
    if (trainingEl) {
      trainingEl.innerHTML = trainingEl.innerHTML.replace(
        /(60|80) тренировок/,
        selectedOptions.has("20-trainings") ? "80 тренировок" : "60 тренировок"
      );
    }

    // Обновляем отображение времени для fullday
    const fulldayEl = document.querySelector(
      '.your-card__option[id="fullday"]'
    );
    if (fulldayEl) {
      fulldayEl.innerHTML = fulldayEl.innerHTML.replace(
        /до\s(16:00|22:00)/,
        selectedOptions.has("fullday") ? "до 22:00" : "до 16:00"
      );
    }

    const result = Math.round(total / months);
    priceOutput.textContent = `${result.toLocaleString()}₽`;

    const plaite = Math.round(total * 0.25);

    formData.totalPrice = total;
    formData.monthlyPrice = result;
    formData.plaitePrice = plaite;

    updateFormData();

    const options = Array.from(
      document.querySelectorAll(".your-card__option")
    ).filter((el) => getComputedStyle(el).display === "inline");

    options.forEach((el, i) => {
      const grayText = el.querySelector(".gray-text");
      if (grayText) {
        grayText.textContent = grayText.textContent.replace(/[.,]\s*$/, "");
        grayText.textContent += i === options.length - 1 ? "." : ",";
      } else {
        el.innerHTML = el.innerHTML.replace(/[.,]\s*$/, "");
        el.innerHTML += i === options.length - 1 ? "." : ",";
      }
    });

    saveSessionState();
  };

  const syncOptionState = (optId, checked) => {
    const input = document.querySelector(
      `.options__item[data-opt-id="${optId}"] .my-switch-main`
    );
    if (!input) return;

    input.checked = checked;

    if (optId === "15-freezing" && checked) {
      selectedOptions.delete("30-freezing");
      const thirtyInput = document.querySelector(
        '.options__item[data-opt-id="30-freezing"] .my-switch-main'
      );
      if (thirtyInput) thirtyInput.checked = false;
    }

    if (optId === "30-freezing" && checked) {
      selectedOptions.delete("15-freezing");
      const fifteenInput = document.querySelector(
        '.options__item[data-opt-id="15-freezing"] .my-switch-main'
      );
      if (fifteenInput) fifteenInput.checked = false;
    }

    if (checked) {
      selectedOptions.add(optId);
      toggleCardOption(optId, true);
    } else {
      selectedOptions.delete(optId);
      toggleCardOption(optId, false);
    }

    recalculateTotal();
    updateFinalPagePrices();
  };

  nameInput.addEventListener("input", updateFormData);
  phoneInput.addEventListener("input", updateFormData);
  sendingAgreeCheckbox.addEventListener("change", updateFormData);
  policyCheckbox.addEventListener("change", () => {
    policyCheckbox.closest(".my-checkbox-btn").classList.remove("invalid");
  });

  citySelect.addEventListener("change", () => {
    updateOptionPrices(getSelectedCity());
    updateFormData();
  });

  optionItems.forEach((item) => {
    const checkbox = item.querySelector(".my-switch-main");
    const optId = item.dataset.optId;

    checkbox.addEventListener("change", () => {
      const isChecked = checkbox.checked;

      if (optId === "nolimit" && isChecked) {
        syncOptionState("20-trainings", false);
      }

      if (optId === "20-trainings" && isChecked) {
        syncOptionState("nolimit", false);
      }

      syncOptionState(optId, isChecked);
    });
  });

  function isValidName(value) {
    const nameRegex = /^[A-Za-zА-Яа-яЁё\s\-]{2,}$/;
    return nameRegex.test(value.trim());
  }

  function isPhoneComplete(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11;
  }

  function validateForm() {
    let valid = true;

    if (!isValidName(nameInput.value)) {
      nameInput.classList.add("invalid");
      valid = false;
    } else {
      nameInput.classList.remove("invalid");
    }

    if (!isPhoneComplete(phoneInput.value)) {
      phoneInput.classList.add("invalid");
      valid = false;
    } else {
      phoneInput.classList.remove("invalid");
    }

    if (!policyCheckbox.checked) {
      policyCheckbox.closest(".my-checkbox-btn").classList.add("invalid");
      valid = false;
    } else {
      policyCheckbox.closest(".my-checkbox-btn").classList.remove("invalid");
    }

    return valid;
  }

  [nameInput, phoneInput].forEach((input) => {
    input.addEventListener("focus", () => {
      input.classList.remove("invalid");
    });
  });

  function checkFormPage() {
    if (bonusesPage.classList.contains("--display-none")) {
      wrapper.classList.add("--white-bg");
      header.classList.add("--form-page");
      return false;
    } else {
      wrapper.classList.remove("--white-bg");
      header.classList.remove("--form-page");
      return true;
    }
  }

  btnNextForm.addEventListener("click", (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    formPage.classList.add("--display-none");
    bonusesPage.classList.remove("--display-none");
    checkFormPage();

    if (!localStorage.getItem("tickStarted")) {
      localStorage.setItem("tickStarted", "true");
      handleTickInit(localTick);
    } else {
      handleTickInit(localTick);
    }

    saveSessionState();
  });

  btnBackBonuses.addEventListener("click", () => {
    if (optionsBlock.classList.contains("--final-page")) {
      optionsBlock.classList.remove("--final-page");
      checkFormPage();
      saveSessionState();
    } else {
      formPage.classList.remove("--display-none");
      bonusesPage.classList.add("--display-none");
      checkFormPage();

      // Восстановим поля формы
      nameInput.value = formData.name;
      phoneInput.value = formData.phone;
      sendingAgreeCheckbox.checked = formData.sendingAgree;
      citySelect.value = formData.city;

      updateOptionPrices(getSelectedCity());
      updateFormData();
    }
  });

  const updatePaymentOptions = () => {
    const fullPaymentElement = document.querySelector(
      '.final-page__option[data-final-btn-id="all-price"] .my-button__top-text'
    );
    const installmentElement = document.querySelector(
      '.final-page__option[data-final-btn-id="in-month"] .my-button__bottom-text'
    );

    fullPaymentElement.textContent = `${formData.totalPrice.toLocaleString()}₽`;
    installmentElement.textContent = `${formData.monthlyPrice.toLocaleString()}₽ в месяц`;
  };

  if (btnNextBonuses) {
    btnNextBonuses.addEventListener("click", () => {
      optionsBlock.classList.add("--final-page");
      updateFinalPagePrices();
      saveSessionState();
    });
  }

  document
    .querySelectorAll(".your-card__option")
    .forEach((element) => (element.style.display = "none"));
  document.querySelector(".your-card__option[id='validPeriod']").style.display =
    "inline";
  document.querySelector(
    ".your-card__option[id='20-trainings']"
  ).style.display = "inline";
  document.querySelector(".your-card__option[id='fullday']").style.display =
    "inline";

  const savedState = loadSessionState();

  // if (
  //   !document.querySelector(".bonuses-page").classList.contains("--display-none") ||
  //   document.querySelector(".options").classList.contains("--final-page")
  // ) {
  //   // Уже не form-page, ничего не делаем
  // } else {
  //   clearSessionState();
  // }

  if (savedState) {
    const {
      formData: savedForm,
      selectedOptions: savedOptions,
      currentPage,
    } = savedState;

    nameInput.value = savedForm.name;
    phoneInput.value = savedForm.phone;
    citySelect.value = savedForm.city;
    sendingAgreeCheckbox.checked = savedForm.sendingAgree;

    selectedOptions = new Set(savedOptions || []);
    savedOptions.forEach((optId) => {
      syncOptionState(optId, true);
    });

    if (currentPage === "bonuses") {
      formPage.classList.add("--display-none");
      bonusesPage.classList.remove("--display-none");
      wrapper.classList.add("--white-bg");
      header.classList.add("--form-page");
    }

    if (currentPage === "final") {
      formPage.classList.add("--display-none");
      bonusesPage.classList.remove("--display-none");
      optionsBlock.classList.add("--final-page");
      updateFinalPagePrices();
      wrapper.classList.add("--white-bg");
      header.classList.add("--form-page");
    }

    updateOptionPrices(getSelectedCity());
    recalculateTotal();
    updateFormData();
    updateFinalPagePrices();
  } else {
    updateOptionPrices(getSelectedCity());
    recalculateTotal();
    updateFormData();
    updateFinalPagePrices();
  }

  checkFormPage();

  new SimpleBar(document.querySelector(".options__inner"), {
    autoHide: false,
    forceVisible: true,
  });

   const readableCities = {
      irkutsk: "Иркутск",
      angarsk: "Ангарск",
    };

    const readableOptions = {
      motivator: "+Мотиватор",
      nolimit: "+Безлимит",
      massage: "+Массаж",
      "20-trainings": "+20 тренировок",
      fullday: "+Полный день",
      "15-freezing": "+15 дней заморозки",
      "30-freezing": "+30 дней заморозки",
      "2-mounth": "+2 месяца",
      "summer-events": "+Летние мероприятия",
    };


  function generateWhatsAppLink() {
    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const total = formData.totalPrice.toLocaleString();

    const cityKey = formData.city;
    const city = readableCities[cityKey];

    const options = formData.selectedOptions
      .map((opt) => readableOptions[opt])
      .filter(Boolean)
      .join(", ");

    const message = `Здравствуйте! Это ${name}, телефон ${phone}, г. ${city}, я выбрала опции ${
      options || "без дополнительных опций"
    }, сумма получилась ${total}₽`;

    const encoded = encodeURIComponent(message);

    return `https://wa.me/79245372601?text=${encoded}&type=phone_number`;
  }

  const chatLink = document.querySelector(".final-page__button");
  if (chatLink) {
    chatLink.addEventListener("click", function (e) {
      const link = generateWhatsAppLink();
      chatLink.setAttribute("href", link);
    });
  }
});
