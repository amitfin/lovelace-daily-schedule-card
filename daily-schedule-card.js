class DailyScheduleCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (!this._content) {
      this._content = this._createContent();
      if (this._config.title || this._config.card) {
        const card = document.createElement("ha-card");
        card.header = this._config.title;
        this._content.classList.add("card-content");
        card.appendChild(this._content);
        this.appendChild(card);
      } else {
        this.appendChild(this._content);
      }
    } else {
      this._updateContent();
    }
  }

  setConfig(config) {
    if (this._config !== null && JSON.stringify(this._config) === JSON.stringify(config)) {
      this._config = config;
      return;
    }
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    this._config = config;
    this.innerHTML = "";
    this._content = null;
  }

  getCardSize() {
    return this._config !== null ? this._config.entities.length : 1;
  }

  _createContent() {
    const content = document.createElement("DIV");
    content._rows = [];
    for (const entry of this._config.entities) {
      const entity = entry.entity || entry;
      const row = document.createElement("DIV");
      row._entity = entity;
      row.classList.add("card-content");
      if (this._hass.states[entity]) {
        const content = this._createCardRow(
          entity,
          entry.name ||
          this._hass.states[entity].attributes.friendly_name ||
          entity,
          row
        );
        row._content = content;
        row.appendChild(content);
      } else {
        row.innerText = "Entity not found: " + entry.entity;
      }
      content._rows.push(row);
      content.appendChild(row);
    }
    return content;
  }

  _updateContent() {
    for (const row of this._content._rows) {
      row._content._icon.stateObj = this._hass.states[row._entity];
      this._setCardRowValue(row._content, this._getStateSchedule(row._entity));
    }
  }

  _createCardRow(entity, name, parent) {
    const content = document.createElement("DIV");
    content.style.cursor = "pointer";
    content.style.display = "flex";
    content.style.alignItems = "center";
    content.style.gap = "16px";
    const icon = document.createElement("state-badge");
    icon.style.flex = "none";
    icon.stateObj = this._hass.states[entity];
    icon.stateColor = true;
    content._icon = icon;
    content.appendChild(icon);
    const name_element = document.createElement("P");
    name_element.innerText = name;
    content.appendChild(name_element);
    const value_element = document.createElement("P");
    value_element.style.marginLeft = "auto";
    value_element.style.textAlign = "right";
    content._value_element = value_element;
    this._setCardRowValue(content, this._getStateSchedule(entity));
    content.appendChild(value_element);
    const dialog = this._createDialog(entity, name);
    parent.appendChild(dialog);
    content.onclick = function () {
      dialog._message.innerText = "";
      dialog._plus._button.disabled = false;
      dialog._schedule = [...this._getStateSchedule(entity)];
      this._createDialogRows(dialog);
      dialog.show();
    }.bind(this);
    return content;
  }

  _getStateSchedule(entity) {
    const state = this._hass.states[entity];
    return !state ? [] : state.attributes.schedule || [];
  }

  _setCardRowValue(content, state) {
    let value = state
      .map((range) => range.from.slice(0, -3) + "-" + range.to.slice(0, -3))
      .join(", ");
    if (!value.length) {
      value = "&empty;";
    }
    if (content._value_element.innerHTML !== value) {
      content._value_element.innerHTML = value;
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
    plus._button = button;
    plus.appendChild(button);
    const icon = document.createElement("ha-icon");
    icon.style.marginTop = "-9px";
    icon.icon = "mdi:plus";
    button.appendChild(icon);
    const text = document.createElement("P");
    text.innerText = "Add Range";
    plus.appendChild(text);
    plus.onclick = function () {
      if (button.disabled === true) {
        return;
      }
      dialog._schedule.push({ from: null, to: null });
      this._createDialogRows(dialog);
      this._saveBackendEntity(dialog);
    }.bind(this);
    dialog._plus = plus;
    const message = document.createElement("P");
    message.style.display = "flex";
    message.style.justifyContent = "center";
    message.style.color = "red";
    message.innerText = "";
    dialog._message = message;
    return dialog;
  }

  _createDialogRows(dialog) {
    dialog.innerHTML = "";
    dialog._schedule.forEach((range, index) => {
      dialog.appendChild(this._createDialogRow(range, index, dialog));
    });
    dialog.appendChild(dialog._plus);
    dialog.appendChild(dialog._message);
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
    const icon = document.createElement("ha-icon");
    icon.style.marginTop = "-8px";
    icon.icon = "mdi:close";
    button.appendChild(icon);
    const title_element = document.createElement("P");
    title_element.style.margin = "10px 0px 0px 15px";
    title_element.innerText = title;
    header.appendChild(title_element);
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

    const arrow = document.createElement("ha-icon");
    arrow.style.marginTop = "10px";
    arrow.icon = "mdi:arrow-right-thick";
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
      dialog._schedule = dialog._schedule.filter((_, i) => i !== index);
      this._createDialogRows(dialog);
      this._saveBackendEntity(dialog);
    }.bind(this);
    row.appendChild(button);
    const icon = document.createElement("ha-icon");
    icon.style.marginTop = "-7px";
    icon.icon = "mdi:delete";
    button.appendChild(icon);

    return row;
  }

  _saveBackendEntity(dialog) {
    dialog._plus._button.disabled = true;

    for (const range of dialog._schedule) {
      if (range.from === null || range.to === null) {
        if (dialog._message.innerText !== "Missing filed(s).") {
          dialog._message.innerText = "Missing filed(s).";
        }
        return;
      }
    }

    this._hass
      .callService("daily_schedule", "set", {
        entity_id: dialog.entity,
        schedule: dialog._schedule,
      })
      .then(() => {
        if (dialog._message.innerText.length > 0) {
          dialog._message.innerText = "";
        }
        dialog._plus._button.disabled = false;
      })
      .catch((error) => {
        if (dialog._message.innerText !== error.message) {
          dialog._message.innerText = error.message;
        }
        return Promise.reject(error);
      });
  }
}

customElements.define("daily-schedule-card", DailyScheduleCard);
