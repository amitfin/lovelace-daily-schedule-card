# Daily Schedule Card

[![HACS Badge](https://img.shields.io/badge/HACS-Default-31A9F4.svg?style=for-the-badge)](https://github.com/hacs/integration)

[![GitHub Release](https://img.shields.io/github/release/amitfin/lovelace-daily-schedule-card.svg?style=for-the-badge&color=blue)](https://github.com/amitfin/lovelace-daily-schedule-card/releases)

![Project Maintenance](https://img.shields.io/badge/maintainer-Amit%20Finkelstein-blue.svg?style=for-the-badge)


Dedicated UI for [Daily Schedule Integration](https://github.com/amitfin/daily_schedule) entities with an optimized view and simplyfied editing capabilities.

_Note: The custom integration is a prerequisite and can be installed via HACS using this [link](https://my.home-assistant.io/redirect/hacs_repository/?owner=amitfin&repository=daily_schedule&category=integration). This card is optional. Its purpose is simplification and improved user experience, but it doesn't add functionality._

## Configuration

### General

| Name | Type | Required | Default | Description
| ---- | ---- | -------- | ------- | -----------
| type | string | True | - | Must be `custom:daily-schedule-card`
| title | string | False | - | Title of the card
| card | bool | False | _True if `title` is supplied_ | Whether to render an entire card or rows inside the `entities` card

### Entities

| Name | Type | Required | Default | Description
| ---- | ---- | -------- | ------- | -----------
| entity | string | True | - | The `binary_sensor` entity ID
| name | string | False | _Friendly name of the entity_ | Name to display
| template | string | False | `Null` | Template for rendering the value. Has access to `entity_id`.

_Note: you can also just give the entity ID (with no `entity:`) if you don't need to specify the name explicitely._

### Entities Card Example

```yaml
type: entities
entities:
  - type: custom:daily-schedule-card
    entities:
      - entity: binary_sensor.venta_schedule
        name: Venta
```

### Entire Card Example

```yaml
type: custom:daily-schedule-card
title: Timers
entities:
  - binary_sensor.swimming_pool_filter_schedule
```

### Template Example

```yaml
type: custom:daily-schedule-card
card: true
entities:
  - entity: binary_sensor.let_the_dog_out
    template: >-
      {{ state_attr(entity_id, 'schedule') | rejectattr('disabled',
      'true') | map(attribute='from') | map('truncate', 2, True, '')
      | join(', ') }}
```

## Install

If you use [HACS](https://hacs.xyz/), the custom card will automatically be registered as needed.

If you don't use HACS, you can download js file from [latest releases](https://github.com/amitfin/lovelace-daily-schedule-card/releases/). Follow [these instructions](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources) to register the custom card.

## Usage

![demo](https://user-images.githubusercontent.com/19599059/212492789-a42c6e4e-a6af-4231-94eb-c01358994bbe.png)

[Usage demo clip](https://user-images.githubusercontent.com/19599059/212492805-c2cf0d27-2ea5-462e-b13f-73010eed1758.mov)
