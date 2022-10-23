const mdiClose =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
const mdiPlus = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";
const mdiTrash =
  "M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z";
const mdiArrow =
  "M4,10V14H13L9.5,17.5L11.92,19.92L19.84,12L11.92,4.08L9.5,6.5L13,10H4Z";

class DailyScheduleCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.config) {
      return;
    }
    if (!this.card) {
      this.card = document.createElement("ha-card");
      this.card.header = this._createHeader();
      this.card.appendChild(this.card.header);
      this.card.content = this._createContent();
      this.card.appendChild(this.card.content);
      this.appendChild(this.card);
    } else {
      this._updateContent();
      this._updateHeader();
    }
  }

  setConfig(config) {
    if (!config.title && config.toggle) {
      throw new Error("You need to define title when toggle is used");
    }
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    this.config = config;
    if (this.card) {
      this.removeChild(this.card);
      delete this.card;
      this.card = null;
    }
  }

  getCardSize() {
    return this.config.entities.length;
  }

  _createHeader() {
    const header = document.createElement("DIV");
    if (!this.config.title) {
      return header;
    }
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    const title = document.createElement("DIV");
    title.classList.add("name");
    title.innerText = this.config.title;
    header.appendChild(title);
    if (this.config.toggle && this._hass.states[this.config.toggle]) {
      const toggle = document.createElement("ha-switch");
      toggle.style.padding = "13px 5px";
      toggle.checked = this._hass.states[this.config.toggle].state === "on";
      toggle.addEventListener("change", () => {
        this._hass.callService("input_boolean", "toggle", {
          entity_id: this.config.toggle,
        });
      });
      header.toggle = toggle;
      header.appendChild(toggle);
    }
    return header;
  }

  _updateHeader() {
    if (this.card.header.toggle) {
      const is_on = this._hass.states[this.config.toggle].state === "on";
      if (this.card.header.toggle.checked !== is_on) {
        this.card.header.toggle.checked = is_on;
      }
    }
  }

  _createContent() {
    const content = document.createElement("DIV");
    content.style.padding = "0px 16px";
    content.rows = [];
    for (const entry of this.config.entities) {
      const entity = entry.entity || entry;
      const row = document.createElement("DIV");
      row.entity = entity;
      row.classList.add("card-content");
      row.style.padding = "0px 0px 8px";
      if (this._hass.states[entity]) {
        const content = this._createCardRow(
          entity,
          entry.name ||
            this._hass.states[entity].attributes.friendly_name ||
            entity,
          row
        );
        row.content = content;
        row.appendChild(content);
      } else {
        row.innerText = "Entity not found: " + entry.entity;
      }
      content.rows.push(row);
      content.appendChild(row);
    }
    return content;
  }

  _updateContent() {
    for (const row of this.card.content.rows) {
      this._setCardRowValue(row.content, this._getStateSchedule(row.entity));
    }
  }

  _createCardRow(entity, name, parent) {
    const content = document.createElement("DIV");
    content.style.cursor = "pointer";
    content.style.display = "flex";
    content.style.justifyContent = "space-between";
    const name_element = document.createElement("P");
    name_element.innerText = name;
    content.appendChild(name_element);
    const value_element = document.createElement("P");
    value_element.style.marginLeft = "auto";
    content.value_element = value_element;
    this._setCardRowValue(content, this._getStateSchedule(entity));
    content.appendChild(value_element);
    const dialog = this._createDialog(entity, name);
    parent.appendChild(dialog);
    content.dialog = dialog;
    content.onclick = function () {
      dialog.title_element.innerText = dialog.title_prefix_text;
      dialog.title_text = dialog.title_prefix_text;
      dialog.error.innerText = "";
      dialog.plus.button.disabled = false;
      dialog.schedule = [...this._getStateSchedule(entity)];
      this._createDialogRows(dialog);
      dialog.show();
    }.bind(this);
    return content;
  }

  _getStateSchedule(entity) {
    const state = this._hass.states[entity];
    if (!state) {
      return [];
    }
    return state.attributes.schedule || [];
  }

  _setCardRowValue(content, state) {
    let value = state
      .map((range) => range.from.slice(0, -3) + "-" + range.to.slice(0, -3))
      .join(", ");
    if (!value.length) {
      value = "&empty;";
    }
    if (content.value_element.innerHTML !== value) {
      content.value_element.innerHTML = value;
    }
  }

  _createDialog(entity, title) {
    const dialog = document.createElement("ha-dialog");
    dialog.entity = entity;
    dialog.heading = this._createDialogHeader(title, dialog);
    dialog.open = false;
    const plus = document.createElement("DIV");
    plus.style.color = getComputedStyle(document.body).getPropertyValue(
      "color"
    );
    plus.style.display = "flex";
    plus.style.justifyContent = "center";
    const button = document.createElement("mwc-icon-button");
    plus.button = button;
    plus.appendChild(button);
    const icon = document.createElement("ha-svg-icon");
    icon.path = mdiPlus;
    button.appendChild(icon);
    const text = document.createElement("P");
    text.innerText = "Add entry";
    plus.appendChild(text);
    plus.onclick = function () {
      if (button.disabled === true) {
        return;
      }
      dialog.schedule.push({ from: null, to: null });
      this._createDialogRows(dialog);
      this._saveBackendEntity(dialog);
    }.bind(this);
    dialog.plus = plus;
    const error = document.createElement("P");
    error.style.color = "red";
    error.innerText = "";
    dialog.error = error;
    return dialog;
  }

  _createDialogRows(dialog) {
    dialog.innerHTML = "";
    dialog.schedule.forEach((range, index) => {
      dialog.appendChild(this._createDialogRow(range, index, dialog));
    });
    dialog.appendChild(dialog.plus);
    dialog.appendChild(dialog.error);
  }

  _createDialogHeader(title, dialog) {
    const header = document.createElement("DIV");
    header.style.color = getComputedStyle(document.body).getPropertyValue(
      "color"
    );
    header.style.display = "flex";
    const button = document.createElement("mwc-icon-button");
    button.style.marginLeft = "-18px";
    button.onclick = function () {
      dialog.close();
    };
    header.appendChild(button);
    const icon = document.createElement("ha-svg-icon");
    icon.path = mdiClose;
    button.appendChild(icon);
    const title_element = document.createElement("P");
    title_element.style.margin = "10px 0px 0px 15px";
    title_element.innerText = title;
    header.appendChild(title_element);
    dialog.title_element = title_element;
    dialog.title_prefix_text = title;
    return header;
  }

  _createDialogRow(range, index, dialog) {
    const row = document.createElement("DIV");
    row.style.color = getComputedStyle(document.body).getPropertyValue("color");
    row.style.display = "flex";
    row.style.justifyContent = "space-around";

    const from_input = document.createElement("INPUT");
    from_input.setAttribute("type", "time");
    if (range.from !== null) {
      const time = range.from.split(":");
      from_input.value = time[0] + ":" + time[1];
    }
    from_input.onchange = function () {
      if (from_input.value === "") {
        return;
      }
      const time = from_input.value + ":00";
      if (range.from !== time) {
        range.from = time;
        this._saveBackendEntity(dialog);
      }
    }.bind(this);
    row.appendChild(from_input);

    const arrow = document.createElement("ha-svg-icon");
    arrow.style.marginTop = "10px";
    arrow.path = mdiArrow;
    row.appendChild(arrow);

    const to_input = document.createElement("INPUT");
    to_input.setAttribute("type", "time");
    if (range.to !== null) {
      const time = range.to.split(":");
      to_input.value = time[0] + ":" + time[1];
    }
    to_input.onchange = function () {
      if (to_input.value === "") {
        return;
      }
      const time = to_input.value + ":00";
      if (range.to !== time) {
        range.to = time;
        this._saveBackendEntity(dialog);
      }
    }.bind(this);
    row.appendChild(to_input);

    const button = document.createElement("mwc-icon-button");
    button.style.marginTop = "-3px";
    button.onclick = function () {
      dialog.schedule = dialog.schedule.filter((_, i) => i !== index);
      this._createDialogRows(dialog);
      this._saveBackendEntity(dialog);
    }.bind(this);
    row.appendChild(button);
    const icon = document.createElement("ha-svg-icon");
    icon.path = mdiTrash;
    button.appendChild(icon);

    return row;
  }

  _saveBackendEntity(dialog) {
    const title_text = dialog.title_prefix_text + " [UNSAVED]";
    if (title_text !== dialog.title_text) {
      dialog.title_element.innerText = title_text;
      dialog.title_text = title_text;
    }
    dialog.plus.button.disabled = true;

    for (const range of dialog.schedule) {
      if (range.from === null || range.to === null) {
        return;
      }
    }

    this._hass
      .callService("daily_schedule", "set", {
        entity_id: dialog.entity,
        schedule: dialog.schedule,
      })
      .then(() => {
        dialog.title_element.innerText = dialog.title_prefix_text;
        dialog.title_text = dialog.title_prefix_text;
        if (dialog.error.innerText !== "") {
          dialog.error.innerText = "";
        }
        dialog.plus.button.disabled = false;
      })
      .catch((error) => {
        dialog.title_element.innerText =
          dialog.title_prefix_text + " [INVALID, UNSAVED]";
        dialog.title_text = dialog.title_prefix_text;
        dialog.error.innerText = error.message;
        return Promise.reject(error);
      });
  }
}

customElements.define("daily-schedule-card", DailyScheduleCard);
