class DailyScheduleCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (!this._dialog) {
      this._createDialog();
      this.appendChild(this._dialog);
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
          entity
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

  _createCardRow(entity, name) {
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
    content.onclick = function () {
      this._dialog._entity = entity;
      this._dialog._title.innerText = name;
      this._dialog._message.innerText = "";
      this._dialog._plus._button.disabled = false;
      this._dialog._schedule = [...this._getStateSchedule(entity)];
      this._createDialogRows();
      this._dialog.show();
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

  _createDialog() {
    this._dialog = document.createElement("ha-dialog");
    this._dialog.heading = this._createDialogHeader();
    this._dialog.open = false;
    const plus = document.createElement("DIV");
    plus.style.color = getComputedStyle(document.body).getPropertyValue(
      "color"
    );
    plus.style.display = "flex";
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
      this._dialog._schedule.push({ from: null, to: null });
      this._createDialogRows();
      this._saveBackendEntity();
    }.bind(this);
    this._dialog._plus = plus;
    const message = document.createElement("P");
    message.style.display = "flex";
    message.style.color = "red";
    message.innerText = "";
    this._dialog._message = message;
  }

  _createDialogRows() {
    this._dialog.innerHTML = "";
    this._dialog._schedule.forEach((range, index) => {
      this._dialog.appendChild(this._createDialogRow(range, index));
    });
    this._dialog.appendChild(this._dialog._plus);
    this._dialog.appendChild(this._dialog._message);
  }

  _createDialogHeader() {
    const header = document.createElement("DIV");
    header.style.color = getComputedStyle(document.body).getPropertyValue(
      "color"
    );
    header.style.display = "flex";
    header.style.gap = "12px";
    header.style.alignItems = "start";
    const close = document.createElement("ha-icon");
    close.icon = "mdi:close";
    close.style.marginLeft = "-4px";
    close.style.cursor = "pointer";
    close.onclick = function () {
      this._dialog.close();
    }.bind(this);
    header.appendChild(close);
    const title = document.createElement("P");
    title.style.margin = "1px 0 0 0";
    header.appendChild(title);
    this._dialog._title = title;
    const more_info = document.createElement("ha-icon");
    more_info.icon = "mdi:information-outline";
    more_info.style.marginLeft = "auto";
    more_info.style.cursor = "pointer";
    more_info.onclick = function () {
      this._dialog.close();
      const event = new Event("hass-more-info", {
        bubbles: true,
        cancelable: false,
        composed: true,
      });
      event.detail = {entityId: this._dialog._entity};
      this.dispatchEvent(event);
    }.bind(this);
    header.appendChild(more_info);
    return header;
  }

  _createDialogRow(range, index) {
    const row = document.createElement("DIV");
    row.style.color = getComputedStyle(document.body).getPropertyValue("color");
    row.style.display = "flex";
    row.style.gap = "4px";
    row.style.alignItems = "center";
    if (index > 0) {
      row.style.marginTop = "12px";
    }

    const from_input = document.createElement("INPUT");
    from_input.setAttribute("type", "time");
    from_input.style.padding = "4px 0";
    from_input.style.cursor = "pointer";
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
        this._saveBackendEntity();
      }
    }.bind(this);
    row.appendChild(from_input);

    const arrow = document.createElement("ha-icon");
    arrow.icon = "mdi:arrow-right-thick";
    row.appendChild(arrow);

    const to_input = document.createElement("INPUT");
    to_input.setAttribute("type", "time");
    to_input.style.padding = "4px 0";
    to_input.style.cursor = "pointer";
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
        this._saveBackendEntity();
      }
    }.bind(this);
    row.appendChild(to_input);

    const remove = document.createElement("ha-icon");
    remove.icon = "mdi:delete-outline";
    remove.style.marginLeft = "auto";
    remove.style.cursor = "pointer";
    remove.onclick = function () {
      this._dialog._schedule = this._dialog._schedule.filter((_, i) => i !== index);
      this._createDialogRows();
      this._saveBackendEntity();
    }.bind(this);
    row.appendChild(remove);

    return row;
  }

  _saveBackendEntity() {
    this._dialog._plus._button.disabled = true;

    for (const range of this._dialog._schedule) {
      if (range.from === null || range.to === null) {
        if (this._dialog._message.innerText !== "Missing field(s).") {
          this._dialog._message.innerText = "Missing field(s).";
        }
        return;
      }
    }

    this._hass
      .callService("daily_schedule", "set", {
        entity_id: this._dialog._entity,
        schedule: this._dialog._schedule,
      })
      .then(() => {
        if (this._dialog._message.innerText.length > 0) {
          this._dialog._message.innerText = "";
        }
        this._dialog._plus._button.disabled = false;
      })
      .catch((error) => {
        if (this._dialog._message.innerText !== error.message) {
          this._dialog._message.innerText = error.message;
        }
        return Promise.reject(error);
      });
  }
}

customElements.define("daily-schedule-card", DailyScheduleCard);
