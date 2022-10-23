# Daily Schedule Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)

Dedicated UI for [Daily Schedule Integration](https://github.com/amitfin/daily_schedule) entities.

_Note: this card is optional. Its purpose is simplification, but it doesn't add functionality._

## Configuration

### General

| Name | Type | Required | Default | Description
| ---- | ---- | -------- | ------- | -----------
| type | string | True | - | Must be `custom:daily-schedule-card`
| title | string | False | - | Title of the card

### Entities

| Name | Type | Required | Default | Description
| ---- | ---- | -------- | ------- | -----------
| entity | string | True | - | The `binary_sensor` entity ID
| name | string | False | _Friendly name of the entity_ | Name to display

_Note: you can also just give the entity ID (with no `entity:`) if you don't need to specify the name explicitely._

### Example

```yaml
type: 'custom:daily-schedule-card'
title: Timers
entities:
  - entity: binary_sensor.venta_schedule
    name: Venta
  - binary_sensor.swimming_pool_filter_schedule
```

## Install

If you use [HACS](https://hacs.xyz/), the custom card will automatically be registered as needed.

If you don't use HACS, you can download js file from [latest releases](https://github.com/amitfin/lovelace-daily-schedule-card/releases/). Follow [these instructions](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources) to register the custom card.
