class DailyScheduleCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (!this._dialog) {
      this._getInputTimeWidth();
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
    if (
      this._config !== null &&
      JSON.stringify(this._config) === JSON.stringify(config)
    ) {
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
      row._template_value = entry.template || this._config.template;
      row.classList.add("card-content");
      if (this._hass.states[entity]) {
        const content = this._createCardRow(
          entity,
          entry.name ||
            this._hass.states[entity].attributes.friendly_name ||
            entity
        );
        row._content = content;
        this._setCardRowValue(row);
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
      row._content._icon.hass = this._hass;
      row._content._icon.stateObj = this._hass.states[row._entity];
      this._setCardRowValue(row);
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
    icon.hass = this._hass;
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
    content.appendChild(value_element);
    content.onclick = () => {
      this._dialog._entity = entity;
      this._dialog._title.innerText = name;
      this._dialog._message.innerText = "";
      this._dialog._plus._button.disabled = false;
      this._dialog._schedule = [...this._getStateSchedule(entity)];
      this._createDialogRows();
      this._dialog.show();
    };
    return content;
  }

  _getStateSchedule(entity, effective = false) {
    const state = this._hass.states[entity];
    return !state
      ? []
      : !effective
      ? state.attributes.schedule || []
      : state.attributes.effective_schedule || [];
  }

  _rowEntityChanged(row) {
    const entity_data = this._hass.states[row._entity]
      ? JSON.stringify(
          (({ state, attributes }) => ({ state, attributes }))(
            this._hass.states[row._entity]
          )
        )
      : null;
    const changed = row._entity_data !== entity_data;
    row._entity_data = entity_data;
    return changed;
  }

  _rowTemplateValue(row) {
    const subscribed = this._hass.connection.subscribeMessage(
      (message) => {
        row._content._value_element.innerHTML = message.result.length
          ? message.result
          : "&empty;";
        subscribed.then((unsub) => unsub());
      },
      {
        type: "render_template",
        template: row._template_value,
        variables: { entity_id: row._entity },
      }
    );
  }

  _setCardRowValue(row) {
    if (!this._rowEntityChanged(row)) {
      return;
    }
    if (!row._template_value) {
      let value = this._getStateSchedule(row._entity, true)
        .filter((range) => !range.disabled)
        .map((range) => range.from.slice(0, -3) + "-" + range.to.slice(0, -3))
        .join(", ");
      if (!value.length) {
        value = "&empty;";
      }
      row._content._value_element.innerHTML = value;
    } else {
      this._rowTemplateValue(row);
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
    plus.onclick = () => {
      if (button.disabled === true) {
        return;
      }
      this._dialog._schedule.push({ from: null, to: null });
      this._createDialogRows();
      this._saveBackendEntity();
    };
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
    close.onclick = () => {
      this._dialog.close();
    };
    header.appendChild(close);
    const title = document.createElement("P");
    title.style.margin = "1px 0 0 0";
    header.appendChild(title);
    this._dialog._title = title;
    const more_info = document.createElement("ha-icon");
    more_info.icon = "mdi:information-outline";
    more_info.style.marginLeft = "auto";
    more_info.style.cursor = "pointer";
    more_info.onclick = () => {
      this._dialog.close();
      const event = new Event("hass-more-info", {
        bubbles: true,
        cancelable: false,
        composed: true,
      });
      event.detail = { entityId: this._dialog._entity };
      this.dispatchEvent(event);
    };
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

    this._createTimeInput(range, "from", row);

    const arrow = document.createElement("ha-icon");
    arrow.icon = "mdi:arrow-right-thick";
    row.appendChild(arrow);

    this._createTimeInput(range, "to", row);

    const toggle = document.createElement("ha-switch");
    toggle.style.marginLeft = "auto";
    toggle.style.paddingLeft = "16px";
    toggle.checked = !range.disabled;
    toggle.addEventListener("change", () => {
      range.disabled = !range.disabled;
      this._saveBackendEntity();
    });
    row.appendChild(toggle);

    const remove = document.createElement("ha-icon");
    remove.icon = "mdi:delete-outline";
    remove.style.cursor = "pointer";
    remove.onclick = () => {
      this._dialog._schedule = this._dialog._schedule.filter(
        (_, i) => i !== index
      );
      this._createDialogRows();
      this._saveBackendEntity();
    };
    row.appendChild(remove);

    return row;
  }

  _createTimeInput(range, type, row) {
    const sunrise = "↑";
    const sunset = "↓";
    const time_input = document.createElement("INPUT");
    const type_symbol = document.createElement("ha-icon");

    if (
      range[type] &&
      (range[type][0] == sunrise || range[type][0] == sunset)
    ) {
      this._setInputType(
        range[type][0] == sunrise ? "sunrise" : "sunset",
        type_symbol,
        time_input,
        range[type].slice(1)
      );
    } else {
      this._setInputType("time", type_symbol, time_input, range[type]);
    }

    type_symbol.style.cursor = "pointer";
    type_symbol.onclick = () => {
      if (type_symbol._type == "time") {
        this._setInputType("sunrise", type_symbol, time_input, null);
      } else if (type_symbol._type == "sunrise") {
        this._setInputType("sunset", type_symbol, time_input, null);
      } else {
        this._setInputType("time", type_symbol, time_input, null);
      }
      time_input.onchange();
    };

    Object.assign(time_input.style, {
      width: `${this._input_time_width}px`,
      minWidth: `${this._input_time_width}px`,
      boxSizing: "border-box",
      padding: "4px 0",
      cursor: "pointer",
    });

    time_input.onchange = () => {
      if (!time_input.value) {
        range[type] = null;
        this._saveBackendEntity();
        return;
      }
      let value;
      if (type_symbol._type == "time") {
        value = time_input.value + ":00";
      } else {
        value = type_symbol._type == "sunrise" ? sunrise : sunset;
        if (time_input.value) {
          const value_int = parseInt(time_input.value);
          if (value_int) {
            value += `${value_int > 0 ? "+" : ""}${time_input.value}`;
          }
        }
      }
      if (range[type] !== value) {
        range[type] = value;
        this._saveBackendEntity();
      }
    };

    row.appendChild(type_symbol);
    row.appendChild(time_input);
  }

  _setInputType(type, symbol, input, value) {
    symbol._type = type;
    if (type == "sunrise" || type == "sunset") {
      input.type = "number";
      input.value = parseInt(value || "0");
      symbol.icon =
        type == "sunrise" ? "mdi:weather-sunny" : "mdi:weather-night";
    } else {
      input.type = "time";
      if (value) {
        const time = value.split(":");
        input.value = time[0] + ":" + time[1];
      } else if (input.value) {
        input.value = null;
      }
      symbol.icon = "mdi:clock-outline";
    }
  }

  _getInputTimeWidth() {
    if (!this._input_time_width) {
      const dummyInput = document.createElement("INPUT");
      dummyInput.type = "time";
      dummyInput.style.visibility = "hidden";
      this.appendChild(dummyInput);
      setTimeout(() => {
        this._input_time_width = dummyInput.getBoundingClientRect().width;
        this.removeChild(dummyInput);
      }, 0);
    }
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
