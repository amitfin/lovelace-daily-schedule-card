# Daily Schedule Card

[![HACS Badge](https://img.shields.io/badge/HACS-Default-31A9F4.svg?style=for-the-badge)](https://github.com/hacs/integration)

[![GitHub Release](https://img.shields.io/github/release/amitfin/lovelace-daily-schedule-card.svg?style=for-the-badge&color=blue)](https://github.com/amitfin/lovelace-daily-schedule-card/releases)

![Project Maintenance](https://img.shields.io/badge/maintainer-Amit%20Finkelstein-blue.svg?style=for-the-badge)

UI for [Daily Schedule Integration](https://github.com/amitfin/daily_schedule) entities.

_Note: The custom integration is a prerequisite and can be installed via HACS using this [link](https://my.home-assistant.io/redirect/hacs_repository/?owner=amitfin&repository=daily_schedule&category=integration)._

## Usage

<img width="601" alt="image" src="https://github.com/user-attachments/assets/44dee96b-72e3-4bbe-81d4-b88c3ce9cb63" />
<br>
<img width="342" src="https://github.com/user-attachments/assets/dbaf02e2-7bed-48d3-97cf-cc767ea93691" />
<br>
<img src="https://github.com/user-attachments/assets/7466f370-f22c-49dc-888a-35233d55f065" width="534"/>

## Configuration

### General

| Name     | Type   | Required | Default                       | Description                                                         |
| -------- | ------ | -------- | ----------------------------- | ------------------------------------------------------------------- |
| type     | string | True     | -                             | Must be `custom:daily-schedule-card`                                |
| title    | string | False    | -                             | Title of the card                                                   |
| card     | bool   | False    | _True if `title` is supplied_ | Whether to render an entire card or rows inside the `entities` card |
| template | string | False    | `Null`                        | Template for rendering the value. Has access to `entity_id`         |

### Entities

| Name     | Type   | Required | Default                       | Description                                     |
| -------- | ------ | -------- | ----------------------------- | ----------------------------------------------- |
| entity   | string | True     | -                             | The `binary_sensor` entity ID                   |
| name     | string | False    | _Friendly name of the entity_ | Name to display                                 |
| template | string | False    | `Null`                        | Per-entity template (overrides card's template) |

_Note: you can also just give the entity ID (with no `entity:`) if you don't need to specify the name explicitly._

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
template: >-
  {{ state_attr(entity_id, 'effective_schedule') |
  map(attribute='from') | map('truncate', 2, True, '')
  | join(' | ') }}
entities:
  - binary_sensor.let_the_dog_out
```

## Install

If you use [HACS](https://hacs.xyz/), the custom card will automatically be registered as needed.

If you don't use HACS, you can download js file from [latest releases](https://github.com/amitfin/lovelace-daily-schedule-card/releases/). Follow [these instructions](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources) to register the custom card.
