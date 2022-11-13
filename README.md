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

## Usage

![screenshot](https://user-images.githubusercontent.com/19599059/197408620-5f2860ce-aa38-4667-a0f0-631be0d7f61e.jpg)

[Usage demo clip](https://user-images.githubusercontent.com/19599059/197408059-6a481e9a-c1d6-4910-be08-127d134f5f33.mov)
